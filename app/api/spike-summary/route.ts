import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Known company names for tickers where the ticker alone returns poor news results
const TICKER_NAMES: Record<string, string> = {
  TTWO: 'Take-Two Interactive', MSFT: 'Microsoft', AAPL: 'Apple', GOOGL: 'Google Alphabet',
  AMZN: 'Amazon', META: 'Meta Facebook', NVDA: 'Nvidia', TSLA: 'Tesla', NFLX: 'Netflix',
  AMD: 'AMD chip', INTC: 'Intel', CRM: 'Salesforce', SPOT: 'Spotify', SNAP: 'Snapchat',
  RBLX: 'Roblox', EA: 'Electronic Arts', ATVI: 'Activision Blizzard', DKNG: 'DraftKings',
}

async function fetchNewsHeadlines(ticker: string, date: string): Promise<string[]> {
  try {
    const companyHint = TICKER_NAMES[ticker] ?? `${ticker} stock`
    const searchQuery = encodeURIComponent(companyHint)
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
        if (diffDays <= 5) headlines.push(title)
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

  const id = `${ticker}-${date}`

  // 1. Check DB cache — free, instant, shared across all users
  // Skip cache if summary is empty (means a previous call failed/was truncated)
  try {
    const cached = await prisma.spikeSummaryCache.findUnique({ where: { id } })
    if (cached?.summary) return NextResponse.json({ summary: cached.summary })
  } catch {}

  // 2. Not cached — fetch news + call Claude
  const headlines = await fetchNewsHeadlines(ticker, date)
  const direction = pct > 0 ? 'surged' : 'dropped'
  const abs = Math.abs(pct).toFixed(1)

  const newsContext = headlines.length > 0
    ? `News headlines from around that date:\n${headlines.map(h => `- ${h}`).join('\n')}`
    : `No specific news was found — draw on your training knowledge of what was happening with ${ticker} around ${date}.`

  const prompt = `${ticker} stock ${direction} ${abs}% on ${date}.\n\n${newsContext}\n\nIn exactly 2 short sentences, explain why this move most likely happened. Be specific about the catalyst. Plain English only — no markdown, no bullets, no "Note:", never start with "I" or "Based on".`

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 180,
      system: 'You are a stock analyst who explains price moves in 2 plain English sentences. Always give a specific, confident reason. No markdown. No bullets. No disclaimers.',
      messages: [{ role: 'user', content: prompt }],
    })
    const summary = ((msg.content[0] as any).text ?? '').trim()

    // 3. Save to DB so every future user gets it for free
    if (summary) {
      try {
        await prisma.spikeSummaryCache.upsert({
          where: { id },
          create: { id, summary },
          update: { summary },
        })
      } catch {}
    }

    return NextResponse.json({ summary })
  } catch {
    return NextResponse.json({ summary: '' })
  }
}
