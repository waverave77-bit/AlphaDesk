import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { sendProUpgradeEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    const body = await req.text()
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      // Prefer metadata.email (set at checkout creation from the authenticated session)
      // Fall back to customer_details.email if metadata is missing
      const email = (session.metadata?.email ?? session.customer_details?.email)?.toLowerCase().trim()
      const customerId = session.customer as string | undefined
      const subscriptionId = session.subscription as string | undefined

      if (!email && !customerId) {
        console.error('[Webhook] checkout.session.completed: no email or customerId in event', event.id)
        break
      }

      try {
        // Try email lookup first
        if (email) {
          const user = await prisma.user.findUnique({ where: { email } })
          if (user) {
            await prisma.user.update({
              where: { email },
              data: {
                isPro: true,
                stripeCustomerId: customerId ?? undefined,
                stripeSubscriptionId: subscriptionId ?? undefined,
                proSince: new Date(),
                proCancelledAt: null,
              },
            })
            console.log(`[Webhook] Pro activated for ${email} (user: ${user.id})`)
            sendProUpgradeEmail(email).catch(err => console.error('Pro email error:', err))
            break
          }
          console.warn(`[Webhook] No user found with email: ${email}`)
        }

        // Fallback: look up by stripeCustomerId if already set
        if (customerId) {
          const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } })
          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                isPro: true,
                stripeSubscriptionId: subscriptionId ?? undefined,
                proSince: new Date(),
                proCancelledAt: null,
              },
            })
            console.log(`[Webhook] Pro activated for customerId ${customerId} (user: ${user.id})`)
            sendProUpgradeEmail(user.email).catch(err => console.error('Pro email error:', err))
            break
          }
        }

        // Nothing matched — log full details so we can manually fix
        console.error(
          '[Webhook] CRITICAL: checkout.session.completed — could not find user to activate Pro.',
          JSON.stringify({ eventId: event.id, email, customerId, subscriptionId })
        )
      } catch (err) {
        console.error('[Webhook] Error processing checkout.session.completed:', err)
        // Return 500 so Stripe retries (transient DB errors should be retried)
        return NextResponse.json({ error: 'DB error' }, { status: 500 })
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const isActive = sub.status === 'active' || sub.status === 'trialing'
      try {
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { isPro: isActive },
        })
      } catch (err) {
        console.error('[Webhook] Error processing customer.subscription.updated:', err)
        return NextResponse.json({ error: 'DB error' }, { status: 500 })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      try {
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { isPro: false, proCancelledAt: new Date() },
        })
      } catch (err) {
        console.error('[Webhook] Error processing customer.subscription.deleted:', err)
        return NextResponse.json({ error: 'DB error' }, { status: 500 })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
