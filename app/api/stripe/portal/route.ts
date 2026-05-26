import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })

export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, stripeCustomerId: true, isPro: true },
  })

  let customerId = user?.stripeCustomerId

  // Fallback: if we don't have a stripeCustomerId saved (e.g. webhook failed),
  // search Stripe by email to find the customer
  if (!customerId) {
    try {
      const customers = await getStripe().customers.list({
        email: session.user.email,
        limit: 1,
      })
      if (customers.data.length > 0) {
        customerId = customers.data[0].id
        // Save it so future calls work instantly
        if (user?.id) {
          await prisma.user.update({
            where: { id: user.id },
            data: { stripeCustomerId: customerId },
          }).catch(() => {})
        }
      }
    } catch {}
  }

  if (!customerId) {
    return NextResponse.json({ error: 'No subscription found. Contact support@mrguyinvests.com' }, { status: 404 })
  }

  let portalSession: Stripe.BillingPortal.Session
  try {
    portalSession = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXTAUTH_URL}/settings`,
    })
  } catch (err) {
    console.error('[Portal] Failed to create billing portal session:', err)
    return NextResponse.json({ error: 'Could not open billing portal. Please try again.' }, { status: 502 })
  }

  return NextResponse.json({ url: portalSession.url })
}
