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
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek  = new Date(startOfToday); startOfWeek.setDate(startOfToday.getDate() - 7)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalUsers,
    newToday,
    newThisWeek,
    newThisMonth,
    proUsers,
    totalAIToday,
    aiByFeature,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.count({ where: { isPro: true } }),

    // Total AI calls today across all features
    prisma.dailyAIUsage.aggregate({
      where: { date: now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) },
      _sum: { count: true },
    }),

    // AI calls by feature today
    prisma.dailyAIUsage.groupBy({
      by: ['feature'],
      where: { date: now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) },
      _sum: { count: true },
      orderBy: { _sum: { count: 'desc' } },
    }),

    // 10 most recent signups
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { email: true, username: true, isPro: true, createdAt: true },
    }),
  ])

  const mrr = proUsers * 6.99
  const freeUsers = totalUsers - proUsers
  const conversionRate = totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : '0'

  return NextResponse.json({
    users: {
      total: totalUsers,
      free: freeUsers,
      pro: proUsers,
      newToday,
      newThisWeek,
      newThisMonth,
      conversionRate,
    },
    revenue: {
      mrr: mrr.toFixed(2),
      arr: (mrr * 12).toFixed(2),
      proCount: proUsers,
    },
    ai: {
      totalToday: totalAIToday._sum.count ?? 0,
      byFeature: aiByFeature.map(f => ({
        feature: f.feature,
        count: f._sum.count ?? 0,
      })),
    },
    recentUsers,
  })
}
