import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const INDICES = [
  { ticker: '%5EGSPC', label: 'S&P 500' },
  { ticker: '%5EIXIC', label: 'NASDAQ' },
  { ticker: '%5EDJI',  label: 'Dow Jones' },
  { ticker: '%5EVIX',  label: 'VIX' },
]

async function fetchIndex(ticker: string, label: string) {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=2d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta) throw new Error('No meta')
    const price: number = meta.regularMarketPrice ?? 0
    const prev: number = meta.chartPreviousClose ?? price
    const change = price - prev
    const changePercent = prev ? (change / prev) * 100 : 0
    return { label, price, change, changePercent }
  } catch {
    return { label, price: null, change: null, changePercent: null }
  }
}

export async function GET() {
  const results = await Promise.all(INDICES.map(({ ticker, label }) => fetchIndex(ticker, label)))
  return NextResponse.json({ indices: results }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
