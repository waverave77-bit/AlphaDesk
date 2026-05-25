import { NextResponse } from 'next/server'
import { getMarketStatus } from '@/lib/market-hours'

export const dynamic = 'force-dynamic'

// Simple in-memory cache — refreshes every 30 minutes
let _cache: { text: string; status: string; cachedAt: number } | null = null
const CACHE_TTL = 30 * 60 * 1000

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
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
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
  // Serve from cache if fresh
  if (_cache && Date.now() - _cache.cachedAt < CACHE_TTL) {
    return NextResponse.json({ text: _cache.text, status: _cache.status })
  }

  const { status, label, dayName } = getMarketStatus()
  const headlines = await fetchMarketNews()

  const newsBlock = headlines.length > 0
    ? `Recent headlines:\n${headlines.map(h => `- ${h}`).join('\n')}`
    : 'No specific headlines available — use your knowledge of current market conditions.'

  const holidayName = label.startsWith('Closed ·') ? label.replace('Closed · ', '') : null
  const nextOpen   = 'Monday'

  const systemPrompt = `You write short, sharp daily market recaps for retail investors. Friendly and conversational — like a smart friend who follows markets. No markdown, no bullet points, no "Note:", never start with "I". Plain English only. Be specific and confident.`

  const userPrompt = status === 'weekend'
    ? `Today is ${dayName}. Markets are closed for the weekend.\n\n${newsBlock}\n\nWrite a 2-3 sentence weekend market recap. Cover: what happened in markets this past week, and what specific events, data releases, or storylines investors should watch when they open ${nextOpen}. Be concrete — name actual catalysts (Fed speakers, earnings, economic data, geopolitical events, etc.).`
    : status === 'holiday'
    ? `Today is ${dayName} and markets are closed for ${holidayName}.\n\n${newsBlock}\n\nWrite a 2-3 sentence market note for ${holidayName}. Wish investors a happy holiday, briefly cover any recent market context, and note what to watch when markets reopen.`
    : status === 'pre'
    ? `Today is ${dayName} and markets open in a few hours.\n\n${newsBlock}\n\nWrite a 2-3 sentence pre-market recap. Cover: what the overnight/futures action looks like and the key things investors should watch when the market opens today.`
    : status === 'open'
    ? `Markets are open right now (${dayName}).\n\n${newsBlock}\n\nWrite a 2-3 sentence market recap. Cover: what's driving the market today — which sectors are moving, what's the sentiment, and what's the main story.`
    : `Markets just closed today (${dayName}).\n\n${newsBlock}\n\nWrite a 2-3 sentence end-of-day market recap. Cover: how markets closed and why, and what investors should watch tonight or heading into tomorrow.`

  try {
    const text = await callGrok(systemPrompt, userPrompt)
    _cache = { text, status: label, cachedAt: Date.now() }
    return NextResponse.json({ text, status: label })
  } catch {
    return NextResponse.json({ text: '', status: label })
  }
}
