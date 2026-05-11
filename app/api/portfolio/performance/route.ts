import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getHistoricalData } from '@/lib/yahoo-finance'

export const dynamic = 'force-dynamic'

type Range = '1w' | '1m' | '1y'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const range = (url.searchParams.get('range') ?? '1m') as Range

  // Map our range to the yahoo-finance helper format
  const yfRange: Record<Range, '1w' | '1m' | '1y'> = { '1w': '1w', '1m': '1m', '1y': '1y' }

  const holdings = await prisma.holding.findMany({
    where: { userId: session.user.id },
    select: { ticker: true, shares: true, purchasePrice: true, purchaseDate: true },
  })

  if (!holdings.length) return NextResponse.json({ points: [] })

  const tickers = Array.from(new Set(holdings.map(h => h.ticker)))

  // Fetch historical price data for all tickers concurrently
  const priceHistories = await Promise.all(
    tickers.map(ticker =>
      getHistoricalData(ticker, yfRange[range]).then(data => ({ ticker, data }))
    )
  )

  // Build a map: ticker → { date → close price }
  const priceMap = new Map<string, Map<string, number>>()
  for (const { ticker, data } of priceHistories) {
    const dateMap = new Map<string, number>()
    for (const point of data) {
      const day = point.date.slice(0, 10) // YYYY-MM-DD
      dateMap.set(day, point.close)
    }
    priceMap.set(ticker, dateMap)
  }

  // Collect all unique dates across all tickers, sorted
  const allDates = Array.from(
    new Set(priceHistories.flatMap(({ data }) => data.map(d => d.date.slice(0, 10))))
  ).sort()

  if (!allDates.length) return NextResponse.json({ points: [] })

  // For each date, calculate total portfolio value
  // Only count holdings that were purchased on or before that date
  const points = allDates.map(date => {
    let totalValue = 0

    for (const holding of holdings) {
      const purchaseDay = holding.purchaseDate
        ? new Date(holding.purchaseDate).toISOString().slice(0, 10)
        : null

      // Skip holdings purchased after this date
      if (purchaseDay && purchaseDay > date) continue

      const tickerPrices = priceMap.get(holding.ticker)
      const price = tickerPrices?.get(date) ?? null

      if (price) {
        totalValue += holding.shares * price
      } else {
        // Use cost basis as fallback for this holding if no price on this date
        totalValue += holding.shares * holding.purchasePrice
      }
    }

    return {
      date,
      value: parseFloat(totalValue.toFixed(2)),
    }
  })

  return NextResponse.json({ points }, {
    headers: { 'Cache-Control': 'private, s-maxage=300' },
  })
}
