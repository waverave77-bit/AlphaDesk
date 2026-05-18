import { NextResponse } from 'next/server'
import { getStockQuote, getHistoricalData, getStockNews, getAnalystData, getEarningsHistory } from '@/lib/yahoo-finance'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { ticker: string } }) {
  const { ticker } = params
  const url = new URL(req.url)
  const type = url.searchParams.get('type') || 'quote'
  const range = (url.searchParams.get('range') || '1m') as '1d' | '1w' | '1m' | '3m' | '6m' | 'ytd' | '1y' | '5y'

  try {
    if (type === 'historical') {
      const data = await getHistoricalData(ticker, range)
      return NextResponse.json({ data })
    }

    if (type === 'news') {
      const news = await getStockNews(ticker)
      return NextResponse.json({ news })
    }

    // getStockQuote must finish first — it populates the internal analyst cache
    // that getAnalystData reads. Running them in parallel causes a race condition
    // where getAnalystData finds an empty cache and its fallback fetch gets rate-limited.
    const [quote, news] = await Promise.all([
      getStockQuote(ticker),
      getStockNews(ticker),
    ])
    const [analyst, earningsHistory] = await Promise.all([
      getAnalystData(ticker),
      getEarningsHistory(ticker),
    ])

    if (!quote) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 })
    }

    return NextResponse.json({ quote, news, analyst, earningsHistory }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 })
  }
}
