import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Simple in-memory cache — refreshes every 30 minutes
let _cache: { text: string; status: string; cachedAt: number } | null = null
const CACHE_TTL = 30 * 60 * 1000

function getMarketStatus(): { status: 'open' | 'pre' | 'after' | 'closed' | 'weekend'; label: string; dayName: string } {
  // Convert to US/Eastern time
  const now = new Date()
  const etOffset = (() => {
    // Rough DST: second Sunday of March → first Sunday of November
    const yr = now.getUTCFullYear()
    const dstStart = new Date(Date.UTC(yr, 2, 8))
    dstStart.setUTCDate(8 + ((7 - dstStart.getUTCDay()) % 7))
    const dstEnd = new Date(Date.UTC(yr, 10, 1))
    dstEnd.setUTCDate(1 + ((7 - dstEnd.getUTCDay()) % 7))
    return now >= dstStart && now < dstEnd ? -4 : -5
  })()

  const etMs = now.getTime() + etOffset * 3600000
  const et = new Date(etMs)
  const day = et.getUTCDay()           // 0=Sun, 6=Sat
  const h = et.getUTCHours()
  const m = et.getUTCMinutes()
  const mins = h * 60 + m

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  if (day === 0 || day === 6) return { status: 'weekend', label: 'Weekend', dayName: days[day] }
  if (mins >= 9 * 60 + 30 && mins < 16 * 60) return { status: 'open', label: 'Open', dayName: days[day] }
  if (mins >= 4 * 60 && mins < 9 * 60 + 30) return { status: 'pre', label: 'Pre-Market', dayName: days[day] }
  if (mins >= 16 * 60 && mins < 20 * 60) return { status: 'after', label: 'After Hours', dayName: days[day] }
  return { status: 'closed', label: 'Closed', dayName: days[day] }
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

  const systemPrompt = status === 'weekend'
    ? `You write a short, engaging weekend market note for an investor app. Friendly, conversational, a bit fun. No markdown, no bullets, no "Note:", never start with "I". Plain English only.`
    : `You write a short, engaging daily market brief for an investor app. Friendly, conversational, a bit fun — like a smart friend who follows markets. No markdown, no bullets, no "Note:", never start with "I". Plain English only.`

  const userPrompt = status === 'weekend'
    ? `Today is ${dayName}. Markets are closed for the weekend.\n\n${newsBlock}\n\nIn 2-3 sentences: what's the most interesting thing happening right now, and what could move markets when they open Monday? Be specific and confident.`
    : status === 'pre'
    ? `Markets open in a few hours today (${dayName}).\n\n${newsBlock}\n\nIn 2-3 sentences: what should investors be watching when the market opens today? Be specific.`
    : status === 'open'
    ? `Markets are open right now (${dayName}).\n\n${newsBlock}\n\nIn 2-3 sentences: what's driving the market today? Be specific and direct.`
    : /* after/closed */
    `Markets just closed today (${dayName}).\n\n${newsBlock}\n\nIn 2-3 sentences: how did the market do today and what should investors watch tonight or tomorrow? Be specific.`

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
