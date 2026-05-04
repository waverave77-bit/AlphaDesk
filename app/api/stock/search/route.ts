import { NextResponse } from 'next/server'
import { searchStocks } from '@/lib/yahoo-finance'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q')

  if (!q || q.length < 1) {
    return NextResponse.json({ results: [] })
  }

  try {
    const results = await searchStocks(q)
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
