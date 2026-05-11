import { NextResponse } from 'next/server'
import { getStockQuote, getHistoricalData, getStockNews, getAnalystData } from '@/lib/yahoo-finance'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { ticker: string } }) {
  const { ticker } = params
  const url = new URL(req.url)
  const type = url.searchParams.get('type') || 'quote'
  const range = (url.searchParams.get('range') || '1m') as '1d' | '1w' | '1m' | '3m' | '1y' | '5y'

  try {
    if (type === 'historical') {
      const data = await getHistoricalData(ticker, range)
      return NextResponse.json({ data })
    }

    if (type === 'news') {
      const news = await getStockNews(ticker)
      return NextResponse.json({ news })
    }

    const [quote, news, analyst] = await Promise.all([
      getStockQuote(ticker),
      getStockNews(ticker),
      getAnalystData(ticker),
    ])

    if (!quote) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 })
    }

    return NextResponse.json({ quote, news, analyst }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 })
  }
}
