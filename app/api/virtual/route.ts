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
        resetAt: startOfNextMonth(),
        monthlyBaseline: STARTING_CASH,
        monthlyResetAt: new Date(),
      },
      include: { holdings: true, trades: true },
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
        ...portfolio!.holdings[i],
        currentPrice: portfolio!.holdings[i].avgCost,
        currentValue: portfolio!.holdings[i].avgCost * portfolio!.holdings[i].shares,
        gainLoss: 0,
        gainLossPct: 0,
      }
    )
  }

  const investedValue = holdingsWithPrices.reduce((s, h) => s + h.currentValue, 0)
  const totalValue = portfolio.cash + investedValue
  const totalGainLoss = totalValue - STARTING_CASH
  const totalGainLossPct = (totalGainLoss / STARTING_CASH) * 100

  // Roll over monthly baseline if it's a new month
  const monthlyResetAt = portfolio.monthlyResetAt ?? new Date(0)
  const needsMonthlyReset = isNewMonth(monthlyResetAt)
  const monthlyBaseline = needsMonthlyReset ? totalValue : (portfolio.monthlyBaseline ?? STARTING_CASH)

  const monthlyGainLoss = totalValue - monthlyBaseline
  const monthlyGainLossPct = monthlyBaseline > 0 ? (monthlyGainLoss / monthlyBaseline) * 100 : 0

  // Persist updated totalValue and monthly baseline if needed
  await prisma.virtualPortfolio.update({
    where: { id: portfolio.id },
    data: {
      totalValue,
      ...(needsMonthlyReset ? { monthlyBaseline: totalValue, monthlyResetAt: new Date() } : {}),
    },
  })

  return NextResponse.json({
    cash: portfolio.cash,
    totalValue,
    totalGainLoss,
    totalGainLossPct,
    monthlyGainLoss,
    monthlyGainLossPct,
    holdings: holdingsWithPrices,
    trades: portfolio.trades,
  })
}
