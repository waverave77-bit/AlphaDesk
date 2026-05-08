export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

const SECTOR_MAP: Record<string, string> = {
  XLK: 'Technology',
  XLV: 'Healthcare',
  XLF: 'Financials',
  XLE: 'Energy',
  XLI: 'Industrials',
  XLB: 'Materials',
  XLRE: 'Real Estate',
  XLU: 'Utilities',
  XLC: 'Comm Services',
  XLY: 'Cons Disc',
  XLP: 'Cons Staples',
}

export async function GET() {
  try {
    const symbols = Object.keys(SECTOR_MAP).join(',')
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AlphaDesk/1.0)',
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch sector data' }, { status: 502 })
    }

    const data = await res.json()
    const quotes = data?.quoteResponse?.result ?? []

    const sectors = quotes
      .map((q: { symbol: string; regularMarketChangePercent?: number; regularMarketPrice?: number }) => ({
        symbol: q.symbol,
        name: SECTOR_MAP[q.symbol] ?? q.symbol,
        changePercent: q.regularMarketChangePercent ?? 0,
        price: q.regularMarketPrice ?? 0,
      }))
      .sort(
        (a: { changePercent: number }, b: { changePercent: number }) =>
          b.changePercent - a.changePercent
      )

    return NextResponse.json(sectors)
  } catch (error) {
    console.error('Sector heatmap fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
