import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMultipleQuotes } from '@/lib/yahoo-finance'

export const dynamic = 'force-dynamic'

const STARTING_CASH = 100_000

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode') === 'monthly' ? 'monthly' : 'alltime'

  const portfolios = await prisma.virtualPortfolio.findMany({
    include: {
      user: { select: { name: true, email: true, username: true, isPro: true } },
      holdings: { select: { ticker: true, companyName: true, shares: true, avgCost: true } },
    },
    take: 100,
  })

  // Recompute every portfolio's value from LIVE prices rather than trusting the
  // stored totalValue column — that column is only refreshed when a user opens
  // their own portfolio page, so the leaderboard would otherwise freeze for
  // anyone who isn't actively browsing. Fetch each unique ticker once, shared
  // across all portfolios.
  const tickers = Array.from(new Set(portfolios.flatMap(p => p.holdings.map(h => h.ticker))))
  const quotes = tickers.length > 0 ? await getMultipleQuotes(tickers) : new Map()
  const priceFor = (ticker: string, fallback: number) => quotes.get(ticker)?.price ?? fallback

  const entries = portfolios.map(p => {
    const investedValue = p.holdings.reduce(
      (s, h) => s + priceFor(h.ticker, h.avgCost) * h.shares,
      0
    )
    const liveTotalValue = p.cash + investedValue

    const monthlyBaseline = p.monthlyBaseline ?? STARTING_CASH
    const monthlyGainLoss = liveTotalValue - monthlyBaseline
    const monthlyGainLossPct = monthlyBaseline > 0 ? (monthlyGainLoss / monthlyBaseline) * 100 : 0

    return {
      userId: p.userId,
      name: p.user.username || p.user.name || 'Anonymous',
      totalValue: liveTotalValue,
      gainLoss: liveTotalValue - STARTING_CASH,
      gainLossPct: ((liveTotalValue - STARTING_CASH) / STARTING_CASH) * 100,
      monthlyGainLoss,
      monthlyGainLossPct,
      isMe: !!session?.user?.id && p.userId === session.user.id,
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
