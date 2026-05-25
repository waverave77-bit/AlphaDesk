import { NextResponse } from 'next/server'
import { getStockQuote } from '@/lib/yahoo-finance'

export const dynamic = 'force-dynamic'

interface IndexData {
  ticker: string
  price: number
  changePercent: number
  change: number
}

interface BriefingCache {
  cachedAt: number
  briefing: string
  indices: { spy: IndexData | null; qqq: IndexData | null; dia: IndexData | null }
  date: string
  headlines: string[]
}

let cache: BriefingCache | null = null
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

async function callGrok(system: string, user: string): Promise<string> {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) throw new Error('XAI_API_KEY not set')

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-3',
      max_tokens: 400,
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: user   },
      ],
      // Live search gives Grok real-time market news and X sentiment
      search_parameters: {
        mode: 'auto',
        sources: [{ type: 'web' }, { type: 'x' }],
      },
    }),
    signal: AbortSignal.timeout(25000),
  })

  if (!res.ok) throw new Error(`Grok API error: ${res.status}`)
  const json = await res.json()
  return (json.choices?.[0]?.message?.content ?? '').trim()
}

export async function GET() {
  if (cache && Date.now() - cache.cachedAt < CACHE_TTL) {
    return NextResponse.json({
      briefing: cache.briefing,
      indices: cache.indices,
      date: cache.date,
      headlines: cache.headlines,
    })
  }

  // Fetch live index prices from Yahoo Finance — precise real-time numbers
  const [spyRaw, qqqRaw, diaRaw] = await Promise.allSettled([
    getStockQuote('SPY'),
    getStockQuote('QQQ'),
    getStockQuote('DIA'),
  ])

  const spy = spyRaw.status === 'fulfilled' && spyRaw.value
    ? { ticker: 'SPY', price: spyRaw.value.price, changePercent: spyRaw.value.changePercent, change: spyRaw.value.change }
    : null
  const qqq = qqqRaw.status === 'fulfilled' && qqqRaw.value
    ? { ticker: 'QQQ', price: qqqRaw.value.price, changePercent: qqqRaw.value.changePercent, change: qqqRaw.value.change }
    : null
  const dia = diaRaw.status === 'fulfilled' && diaRaw.value
    ? { ticker: 'DIA', price: diaRaw.value.price, changePercent: diaRaw.value.changePercent, change: diaRaw.value.change }
    : null

  const indexBlock = [
    spy ? `S&P 500 (SPY): $${spy.price.toFixed(2)} (${spy.changePercent >= 0 ? '+' : ''}${spy.changePercent.toFixed(2)}%)` : 'S&P 500: unavailable',
    qqq ? `NASDAQ (QQQ): $${qqq.price.toFixed(2)} (${qqq.changePercent >= 0 ? '+' : ''}${qqq.changePercent.toFixed(2)}%)` : 'NASDAQ: unavailable',
    dia ? `DOW (DIA): $${dia.price.toFixed(2)} (${dia.changePercent >= 0 ? '+' : ''}${dia.changePercent.toFixed(2)}%)` : 'DOW: unavailable',
  ].join('\n')

  const system = `You are Mr. Guy, a funny and sharp finance mascot. Write a morning market briefing in plain English. Casual, confident, a little funny. No markdown. No complicated finance terms. Use your live search to get today's actual market headlines and news — don't just rely on the index data provided.`

  const user = `Here is today's live index data:\n${indexBlock}\n\nUsing your live search, find today's top market-moving headlines and news. Then write a morning briefing covering:\n1) What the overall market is doing and why\n2) The 2-3 biggest stories today\n3) What to watch\n\nKeep it under 200 words. End with one punchy sentence starting with "Today's vibe:"`

  let briefingText = ''
  let headlines: string[] = []

  try {
    briefingText = await callGrok(system, user)
    // Extract a few headline-style phrases for the UI to show
    headlines = []
  } catch {
    briefingText = 'Markets are doing market things. Check back soon for the full scoop.'
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York',
  })

  cache = {
    cachedAt: Date.now(),
    briefing: briefingText,
    indices: { spy, qqq, dia },
    date: dateStr,
    headlines,
  }

  return NextResponse.json({
    briefing: briefingText,
    indices: { spy, qqq, dia },
    date: dateStr,
    headlines,
  })
}
