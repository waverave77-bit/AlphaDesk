import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Monthly price in USD cents (used on the upgrade page) */
export const PRO_PRICE_CENTS = 699  // $6.99

/** Per-feature daily limits for free users. Pro & admin = unlimited. */
export const FREE_LIMITS: Record<string, number> = {
  'chat':          3,
  'ai-analysis':   2,
  'spike-summary': 5,
  'report-card':   3,
  'bull-vs-bear':  5,
  'hot-take':      999, // one cached take per day — no meaningful limit
  'reality-check': 5,
  'am-i-dumb':     5,
  'bs-checker':    5,
  'translator':    999, // effectively unlimited — simple educational tool
}

/**
 * Returns true if the current session user has an active Pro subscription.
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
 * Call at the start of any AI API route to enforce per-feature free-tier limits.
 *
 * Pass the feature name (must match a key in FREE_LIMITS).
 * Returns a 429 NextResponse if over limit, or null if allowed.
 *
 * Usage:
 *   const limited = await checkAILimit('chat')
 *   if (limited) return limited
 */
export async function checkAILimit(feature: string): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Admin account always gets unlimited access
  if (session.user.email === process.env.ADMIN_EMAIL) return null

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, isPro: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }

  // Pro users have unlimited AI requests
  if (user.isPro) return null

  const limit = FREE_LIMITS[feature] ?? 5
  // Use Eastern Time so limits reset at midnight ET (matches the trading day)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) // "YYYY-MM-DD"

  const usage = await prisma.dailyAIUsage.upsert({
    where: { userId_date_feature: { userId: user.id, date: today, feature } },
    update: { count: { increment: 1 } },
    create: { userId: user.id, date: today, feature, count: 1 },
  })

  if (usage.count > limit) {
    return NextResponse.json(
      {
        error: 'Daily AI limit reached',
        limitReached: true,
        feature,
        limit,
        upgradeUrl: '/upgrade',
      },
      { status: 429 }
    )
  }

  return null
}

/**
 * Returns the full user row including pro status.
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
