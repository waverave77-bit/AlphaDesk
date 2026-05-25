import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { sendProUpgradeEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })

// POST — verify a Stripe checkout session and activate Pro if payment is confirmed
// This is the fallback path if the webhook hasn't fired yet or failed
export async function POST(req: NextRequest) {
  const authSession = await getServerSession(authOptions)
  if (!authSession?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { sessionId } = await req.json()
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 })
  }

  try {
    // Retrieve the checkout session directly from Stripe
    const checkoutSession = await getStripe().checkout.sessions.retrieve(sessionId)

    // Verify payment was actually completed
    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({ isPro: false, reason: 'payment_not_completed' })
    }

    // Security: verify the session belongs to the logged-in user
    const sessionEmail = (
      checkoutSession.metadata?.email ?? checkoutSession.customer_details?.email
    )?.toLowerCase().trim()

    if (sessionEmail && sessionEmail !== authSession.user.email.toLowerCase()) {
      console.warn(`[VerifySession] Email mismatch: session=${sessionEmail}, auth=${authSession.user.email}`)
      return NextResponse.json({ error: 'Session does not belong to this account' }, { status: 403 })
    }

    // Check if user is already Pro (webhook may have already fired)
    const user = await prisma.user.findUnique({
      where: { email: authSession.user.email },
      select: { id: true, isPro: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.isPro) {
      // Already activated (webhook beat us to it)
      return NextResponse.json({ isPro: true, alreadyActive: true })
    }

    // Activate Pro — webhook either hasn't fired yet or failed
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isPro: true,
        stripeCustomerId: checkoutSession.customer as string ?? undefined,
        stripeSubscriptionId: checkoutSession.subscription as string ?? undefined,
        proSince: new Date(),
        proCancelledAt: null,
      },
    })

    console.log(`[VerifySession] Pro activated for ${authSession.user.email} via session ${sessionId}`)
    sendProUpgradeEmail(authSession.user.email).catch(() => {})

    return NextResponse.json({ isPro: true, activated: true })
  } catch (err) {
    console.error('[VerifySession] Error:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
