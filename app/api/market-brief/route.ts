import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getMarketStatus } from '@/lib/market-hours'

export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

export async function GET() {
  // Serve from cache if fresh
  if (_cache && Date.now() - _cache.cachedAt < CACHE_TTL) {
    return NextResponse.json({ text: _cache.text, status: _cache.status })
  }

  const { status, label, dayName } = getMarketStatus()
  const headlines = await fetchMarketNews()

  const newsBlock = headlines.length > 0
    ? `Recent headlines:\n${headlines.map(h => `- ${h}`).join('\n')}`
    : 'No specific headlines found — use your training knowledge of current market conditions.'

  const systemPrompt = `You write short, sharp daily market recaps for retail investors. Friendly and conversational — like a smart friend who follows markets. No markdown, no bullet points, no "Note:", never start with "I". Plain English only. Be specific and confident.`

  const nextOpen = dayName === 'Friday' ? 'Monday' : dayName === 'Saturday' ? 'Monday' : 'Monday'
  // Extract holiday name from label like "Closed · Christmas"
  const holidayName = label.startsWith('Closed ·') ? label.replace('Closed · ', '') : null

  const userPrompt = status === 'weekend'
    ? `Today is ${dayName}. Markets are closed for the weekend.\n\n${newsBlock}\n\nWrite a 2-3 sentence weekend market recap. Cover: what happened in markets this past week, and what specific events, data releases, or storylines investors should watch that could move markets when they open ${nextOpen}. Be concrete — name actual catalysts (Fed speakers, earnings, economic data, geopolitical events, etc.).`
    : status === 'holiday'
    ? `Today is ${dayName} and markets are closed for ${holidayName}.\n\n${newsBlock}\n\nWrite a 2-3 sentence market note for ${holidayName}. Wish investors a happy holiday, briefly cover any recent market context, and note what to watch when markets reopen.`
    : status === 'pre'
    ? `Today is ${dayName} and markets open in a few hours.\n\n${newsBlock}\n\nWrite a 2-3 sentence pre-market recap. Cover: what the overnight/futures action looks like and the key things investors should watch when the market opens today.`
    : status === 'open'
    ? `Markets are open right now (${dayName}).\n\n${newsBlock}\n\nWrite a 2-3 sentence market recap. Cover: what's driving the market today — which sectors are moving, what's the sentiment, and what's the main story.`
    : /* after/closed */
    `Markets just closed today (${dayName}).\n\n${newsBlock}\n\nWrite a 2-3 sentence end-of-day market recap. Cover: how markets closed and why, and what investors should watch tonight or heading into tomorrow.`

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })
    const text = ((msg.content[0] as any).text ?? '').trim()
    _cache = { text, status: label, cachedAt: Date.now() }
    return NextResponse.json({ text, status: label })
  } catch {
    return NextResponse.json({ text: '', status: label })
  }
}
