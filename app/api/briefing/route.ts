import { NextResponse } from 'next/server'
import { getStockQuote } from '@/lib/yahoo-finance'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// ── Slot helpers ────────────────────────────────────────────────────────────
// Two slots per day (ET): "morning" = before noon, "midday" = noon+
function getSlot(): { date: string; slot: 'morning' | 'midday'; id: string } {
  const now = new Date()
  const etHour = parseInt(
    now.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/New_York' }),
    10
  )
  const date = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) // YYYY-MM-DD
  const slot: 'morning' | 'midday' = etHour < 12 ? 'morning' : 'midday'
  return { date, slot, id: `${date}-${slot}` }
}

interface IndexData {
  ticker: string
  price: number
  changePercent: number
  change: number
}

interface BriefingPayload {
  briefing: string
  indices: { spy: IndexData | null; qqq: IndexData | null; dia: IndexData | null }
  date: string
  headlines: string[]
  slot: string
}

// ── Data fetchers ────────────────────────────────────────────────────────────
const RSS_FEEDS = [
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC,^DJI,^IXIC&region=US&lang=en-US',
  'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114',
  'https://news.google.com/rss/search?q=stock+market+today&hl=en-US&gl=US&ceid=US:en',
]

async function fetchRssFeed(url: string): Promise<{ title: string; pubDate: string }[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return []
    const text = await res.text()
    const items = text.match(/<item>([\s\S]*?)<\/item>/gi) ?? []
    const results: { title: string; pubDate: string }[] = []
    for (const item of items) {
      const titleMatch = item.match(/<title[^>]*>([\s\S]*?)<\/title>/)
      const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)
      if (!titleMatch) continue
      const title = titleMatch[1]
        .replace(/<!\[CDATA\[|\]\]>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
      const pubDate = pubDateMatch?.[1]?.trim() ?? ''
      if (title) results.push({ title, pubDate })
    }
    return results
  } catch {
    return []
  }
}

async function fetchAllHeadlines(): Promise<string[]> {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000
  const allFeeds = await Promise.allSettled(RSS_FEEDS.map(fetchRssFeed))
  const seen = new Set<string>()
  const headlines: string[] = []
  for (const feed of allFeeds) {
    if (feed.status !== 'fulfilled') continue
    for (const { title, pubDate } of feed.value) {
      if (pubDate) {
        const ts = new Date(pubDate).getTime()
        if (!isNaN(ts) && ts < cutoff) continue
      }
      const key = title.toLowerCase().slice(0, 60)
      if (seen.has(key)) continue
      seen.add(key)
      headlines.push(title)
    }
  }
  return headlines.slice(0, 10)
}

async function callGrok(system: string, user: string): Promise<string> {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) throw new Error('XAI_API_KEY not set')
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'grok-3',
      max_tokens: 400,
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: user   },
      ],
    }),
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new Error(`Grok API error: ${res.status}`)
  const json = await res.json()
  return (json.choices?.[0]?.message?.content ?? '').trim()
}

// ── Route ────────────────────────────────────────────────────────────────────
export async function GET() {
  const { date, slot, id } = getSlot()

  // 1. Check DB cache — same brief for ALL users this slot
  const cached = await prisma.marketBriefCache.findUnique({ where: { id } }).catch(() => null)
  if (cached) {
    return NextResponse.json({ ...(JSON.parse(cached.data) as BriefingPayload), fromCache: true })
  }

  // 2. Cache miss — generate fresh brief for this slot
  const [headlinesRaw, spyRaw, qqqRaw, diaRaw] = await Promise.allSettled([
    fetchAllHeadlines(),
    getStockQuote('SPY'),
    getStockQuote('QQQ'),
    getStockQuote('DIA'),
  ])

  const headlines = headlinesRaw.status === 'fulfilled' ? headlinesRaw.value : []
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

  const headlineBlock = headlines.length > 0
    ? headlines.map(h => `- ${h}`).join('\n')
    : '- No recent headlines available'

  const system = `You are Mr. Guy, a funny and sharp finance mascot. Write a ${slot === 'morning' ? 'morning' : 'midday'} market briefing in plain English. Casual, confident, a little funny. No markdown. No complicated finance terms.`

  const user = slot === 'morning'
    ? `Here is today's live index data:\n${indexBlock}\n\nTop headlines:\n${headlineBlock}\n\nWrite a morning briefing covering:\n1) What the overall market is doing and why\n2) The 2-3 biggest stories today\n3) What to watch\n\nKeep it under 200 words. Casual tone. End with one punchy sentence like "Today's vibe:"`
    : `Here is the midday market data:\n${indexBlock}\n\nTop headlines:\n${headlineBlock}\n\nWrite a midday market check-in covering:\n1) How markets are performing so far today\n2) Any big moves or news since this morning\n3) What to watch for the rest of the session\n\nKeep it under 200 words. Casual tone. End with one punchy sentence.`

  let briefingText = ''
  try {
    briefingText = await callGrok(system, user)
  } catch {
    briefingText = 'Markets are doing market things. Check back soon for the full scoop.'
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/New_York',
  })

  const payload: BriefingPayload = {
    briefing: briefingText,
    indices: { spy, qqq, dia },
    date: dateStr,
    headlines,
    slot,
  }

  // 3. Save to DB — fire and forget
  prisma.marketBriefCache.upsert({
    where: { id },
    update: { data: JSON.stringify(payload) },
    create: { id, slot, date, data: JSON.stringify(payload) },
  }).catch(() => {})

  return NextResponse.json(payload)
}
