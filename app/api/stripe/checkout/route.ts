import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })

// Annual price ($49.99/yr). Override via env to switch test/live; falls back to
// the live price so the annual option works without extra env config.
const ANNUAL_PRICE_ID = process.env.STRIPE_PRO_ANNUAL_PRICE_ID || 'price_1TgcmUCFqNow9CJ5jLGo1s5d'

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRO_PRICE_ID) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Plan from the request body: 'annual' → yearly price, anything else → monthly.
  let plan: 'monthly' | 'annual' = 'monthly'
  try { const body = await req.json(); if (body?.plan === 'annual') plan = 'annual' } catch {}
  const price = plan === 'annual' ? ANNUAL_PRICE_ID : process.env.STRIPE_PRO_PRICE_ID!

  try {
    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: session.user.email,
      line_items: [{ price, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?upgraded=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.NEXTAUTH_URL}/upgrade?cancelled=1`,
      metadata: {
        email: session.user.email.toLowerCase(),
        userId: (session.user as { id?: string }).id ?? '',
        plan,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err: any) {
    // Surface the real Stripe error (e.g. "No such price: …", test/live mismatch)
    // instead of a silent 500 that the client can only show as "something went wrong".
    console.error('Stripe checkout error:', { plan, price, message: err?.message })
    return NextResponse.json(
      { error: err?.message || 'Could not start checkout', plan },
      { status: 500 }
    )
  }
}
