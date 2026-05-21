import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const INDICES = [
  { ticker: '%5EGSPC', label: 'S&P 500' },
  { ticker: '%5EIXIC', label: 'NASDAQ' },
  { ticker: '%5EDJI',  label: 'Dow Jones' },
  { ticker: '%5EVIX',  label: 'VIX' },
]

async function fetchHistoricalIndex(ticker: string, label: string, dateStr: string) {
  try {
    // Use market close time and a ±5 day window to handle weekends/holidays
    const date = new Date(dateStr + 'T20:00:00Z')
    const period1 = Math.floor(date.getTime() / 1000) - 86400 * 5
    const period2 = Math.floor(date.getTime() / 1000) + 86400 * 5

    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&period1=${period1}&period2=${period2}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      }
    )
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const data = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result) throw new Error('No result')

    const timestamps: number[] = result.timestamp ?? []
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? []
    if (!timestamps.length) throw new Error('No timestamps')

    // Find the last trading day on or before the target
    const target = date.getTime() / 1000
    let best = -1
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] == null) continue
      if (timestamps[i] <= target) best = i
    }
    if (best === -1) best = closes.findIndex(c => c != null)
    if (best === -1) throw new Error('No valid close')

    const prev = best > 0 ? (closes[best - 1] ?? closes[best]) : closes[best]
    const price = closes[best]
    const change = price - prev
    const changePercent = prev ? (change / prev) * 100 : 0

    return {
      label,
      price,
      change,
      changePercent,
      date: new Date(timestamps[best] * 1000).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      }),
    }
  } catch {
    return { label, price: null, change: null, changePercent: null, date: null }
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const results = await Promise.all(
    INDICES.map(({ ticker, label }) => fetchHistoricalIndex(ticker, label, date))
  )

  const sp = results.find(r => r.label === 'S&P 500')
  const vix = results.find(r => r.label === 'VIX')

  let brief = ''
  try {
    const spDesc = sp?.changePercent != null
      ? `${sp.changePercent >= 0 ? 'up' : 'down'} ${Math.abs(sp.changePercent).toFixed(1)}%`
      : 'data unavailable'
    const vixDesc = vix?.price != null ? ` VIX was ${vix.price.toFixed(1)}.` : ''

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `You are Mr. Guy, a sarcastic but loveable pixel-art finance mascot with a sharp memory for market history. The user time-traveled to ${date}. S&P 500 was ${spDesc}.${vixDesc} Give exactly 2 punchy sentences about what was happening in markets on or around this date — include real historical context if you know it, plus Mr. Guy's emotional reaction. Be specific and fun.`,
      }],
    })
    brief = (msg.content[0] as { type: string; text: string }).text ?? ''
  } catch {
    brief = ''
  }

  return NextResponse.json({ indices: results, brief })
}
