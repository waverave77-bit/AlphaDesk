import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FREE_LIMITS } from '@/lib/pro'
import { prisma } from '@/lib/prisma'

/**
 * Lightweight gate check for the research page AI Analysis section.
 * Reports the user's eligibility WITHOUT incrementing their daily counter
 * (that only happens when an actual analysis runs on a cache miss).
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ signedIn: false })
  }

  const limit = FREE_LIMITS['ai-analysis'] ?? 2

  // Admin account = unlimited
  if (session.user.email === process.env.ADMIN_EMAIL) {
    return NextResponse.json({ signedIn: true, isPro: true, unlimited: true, emailVerified: true })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, isPro: true, emailVerified: true },
  })
  if (!user) return NextResponse.json({ signedIn: false })

  // Pro = unlimited
  if (user.isPro) {
    return NextResponse.json({ signedIn: true, isPro: true, unlimited: true, emailVerified: !!user.emailVerified })
  }

  // Must verify email before using AI
  if (!user.emailVerified) {
    return NextResponse.json({ signedIn: true, isPro: false, emailVerified: false, trialsLeft: 0, limit })
  }

  // Free user — read today's usage without incrementing
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const usage = await prisma.dailyAIUsage
    .findUnique({
      where: { userId_date_feature: { userId: user.id, date: today, feature: 'ai-analysis' } },
      select: { count: true },
    })
    .catch(() => null)

  const used = usage?.count ?? 0
  const trialsLeft = Math.max(0, limit - used)
  return NextResponse.json({ signedIn: true, isPro: false, emailVerified: true, trialsLeft, limit })
}
