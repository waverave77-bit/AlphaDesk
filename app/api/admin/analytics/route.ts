import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Compute session duration + recent pages from an activity log
// A "session" = any sequence of visits with no more than 30 min gap
function computeLastSession(activity: { page: string; visitedAt: Date }[]) {
  if (!activity.length) return null

  // Sort most recent first
  const sorted = [...activity].sort((a, b) => b.visitedAt.getTime() - a.visitedAt.getTime())

  // Walk forward until we hit a gap > 30 min
  const SESSION_GAP_MS = 30 * 60 * 1000
  const sessionPages: { page: string; visitedAt: Date }[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const gap = sessionPages[sessionPages.length - 1].visitedAt.getTime() - sorted[i].visitedAt.getTime()
    if (gap > SESSION_GAP_MS) break
    sessionPages.push(sorted[i])
  }

  const start = sessionPages[sessionPages.length - 1].visitedAt
  const end   = sessionPages[0].visitedAt
  const durationMs = end.getTime() - start.getTime()

  // Dedupe pages (keep order, most recent first)
  const seen = new Set<string>()
  const uniquePages = sessionPages
    .map(a => a.page)
    .filter(p => { if (seen.has(p)) return false; seen.add(p); return true })

  return {
    start:      start.toISOString(),
    end:        end.toISOString(),
    durationMs,
    pages:      uniquePages.slice(0, 8),   // cap at 8 pages for display
    pageCount:  sessionPages.length,
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000)

  const startOfToday = new Date(todayStr + 'T00:00:00.000Z')
  const startOfWeek  = new Date(startOfToday); startOfWeek.setUTCDate(startOfToday.getUTCDate() - 7)
  const etMonthStr   = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).slice(0, 7) + '-01'
  const startOfMonth = new Date(etMonthStr + 'T00:00:00.000Z')

  const [
    liveNow,
    totalUsers,
    proUsers,
    newToday,
    newThisWeek,
    newThisMonth,
    experienceLevels,
    topPagesToday,
    aiToday,
    aiAllTime,
    allUsers,
    onboardingResponses,
    guestToday,
    guestThisWeek,
  ] = await Promise.all([
    prisma.user.count({ where: { lastActiveAt: { gte: fiveMinAgo } } }),
    prisma.user.count(),
    prisma.user.count({ where: { isPro: true } }),
    prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),

    prisma.user.groupBy({ by: ['experienceLevel'], _count: { _all: true } }),

    prisma.pageView.findMany({
      where: { date: todayStr },
      orderBy: { count: 'desc' },
      take: 12,
    }),

    prisma.dailyAIUsage.groupBy({
      by: ['feature'],
      where: { date: todayStr },
      _sum: { count: true },
      orderBy: { _sum: { count: 'desc' } },
    }),

    prisma.dailyAIUsage.groupBy({
      by: ['feature'],
      _sum: { count: true },
      orderBy: { _sum: { count: 'desc' } },
    }),

    // All users, sorted by most recently active
    prisma.user.findMany({
      orderBy: { lastActiveAt: { sort: 'desc', nulls: 'last' } },
      select: {
        id: true,
        email: true,
        username: true,
        isPro: true,
        experienceLevel: true,
        createdAt: true,
        lastActiveAt: true,
        // last 20 activity records per user
        activity: {
          orderBy: { visitedAt: 'desc' },
          take: 20,
          select: { page: true, visitedAt: true },
        },
      },
    }),

    prisma.onboardingResponse.findMany({ select: { goals: true } }),

    // Guest visits today
    prisma.guestVisit.findUnique({ where: { date: todayStr } }),

    // Guest visits this week (sum last 7 days)
    prisma.guestVisit.findMany({
      where: {
        date: {
          gte: startOfWeek.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }),
        },
      },
    }),
  ])

  // Tally onboarding goals
  const goalCounts: Record<string, number> = {}
  for (const r of onboardingResponses) {
    try {
      const goals = JSON.parse(r.goals) as string[]
      for (const g of goals) goalCounts[g] = (goalCounts[g] ?? 0) + 1
    } catch {}
  }

  const expMap: Record<string, number> = {}
  for (const e of experienceLevels) expMap[e.experienceLevel] = e._count._all

  const mrr = proUsers * 4.99
  const freeUsers = totalUsers - proUsers

  const guestWeekTotal = guestThisWeek.reduce((s, g) => s + g.count, 0)

  // Build enriched user list with session info
  const usersWithActivity = allUsers.map(u => ({
    id:              u.id,
    email:           u.email,
    username:        u.username,
    isPro:           u.isPro,
    experienceLevel: u.experienceLevel,
    createdAt:       u.createdAt.toISOString(),
    lastActiveAt:    u.lastActiveAt?.toISOString() ?? null,
    lastSession:     computeLastSession(
      u.activity.map(a => ({ page: a.page, visitedAt: a.visitedAt }))
    ),
  }))

  return NextResponse.json({
    liveNow,
    users: {
      total: totalUsers,
      pro: proUsers,
      free: freeUsers,
      newToday,
      newThisWeek,
      newThisMonth,
      conversionRate: totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : '0',
      mrr: mrr.toFixed(2),
      arr: (mrr * 12).toFixed(2),
    },
    guests: {
      today: guestToday?.count ?? 0,
      thisWeek: guestWeekTotal,
    },
    experienceLevels: {
      beginner:    expMap['beginner']    ?? 0,
      some:        expMap['some']        ?? 0,
      experienced: expMap['experienced'] ?? 0,
    },
    topPagesToday,
    aiToday:  aiToday.map(f  => ({ feature: f.feature,  count: f._sum.count ?? 0 })),
    aiAllTime: aiAllTime.map(f => ({ feature: f.feature, count: f._sum.count ?? 0 })),
    goalCounts,
    onboardingTotal: onboardingResponses.length,
    allUsers: usersWithActivity,
  })
}
