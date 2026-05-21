import { NextResponse } from 'next/server'
import { checkAILimit } from '@/lib/pro'
import { getStockQuote } from '@/lib/yahoo-finance'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const limited = await checkAILimit('quant')
  if (limited) return limited

  const { searchParams } = new URL(req.url)
  const ticker = searchParams.get('ticker')
  if (!ticker) return NextResponse.json({ error: 'Ticker required' }, { status: 400 })

  try {
    const quote = await getStockQuote(ticker.toUpperCase())
    if (!quote) return NextResponse.json({ error: 'Ticker not found' }, { status: 404 })
    return NextResponse.json({ quote })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 })
  }
}
