/**
 * Creates a Stripe Checkout session and returns the URL to redirect to.
 *
 * TO PUBLISH:
 * 1. Install stripe: `npm install stripe`
 * 2. Set STRIPE_SECRET_KEY + STRIPE_PRO_PRICE_ID in Vercel env
 *    (create a recurring $5/month price in Stripe dashboard first)
 * 3. Uncomment the Stripe block below
 * 4. Hook up the "Upgrade" button on /upgrade to POST /api/stripe/checkout
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// TODO: uncomment when stripe package is installed
// import Stripe from 'stripe'
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRO_PRICE_ID) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  /* ── UNCOMMENT THIS BLOCK WHEN GOING LIVE ──────────────────────────
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: session.user.email,
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?upgraded=1`,
    cancel_url:  `${process.env.NEXTAUTH_URL}/upgrade?cancelled=1`,
    metadata: { email: session.user.email },
  })
  return NextResponse.json({ url: checkoutSession.url })
  ── END UNCOMMENT BLOCK ─────────────────────────────────────────── */

  return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
}
