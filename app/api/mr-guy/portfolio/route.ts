import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMultipleQuotes } from '@/lib/yahoo-finance'

export const dynamic = 'force-dynamic'

// Fallback if there are no Hot Take entries yet
const FALLBACK_PICKS = [
  { ticker: 'NVDA', costBasis: 875, shares: 22.86 },
  { ticker: 'AAPL', costBasis: 189, shares: 105.82 },
  { ticker: 'META', costBasis: 527, shares: 37.95 },
  { ticker: 'BRK-B', costBasis: 370, shares: 54.05 },
  { ticker: 'SPY', costBasis: 547, shares: 36.56 },
]
const MR_GUY_START = 100_000

export interface MrGuyHolding {
  ticker: string
  companyName: string
  shares: number
  avgCost: number
  currentPrice: number
  currentValue: number
  gainLoss: number
  gainLossPct: number
  timesPickedByMrGuy: number
}

export interface MrGuyPortfolioResult {
  holdings: MrGuyHolding[]
  totalValue: number
  gainLoss: number
  gainLossPct: number
  source: 'hot-takes' | 'fallback'
  pickCount: number
}

export async function GET() {
  try {
    // Read all Hot Take history from DB
    const allCached = await prisma.hotTakeCache.findMany({ orderBy: { date: 'asc' } })

    let picksToUse: { ticker: string; costBasis: number; shares: number }[] = []
    let source: 'hot-takes' | 'fallback' = 'fallback'

    if (allCached.length >= 1) {
      // Group picks by ticker — count how many times Mr. Guy picked each
      const tickerData: Record<string, { count: number; firstPrice: number; companyName: string }> = {}

      for (const entry of allCached) {
        try {
          const d = JSON.parse(entry.data)
          if (!d.ticker) continue
          if (!tickerData[d.ticker]) {
            tickerData[d.ticker] = { count: 0, firstPrice: d.price ?? 0, companyName: d.companyName ?? d.ticker }
          }
          tickerData[d.ticker].count++
        } catch { continue }
      }

      const uniqueTickers = Object.keys(tickerData)
      if (uniqueTickers.length > 0) {
        // Equal-weight by pick count: more picks = bigger position
        const totalPicks = Object.values(tickerData).reduce((s, v) => s + v.count, 0)
        picksToUse = uniqueTickers.map(ticker => {
          const weight = tickerData[ticker].count / totalPicks
          const allocated = MR_GUY_START * weight
          const costBasis = tickerData[ticker].firstPrice > 0 ? tickerData[ticker].firstPrice : 1
          return { ticker, costBasis, shares: allocated / costBasis }
        })
        source = 'hot-takes'
      }
    }

    if (picksToUse.length === 0) {
      picksToUse = FALLBACK_PICKS
      source = 'fallback'
    }

    // Fetch live prices
    const tickers = picksToUse.map(p => p.ticker)
    const quotesMap = await getMultipleQuotes(tickers)

    let totalValue = 0
    const holdings: MrGuyHolding[] = picksToUse.map(p => {
      const quote = quotesMap.get(p.ticker)
      const currentPrice = quote?.price ?? p.costBasis
      const currentValue = currentPrice * p.shares
      const costValue = p.costBasis * p.shares
      totalValue += currentValue

      // Count how many times this ticker was picked (for hot-takes source)
      let timesPickedByMrGuy = 1
      if (source === 'hot-takes') {
        try {
          const parsed = allCached
            .map(e => { try { return JSON.parse(e.data) } catch { return null } })
            .filter(Boolean)
          timesPickedByMrGuy = parsed.filter(d => d.ticker === p.ticker).length
        } catch {}
      }

      return {
        ticker: p.ticker,
        companyName: quote?.companyName ?? p.ticker,
        shares: p.shares,
        avgCost: p.costBasis,
        currentPrice,
        currentValue,
        gainLoss: currentValue - costValue,
        gainLossPct: ((currentValue - costValue) / costValue) * 100,
        timesPickedByMrGuy,
      }
    })

    const result: MrGuyPortfolioResult = {
      holdings,
      totalValue,
      gainLoss: totalValue - MR_GUY_START,
      gainLossPct: ((totalValue - MR_GUY_START) / MR_GUY_START) * 100,
      source,
      pickCount: allCached.length,
    }

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
