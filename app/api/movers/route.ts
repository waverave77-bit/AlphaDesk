import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface Mover {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
}

async function getMovers(scrId: string): Promise<Mover[]> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds=${scrId}&count=10`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(8000),
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    const quotes: any[] = data?.finance?.result?.[0]?.quotes ?? []
    return quotes.map((q) => ({
      ticker: q.symbol ?? '',
      name: q.shortName ?? q.longName ?? q.symbol ?? '',
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
    }))
  } catch {
    return []
  }
}

export async function GET() {
  const [gainers, losers] = await Promise.all([
    getMovers('day_gainers'),
    getMovers('day_losers'),
  ])

  return NextResponse.json(
    { gainers, losers, source: 'Yahoo Finance' },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  )
}
