import { NextResponse } from 'next/server'

async function getDXY() {
  try {
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/DX=F?interval=1d&range=1mo', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    })
    if (!r.ok) return null
    const data = await r.json()
    const meta = data?.chart?.result?.[0]?.meta
    const timestamps: number[] = data?.chart?.result?.[0]?.timestamp ?? []
    const closes: number[] = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
    const history = timestamps.map((t: number, i: number) => ({
      date: new Date(t * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      close: closes[i] ? parseFloat(closes[i].toFixed(2)) : null,
    })).filter((d: any) => d.close !== null).slice(-20)

    const prev = meta?.chartPreviousClose ?? meta?.regularMarketPrice
    const price = meta?.regularMarketPrice ?? 0
    const change = price - prev
    const changePercent = prev ? (change / prev) * 100 : 0
    return { price: parseFloat(price.toFixed(2)), change: parseFloat(change.toFixed(2)), changePercent: parseFloat(changePercent.toFixed(2)), history }
  } catch {
    return null
  }
}

async function getM2() {
  try {
    const r = await fetch('https://fred.stlouisfed.org/graph/fredgraph.csv?id=M2SL', {
      next: { revalidate: 86400 },
    })
    if (!r.ok) return []
    const text = await r.text()
    const lines = text.trim().split('\n').slice(1)
    return lines.slice(-12).map(line => {
      const [date, value] = line.split(',')
      return { date: date.trim(), value: parseFloat(value.trim()) }
    })
  } catch {
    return []
  }
}

export async function GET() {
  const [dxy, m2] = await Promise.all([getDXY(), getM2()])

  let stockImpact = 'Dollar relatively stable: neutral impact on equities.'
  if (dxy) {
    if (dxy.changePercent > 0.4) stockImpact = 'Dollar strengthening: generally bearish for stocks, especially multinationals and commodities exporters. Strong dollar reduces overseas earnings when converted back to USD.'
    else if (dxy.changePercent < -0.4) stockImpact = 'Dollar weakening: generally bullish for stocks, commodities, and companies with international revenue. Weaker dollar boosts overseas earnings in USD terms.'
  }

  const m2Recent = m2.slice(-2)
  let m2Impact = 'Monitoring money supply trends.'
  if (m2Recent.length === 2) {
    const m2Change = m2Recent[1].value - m2Recent[0].value
    if (m2Change > 0) m2Impact = 'M2 expanding: increased liquidity in the system is historically supportive of risk assets and equities.'
    else m2Impact = 'M2 contracting: reduced liquidity may weigh on risk assets. Monitor Fed policy for shifts.'
  }

  return NextResponse.json({ dxy, m2, stockImpact, m2Impact })
}
