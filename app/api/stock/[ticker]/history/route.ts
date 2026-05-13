import { NextResponse } from 'next/server'
import { getHistoricalData } from '@/lib/yahoo-finance'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { ticker: string } }) {
  const url = new URL(req.url)
  const range = (url.searchParams.get('range') || '3m') as '1m' | '3m' | '1y' | '5y'
  try {
    const history = await getHistoricalData(params.ticker, range)
    return NextResponse.json({ history })
  } catch {
    return NextResponse.json({ history: [] })
  }
}
