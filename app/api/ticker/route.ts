import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SYMBOLS = [
  { key: 'sp500',   symbol: '^GSPC',   label: 'S&P 500',   format: 'price' },
  { key: 'nasdaq',  symbol: '^IXIC',   label: 'NASDAQ',    format: 'price' },
  { key: 'dow',     symbol: '^DJI',    label: 'DOW',       format: 'price' },
  { key: 'vix',     symbol: '^VIX',    label: 'VIX',       format: 'price' },
  { key: 'btc',     symbol: 'BTC-USD', label: 'BTC',       format: 'crypto' },
  { key: 'eth',     symbol: 'ETH-USD', label: 'ETH',       format: 'crypto' },
  { key: 'gold',    symbol: 'GC=F',    label: 'Gold',      format: 'price' },
  { key: 'oil',     symbol: 'CL=F',    label: 'Crude Oil', format: 'price' },
  { key: 'dxy',     symbol: 'DX=F',    label: 'DXY',       format: 'price' },
]

async function fetchQuote(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    })
    if (!r.ok) return null
    const data = await r.json()
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta) return null
    const price = meta.regularMarketPrice ?? 0
    const prev = meta.chartPreviousClose ?? meta.regularMarketPreviousClose ?? price
    const change = price - prev
    const changePercent = prev ? (change / prev) * 100 : 0
    return {
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
    }
  } catch {
    return null
  }
}

async function fetchFearGreed() {
  try {
    const r = await fetch('https://api.alternative.me/fng/?limit=1', { next: { revalidate: 3600 } })
    if (!r.ok) return null
    const data = await r.json()
    const entry = data?.data?.[0]
    if (!entry) return null
    return { value: parseInt(entry.value), label: entry.value_classification as string }
  } catch {
    return null
  }
}

export async function GET() {
  const [quotes, fearGreed] = await Promise.all([
    Promise.all(SYMBOLS.map(s => fetchQuote(s.symbol).then(q => ({ ...s, quote: q })))),
    fetchFearGreed(),
  ])

  const items = quotes
    .filter(s => s.quote !== null)
    .map(s => ({
      key: s.key,
      label: s.label,
      price: s.quote!.price,
      change: s.quote!.change,
      changePercent: s.quote!.changePercent,
      format: s.format,
    }))

  if (fearGreed) {
    items.push({
      key: 'feargreed',
      label: 'Fear & Greed',
      price: fearGreed.value,
      change: 0,
      changePercent: 0,
      format: 'feargreed',
    } as any)
  }

  return NextResponse.json({ items }, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  })
}
