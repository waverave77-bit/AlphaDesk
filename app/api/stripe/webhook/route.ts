/**
 * Stripe webhook handler
 *
 * TO PUBLISH:
 * 1. Install stripe: `npm install stripe`
 * 2. Add to Vercel env:
 *      STRIPE_SECRET_KEY=sk_live_...
 *      STRIPE_WEBHOOK_SECRET=whsec_...
 * 3. In Stripe dashboard → Webhooks → add endpoint:
 *      https://mrguyinvests.com/api/stripe/webhook
 *    Events to listen for:
 *      - checkout.session.completed
 *      - customer.subscription.updated
 *      - customer.subscription.deleted
 * 4. Uncomment the Stripe import and remove the TODO comment below
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// TODO: uncomment when stripe package is installed
// import Stripe from 'stripe'
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

export async function POST(req: Request) {
  // ── GUARD: block until Stripe env vars are set ──────────────────────
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  /* ── UNCOMMENT THIS BLOCK WHEN GOING LIVE ──────────────────────────
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    const body = await req.text()
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const email = session.customer_details?.email
      if (!email) break
      await prisma.user.update({
        where: { email },
        data: {
          isPro: true,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          proSince: new Date(),
          proCancelledAt: null,
        },
      })
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const isActive = sub.status === 'active' || sub.status === 'trialing'
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { isPro: isActive },
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { isPro: false, proCancelledAt: new Date() },
      })
      break
    }
  }
  ── END UNCOMMENT BLOCK ─────────────────────────────────────────── */

  return NextResponse.json({ received: true })
}
