import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function fetchYahoo(ticker: string) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=30d`,
    { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store', signal: AbortSignal.timeout(5000) }
  )
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return res.json()
}

export async function GET() {
  try {
    const [vixData, spData] = await Promise.allSettled([
      fetchYahoo('%5EVIX'),
      fetchYahoo('%5EGSPC'),
    ])

    const vix: number = vixData.status === 'fulfilled'
      ? (vixData.value?.chart?.result?.[0]?.meta?.regularMarketPrice ?? 20)
      : 20

    const spMeta = spData.status === 'fulfilled'
      ? spData.value?.chart?.result?.[0]?.meta
      : null
    const spChange: number = spMeta
      ? ((spMeta.regularMarketPrice - spMeta.chartPreviousClose) / spMeta.chartPreviousClose) * 100
      : 0

    // 30-day S&P momentum
    let momentum = 0
    if (spData.status === 'fulfilled') {
      const closes: number[] = spData.value?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
      const valid = closes.filter(Boolean)
      if (valid.length >= 2) {
        momentum = ((valid[valid.length - 1] - valid[0]) / valid[0]) * 100
      }
    }

    // VIX score: VIX 10→90, VIX 20→50, VIX 40→10 (inverted: high VIX = fear)
    const vixScore = Math.max(0, Math.min(100, 110 - vix * 3))
    // Daily momentum bonus: ±2% day → ±15 pts
    const dayBonus = Math.max(-15, Math.min(15, spChange * 7.5))
    // 30-day trend: ±5% month → ±10 pts
    const trendBonus = Math.max(-10, Math.min(10, momentum * 2))

    const score = Math.max(0, Math.min(100, Math.round(vixScore + dayBonus + trendBonus)))

    let rating: string
    if (score <= 25)      rating = 'Extreme Fear'
    else if (score <= 44) rating = 'Fear'
    else if (score <= 55) rating = 'Neutral'
    else if (score <= 74) rating = 'Greed'
    else                  rating = 'Extreme Greed'

    return NextResponse.json(
      { score, rating, vix: Math.round(vix * 10) / 10, spChange: Math.round(spChange * 100) / 100 },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    )
  } catch {
    return NextResponse.json({ score: 50, rating: 'Neutral', vix: null, spChange: null, error: true })
  }
}
