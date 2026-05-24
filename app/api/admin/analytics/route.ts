import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek  = new Date(startOfToday); startOfWeek.setDate(startOfToday.getDate() - 7)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Build last 14 days date strings for signup trend
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(startOfToday)
    d.setDate(d.getDate() - (13 - i))
    return d.toLocaleDateString('en-CA')
  })

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
    recentUsers,
    onboardingResponses,
  ] = await Promise.all([
    // Live now: lastActiveAt within 5 min
    prisma.user.count({ where: { lastActiveAt: { gte: fiveMinAgo } } }),

    prisma.user.count(),
    prisma.user.count({ where: { isPro: true } }),
    prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),

    // Experience level breakdown from real User data
    prisma.user.groupBy({
      by: ['experienceLevel'],
      _count: { _all: true },
    }),

    // Top pages today
    prisma.pageView.findMany({
      where: { date: todayStr },
      orderBy: { count: 'desc' },
      take: 12,
    }),

    // AI usage today by feature
    prisma.dailyAIUsage.groupBy({
      by: ['feature'],
      where: { date: todayStr },
      _sum: { count: true },
      orderBy: { _sum: { count: 'desc' } },
    }),

    // AI usage all time by feature
    prisma.dailyAIUsage.groupBy({
      by: ['feature'],
      _sum: { count: true },
      orderBy: { _sum: { count: 'desc' } },
    }),

    // Recent signups
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { email: true, username: true, isPro: true, experienceLevel: true, createdAt: true, lastActiveAt: true },
    }),

    // Onboarding goals
    prisma.onboardingResponse.findMany({ select: { goals: true } }),
  ])

  // Signup trend: count per day for last 14 days
  const signupsByDay = await Promise.all(
    last14Days.map(async (dateStr) => {
      const start = new Date(dateStr + 'T00:00:00')
      const end   = new Date(dateStr + 'T23:59:59')
      const count = await prisma.user.count({ where: { createdAt: { gte: start, lte: end } } })
      return { date: dateStr, count }
    })
  )

  // Tally goals from onboarding responses
  const goalCounts: Record<string, number> = {}
  for (const r of onboardingResponses) {
    try {
      const goals = JSON.parse(r.goals) as string[]
      for (const g of goals) {
        goalCounts[g] = (goalCounts[g] ?? 0) + 1
      }
    } catch {}
  }

  // Experience level map
  const expMap: Record<string, number> = {}
  for (const e of experienceLevels) {
    expMap[e.experienceLevel] = e._count._all
  }

  const mrr = proUsers * 4.99
  const freeUsers = totalUsers - proUsers

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
    experienceLevels: {
      beginner:    expMap['beginner']    ?? 0,
      some:        expMap['some']        ?? 0,
      experienced: expMap['experienced'] ?? 0,
    },
    topPagesToday,
    aiToday: aiToday.map(f => ({ feature: f.feature, count: f._sum.count ?? 0 })),
    aiAllTime: aiAllTime.map(f => ({ feature: f.feature, count: f._sum.count ?? 0 })),
    signupsByDay,
    goalCounts,
    onboardingTotal: onboardingResponses.length,
    recentUsers,
  })
}
