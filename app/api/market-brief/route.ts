import { NextResponse } from 'next/server'
import { getMarketStatus } from '@/lib/market-hours'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// ── Slot helpers ─────────────────────────────────────────────────────────────
function getSlot(): { date: string; slot: 'morning' | 'midday'; id: string } {
  const now = new Date()
  const etHour = parseInt(
    now.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/New_York' }),
    10
  )
  const date = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const slot: 'morning' | 'midday' = etHour < 12 ? 'morning' : 'midday'
  return { date, slot, id: `brief-${date}-${slot}` }
}

async function fetchMarketNews(): Promise<string[]> {
  try {
    const res = await fetch(
      'https://news.google.com/rss/search?q=stock+market+economy&hl=en-US&gl=US&ceid=US:en',
      { cache: 'no-store', signal: AbortSignal.timeout(5000) }
    )
    const text = await res.text()
    const items = text.match(/<item>([\s\S]*?)<\/item>/gi) ?? []
    const headlines: string[] = []
    const cutoff = Date.now() - 24 * 3600000
    for (const item of items.slice(0, 20)) {
      const title = item.match(/<title>(.*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim()
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim()
      if (title && pubDate && new Date(pubDate).getTime() > cutoff) headlines.push(title)
    }
    return headlines.slice(0, 8)
  } catch {
    return []
  }
}

async function callGrok(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) throw new Error('XAI_API_KEY not set')
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'grok-3',
      max_tokens: 200,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
    }),
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Grok API error: ${res.status}`)
  const json = await res.json()
  return (json.choices?.[0]?.message?.content ?? '').trim()
}

export async function GET() {
  const { date, slot, id } = getSlot()

  // Market status is ALWAYS computed live — never served from the cache. The brief
  // TEXT is cached per slot (morning/midday), but the open/closed status changes
  // through the day, so reusing the cached status made the dashboard show "Closed"
  // after the market had already opened.
  const { status, label, dayName } = getMarketStatus()

  // 1. Serve cached TEXT (same recap for every user this slot) + live status
  const cached = await prisma.marketBriefCache.findUnique({ where: { id } }).catch(() => null)
  if (cached) {
    const payload = JSON.parse(cached.data)
    return NextResponse.json({ text: payload.text, status: label, fromCache: true })
  }
  const headlines = await fetchMarketNews()

  const newsBlock = headlines.length > 0
    ? `Recent headlines:\n${headlines.map(h => `- ${h}`).join('\n')}`
    : 'No specific headlines available — use your knowledge of current market conditions.'

  const holidayName = label.startsWith('Closed ·') ? label.replace('Closed · ', '') : null
  const nextOpen = 'Monday'

  const systemPrompt = `You write short, sharp daily market recaps for retail investors. Friendly and conversational — like a smart friend who follows markets. No markdown, no bullet points, no "Note:", never start with "I". Plain English only. Be specific and confident.`

  const userPrompt = status === 'weekend'
    ? `Today is ${dayName}. Markets are closed for the weekend.\n\n${newsBlock}\n\nWrite a 2-3 sentence weekend market recap. Cover: what happened in markets this past week, and what specific events, data releases, or storylines investors should watch when they open ${nextOpen}. Be concrete — name actual catalysts (Fed speakers, earnings, economic data, geopolitical events, etc.).`
    : status === 'holiday'
    ? `Today is ${dayName} and markets are closed for ${holidayName}.\n\n${newsBlock}\n\nWrite a 2-3 sentence market note for ${holidayName}. Briefly cover recent market context and note what to watch when markets reopen.`
    : slot === 'morning'
    ? `Today is ${dayName} and markets open in a few hours or just opened.\n\n${newsBlock}\n\nWrite a 2-3 sentence morning market brief. Cover: what the overnight/futures action looks like and the key things investors should watch today.`
    : `It's midday on ${dayName}.\n\n${newsBlock}\n\nWrite a 2-3 sentence midday market check-in. Cover: how markets are tracking so far today and what to watch for the rest of the session.`

  let text = ''
  try {
    text = await callGrok(systemPrompt, userPrompt)
  } catch {
    text = ''
  }

  const payload = { text, status: label }

  // 3. Save to DB — fire and forget
  prisma.marketBriefCache.upsert({
    where: { id },
    update: { data: JSON.stringify(payload) },
    create: { id, slot, date, data: JSON.stringify(payload) },
  }).catch(() => {})

  return NextResponse.json(payload)
}
