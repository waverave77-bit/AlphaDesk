import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// In-memory cache — avoids re-calling Claude for the same spike
const cache = new Map<string, string>()

async function fetchNewsHeadlines(ticker: string, date: string): Promise<string[]> {
  try {
    const searchQuery = encodeURIComponent(`${ticker} stock`)
    const res = await fetch(
      `https://news.google.com/rss/search?q=${searchQuery}&hl=en-US&gl=US&ceid=US:en`,
      { cache: 'no-store', signal: AbortSignal.timeout(5000) }
    )
    const text = await res.text()

    const targetMs = new Date(date).getTime()
    const headlines: string[] = []

    const items = text.match(/<item>([\s\S]*?)<\/item>/gi) ?? []
    for (const item of items.slice(0, 30)) {
      const title = item.match(/<title>(.*?)<\/title>/)?.[1]
        ?.replace(/<!\[CDATA\[|\]\]>/g, '').trim()
      const pubDateStr = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim()
      if (title && pubDateStr) {
        const diffDays = Math.abs(targetMs - new Date(pubDateStr).getTime()) / 86400000
        if (diffDays <= 3) headlines.push(title)
      }
    }
    return headlines
  } catch {
    return []
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ticker = (searchParams.get('ticker') ?? '').toUpperCase()
  const date   = searchParams.get('date') ?? ''
  const pct    = parseFloat(searchParams.get('pct') ?? '0')

  if (!ticker || !date) return NextResponse.json({ summary: '' }, { status: 400 })

  const cacheKey = `${ticker}-${date}`
  if (cache.has(cacheKey)) return NextResponse.json({ summary: cache.get(cacheKey) })

  const headlines = await fetchNewsHeadlines(ticker, date)
  const direction = pct > 0 ? 'surged' : 'dropped'
  const abs = Math.abs(pct).toFixed(1)

  const newsContext = headlines.length > 0
    ? `News headlines from around that date:\n${headlines.map(h => `- ${h}`).join('\n')}`
    : `No specific news found — use your knowledge of typical drivers for ${ticker}.`

  const prompt = `${ticker} stock ${direction} ${abs}% on ${date}. ${newsContext}\n\nExplain in exactly 2 short sentences why this likely happened. Plain English, no markdown, no bullet points, no "Note:".`

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 100,
      system: 'You explain stock price moves in 2 plain English sentences. Be specific. No markdown. No bullet points. Never start with "I".',
      messages: [{ role: 'user', content: prompt }],
    })
    const summary = ((msg.content[0] as any).text ?? '').trim()
    cache.set(cacheKey, summary)
    return NextResponse.json({ summary })
  } catch {
    return NextResponse.json({ summary: '' })
  }
}
