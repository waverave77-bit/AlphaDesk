import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const STARTING_CASH = 100_000

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode') === 'monthly' ? 'monthly' : 'alltime'

  const portfolios = await prisma.virtualPortfolio.findMany({
    include: {
      user: { select: { name: true, email: true, username: true, isPro: true } },
      holdings: { select: { ticker: true, companyName: true, shares: true, avgCost: true } },
    },
    take: 100,
  })

  const entries = portfolios.map(p => {
    const monthlyBaseline = p.monthlyBaseline ?? STARTING_CASH
    const monthlyGainLoss = p.totalValue - monthlyBaseline
    const monthlyGainLossPct = monthlyBaseline > 0 ? (monthlyGainLoss / monthlyBaseline) * 100 : 0

    return {
      userId: p.userId,
      name: p.user.username || p.user.name || 'Anonymous',
      totalValue: p.totalValue,
      gainLoss: p.totalValue - STARTING_CASH,
      gainLossPct: ((p.totalValue - STARTING_CASH) / STARTING_CASH) * 100,
      monthlyGainLoss,
      monthlyGainLossPct,
      isMe: p.userId === session!.user!.id,
      isPro: p.user.isPro ?? false,
      holdings: p.holdings.map(h => ({
        ticker: h.ticker,
        companyName: h.companyName,
        shares: h.shares,
        avgCost: h.avgCost,
      })),
    }
  })

  // One entry per user — their best portfolio for the active mode (a Pro user
  // may have 2 portfolios; we don't double-list them on the leaderboard).
  const metric = (e: typeof entries[number]) => (mode === 'monthly' ? e.monthlyGainLossPct : e.totalValue)
  const bestByUser = new Map<string, typeof entries[number]>()
  for (const e of entries) {
    const prev = bestByUser.get(e.userId)
    if (!prev || metric(e) > metric(prev)) bestByUser.set(e.userId, e)
  }

  // Sort by the relevant metric
  const sorted = [...bestByUser.values()].sort((a, b) =>
    mode === 'monthly' ? b.monthlyGainLossPct - a.monthlyGainLossPct : b.totalValue - a.totalValue
  ).slice(0, 50)

  const board = sorted.map(({ userId, ...e }, i) => ({ ...e, rank: i + 1 }))

  return NextResponse.json({ board, mode })
}
