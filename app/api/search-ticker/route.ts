import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  if (!q.trim() || q.length < 2) return NextResponse.json({ results: [] })

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=6&newsCount=0&listsCount=0`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(4000),
      }
    )
    if (!res.ok) return NextResponse.json({ results: [] })
    const data = await res.json()
    const quotes: any[] = data?.quotes ?? []
    const results = quotes
      .filter(q => q.quoteType === 'EQUITY' || q.typeDisp === 'Equity')
      .slice(0, 5)
      .map(q => ({
        symbol: q.symbol as string,
        name: (q.shortname ?? q.longname ?? q.symbol) as string,
      }))
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
