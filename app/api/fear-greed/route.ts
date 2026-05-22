import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// ── Primary: CNN Fear & Greed Index (real score, 7 indicators) ─────────────────
async function fetchCNNFearGreed(): Promise<{ score: number; rating: string } | null> {
  try {
    const res = await fetch(
      'https://production.dataviz.cnn.io/index/fearandgreed/graphdata',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.cnn.com/markets/fear-and-greed',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(6000),
        cache: 'no-store',
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const score: number = data?.fear_and_greed?.score
    const rating: string = data?.fear_and_greed?.rating
    if (typeof score !== 'number') return null
    return { score: Math.round(score * 10) / 10, rating }
  } catch {
    return null
  }
}

// ── Fallback: VIX + S&P momentum approximation ────────────────────────────────
async function fetchYahoo(ticker: string) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=30d`,
    { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store', signal: AbortSignal.timeout(5000) }
  )
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return res.json()
}

async function fetchFallback(): Promise<{ score: number; rating: string; vix: number | null; spChange: number | null }> {
  const [vixData, spData] = await Promise.allSettled([
    fetchYahoo('%5EVIX'),
    fetchYahoo('%5EGSPC'),
  ])

  const vix: number = vixData.status === 'fulfilled'
    ? (vixData.value?.chart?.result?.[0]?.meta?.regularMarketPrice ?? 20)
    : 20

  const spMeta = spData.status === 'fulfilled' ? spData.value?.chart?.result?.[0]?.meta : null
  const spChange: number = spMeta
    ? ((spMeta.regularMarketPrice - spMeta.chartPreviousClose) / spMeta.chartPreviousClose) * 100
    : 0

  let momentum = 0
  if (spData.status === 'fulfilled') {
    const closes: number[] = spData.value?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
    const valid = closes.filter(Boolean)
    if (valid.length >= 2) {
      momentum = ((valid[valid.length - 1] - valid[0]) / valid[0]) * 100
    }
  }

  // VIX 10→80, VIX 20→50, VIX 30→20 (inverted: high VIX = fear)
  const vixScore = Math.max(0, Math.min(100, 110 - vix * 3))
  const dayBonus  = Math.max(-15, Math.min(15, spChange * 7.5))
  const trendBonus = Math.max(-10, Math.min(10, momentum * 2))
  const score = Math.max(0, Math.min(100, Math.round(vixScore + dayBonus + trendBonus)))

  let rating: string
  if (score <= 25)      rating = 'Extreme Fear'
  else if (score <= 44) rating = 'Fear'
  else if (score <= 55) rating = 'Neutral'
  else if (score <= 74) rating = 'Greed'
  else                  rating = 'Extreme Greed'

  return { score, rating, vix: Math.round(vix * 10) / 10, spChange: Math.round(spChange * 100) / 100 }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    // Also fetch VIX + S&P change for display alongside the score
    const [cnn, vixSp] = await Promise.allSettled([
      fetchCNNFearGreed(),
      Promise.allSettled([fetchYahoo('%5EVIX'), fetchYahoo('%5EGSPC')]),
    ])

    // Extract VIX and S&P change for the ticker bar regardless of which score we use
    let vix: number | null = null
    let spChange: number | null = null
    if (vixSp.status === 'fulfilled') {
      const [vixRes, spRes] = vixSp.value
      if (vixRes.status === 'fulfilled') {
        vix = Math.round((vixRes.value?.chart?.result?.[0]?.meta?.regularMarketPrice ?? 0) * 10) / 10 || null
      }
      if (spRes.status === 'fulfilled') {
        const m = spRes.value?.chart?.result?.[0]?.meta
        if (m) spChange = Math.round(((m.regularMarketPrice - m.chartPreviousClose) / m.chartPreviousClose) * 10000) / 100
      }
    }

    // Use CNN real score if available
    if (cnn.status === 'fulfilled' && cnn.value) {
      const { score, rating } = cnn.value
      // Normalise CNN's lowercase rating to title case
      const ratingMap: Record<string, string> = {
        'extreme fear': 'Extreme Fear',
        'fear': 'Fear',
        'neutral': 'Neutral',
        'greed': 'Greed',
        'extreme greed': 'Extreme Greed',
      }
      return NextResponse.json(
        { score, rating: ratingMap[rating.toLowerCase()] ?? rating, vix, spChange, source: 'cnn' },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
      )
    }

    // Fallback to VIX approximation
    console.warn('[fear-greed] CNN API unavailable, using VIX fallback')
    const fallback = await fetchFallback()
    return NextResponse.json(
      { ...fallback, vix: fallback.vix ?? vix, spChange: fallback.spChange ?? spChange, source: 'vix_approx' },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    )
  } catch (e: any) {
    return NextResponse.json({ score: 50, rating: 'Neutral', vix: null, spChange: null, error: true })
  }
}
