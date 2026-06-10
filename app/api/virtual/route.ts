import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const STARTING_CASH = 100_000

function startOfNextMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 1)
}

function isNewMonth(date: Date) {
  const now = new Date()
  return date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let portfolios = await prisma.virtualPortfolio.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
    include: { holdings: true, trades: { orderBy: { executedAt: 'desc' }, take: 20 } },
  })

  // Create the first portfolio on first visit
  if (portfolios.length === 0) {
    const created = await prisma.virtualPortfolio.create({
      data: {
        userId: session.user.id,
        name: 'Main Portfolio',
        cash: STARTING_CASH,
        totalValue: STARTING_CASH,
        season: 1,
        resetAt: startOfNextMonth(),
        monthlyBaseline: STARTING_CASH,
        monthlyResetAt: new Date(),
      },
      include: { holdings: true, trades: { orderBy: { executedAt: 'desc' }, take: 20 } },
    })
    portfolios = [created]
  }

  // Pick the active portfolio (by ?portfolioId, else the oldest)
  const wantedId = new URL(req.url).searchParams.get('portfolioId')
  const active = portfolios.find((p) => p.id === wantedId) ?? portfolios[0]

  // Fetch live prices for the active portfolio's holdings
  let holdingsWithPrices: any[] = []
  if (active.holdings.length > 0) {
    const priceResults = await Promise.allSettled(
      active.holdings.map(async (h) => {
        const r = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/stock/${h.ticker}`, { cache: 'no-store' })
        const data = await r.json()
        const price = data?.quote?.price ?? h.avgCost
        return {
          ...h,
          currentPrice: price,
          currentValue: price * h.shares,
          gainLoss: (price - h.avgCost) * h.shares,
          gainLossPct: ((price - h.avgCost) / h.avgCost) * 100,
        }
      })
    )
    holdingsWithPrices = priceResults.map((r, i) =>
      r.status === 'fulfilled' ? r.value : {
        ...active.holdings[i],
        currentPrice: active.holdings[i].avgCost,
        currentValue: active.holdings[i].avgCost * active.holdings[i].shares,
        gainLoss: 0,
        gainLossPct: 0,
      }
    )
  }

  const investedValue = holdingsWithPrices.reduce((s, h) => s + h.currentValue, 0)
  const totalValue = active.cash + investedValue
  const totalGainLoss = totalValue - STARTING_CASH
  const totalGainLossPct = (totalGainLoss / STARTING_CASH) * 100

  // Roll over monthly baseline if it's a new month
  const monthlyResetAt = active.monthlyResetAt ?? new Date(0)
  const needsMonthlyReset = isNewMonth(monthlyResetAt)
  const monthlyBaseline = needsMonthlyReset ? totalValue : (active.monthlyBaseline ?? STARTING_CASH)
  const monthlyGainLoss = totalValue - monthlyBaseline
  const monthlyGainLossPct = monthlyBaseline > 0 ? (monthlyGainLoss / monthlyBaseline) * 100 : 0

  await prisma.virtualPortfolio.update({
    where: { id: active.id },
    data: { totalValue, ...(needsMonthlyReset ? { monthlyBaseline: totalValue, monthlyResetAt: new Date() } : {}) },
  })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isPro: true } })

  return NextResponse.json({
    cash: active.cash,
    totalValue,
    totalGainLoss,
    totalGainLossPct,
    monthlyGainLoss,
    monthlyGainLossPct,
    holdings: holdingsWithPrices,
    trades: active.trades,
    activePortfolioId: active.id,
    activePortfolioName: active.name,
    portfolios: portfolios.map((p) => ({ id: p.id, name: p.name })),
    canAddPortfolio: !!user?.isPro && portfolios.length < 2,
    isPro: !!user?.isPro,
  })
}
