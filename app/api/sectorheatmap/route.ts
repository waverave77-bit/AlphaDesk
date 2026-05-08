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
    // Use spark endpoint — works without crumb/auth
    const url = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${symbols}&range=1d&interval=1d`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      next: { revalidate: 300 },
    })

    if (!res.ok) throw new Error('Yahoo Finance error')

    const data = await res.json()

    const sectors = Object.entries(SECTOR_MAP).map(([symbol, name]) => {
      const v = data[symbol] ?? {}
      const closes: number[] = v.close ?? []
      const close = closes.length > 0 ? closes[closes.length - 1] : null
      const prev: number | null = v.chartPreviousClose ?? null
      const changePercent = close && prev ? parseFloat(((close - prev) / prev * 100).toFixed(2)) : null
      return { symbol, name, price: close, changePercent }
    })
      .filter(s => s.changePercent !== null)
      .sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0))

    return NextResponse.json(sectors)
  } catch (error) {
    console.error('Sector heatmap fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
