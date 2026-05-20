/**
 * Pro subscription helpers
 *
 * TO PUBLISH:
 * 1. Run prisma migrate to add isPro/stripe fields to User
 * 2. Set STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET in Vercel env
 * 3. Wire /api/stripe/checkout route to create a Stripe checkout session
 * 4. Enable the Stripe webhook at /api/stripe/webhook
 * 5. Replace FREE_LIMIT with whatever you decide on
 * 6. Uncomment the isPro check in each gated API route
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** How many AI requests a free user gets per day */
export const FREE_DAILY_AI_LIMIT = 10

/** Monthly price in USD cents (used on the upgrade page) */
export const PRO_PRICE_CENTS = 500  // $5.00

/**
 * Returns true if the current session user has an active Pro subscription.
 * Safe to call from any server component or API route.
 */
export async function currentUserIsPro(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return false
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isPro: true },
  })
  return user?.isPro ?? false
}

/**
 * Returns the full user row including pro status.
 * Use this when you need more than just isPro.
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  return prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      isPro: true,
      stripeCustomerId: true,
      proSince: true,
      proCancelledAt: true,
    },
  })
}
