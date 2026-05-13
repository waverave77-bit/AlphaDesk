import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const SEASON_DAYS = 30
const STARTING_CASH = 100_000

function nextResetDate() {
  const d = new Date()
  d.setDate(d.getDate() + SEASON_DAYS)
  return d
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let portfolio = await prisma.virtualPortfolio.findUnique({
    where: { userId: session.user.id },
    include: { holdings: true, trades: { orderBy: { executedAt: 'desc' }, take: 20 } },
  })

  // Create portfolio if first visit
  if (!portfolio) {
    portfolio = await prisma.virtualPortfolio.create({
      data: {
        userId: session.user.id,
        cash: STARTING_CASH,
        totalValue: STARTING_CASH,
        season: 1,
        resetAt: nextResetDate(),
      },
      include: { holdings: true, trades: true },
    })
  }

  // Season reset if expired
  if (new Date() > portfolio.resetAt) {
    await prisma.virtualSeasonRecord.upsert({
      where: { userId_season: { userId: session.user.id, season: portfolio.season } },
      create: { userId: session.user.id, season: portfolio.season, finalValue: portfolio.totalValue },
      update: { finalValue: portfolio.totalValue },
    })
    await prisma.virtualHolding.deleteMany({ where: { portfolioId: portfolio.id } })
    portfolio = await prisma.virtualPortfolio.update({
      where: { id: portfolio.id },
      data: { cash: STARTING_CASH, totalValue: STARTING_CASH, season: portfolio.season + 1, resetAt: nextResetDate() },
      include: { holdings: true, trades: { orderBy: { executedAt: 'desc' }, take: 20 } },
    })
  }

  // Fetch live prices for holdings
  let holdingsWithPrices: any[] = []
  if (portfolio.holdings.length > 0) {
    const priceResults = await Promise.allSettled(
      portfolio.holdings.map(async (h) => {
        const r = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/stock/${h.ticker}`, { cache: 'no-store' })
        const data = await r.json()
        const price = data?.quote?.price ?? h.avgCost
        return { ...h, currentPrice: price, currentValue: price * h.shares, gainLoss: (price - h.avgCost) * h.shares, gainLossPct: ((price - h.avgCost) / h.avgCost) * 100 }
      })
    )
    holdingsWithPrices = priceResults.map((r, i) =>
      r.status === 'fulfilled' ? r.value : { ...portfolio!.holdings[i], currentPrice: portfolio!.holdings[i].avgCost, currentValue: portfolio!.holdings[i].avgCost * portfolio!.holdings[i].shares, gainLoss: 0, gainLossPct: 0 }
    )
  }

  const investedValue = holdingsWithPrices.reduce((s, h) => s + h.currentValue, 0)
  const totalValue = portfolio.cash + investedValue
  const totalGainLoss = totalValue - STARTING_CASH
  const totalGainLossPct = (totalGainLoss / STARTING_CASH) * 100

  // Update stored totalValue
  await prisma.virtualPortfolio.update({ where: { id: portfolio.id }, data: { totalValue } })

  return NextResponse.json({
    cash: portfolio.cash,
    totalValue,
    totalGainLoss,
    totalGainLossPct,
    season: portfolio.season,
    resetAt: portfolio.resetAt,
    holdings: holdingsWithPrices,
    trades: portfolio.trades,
  })
}
