import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface NewsItem {
  title: string
  pubDate: Date | null
}

// Parse items with their publish dates so we can filter stale ones
function parseItems(xml: string): NewsItem[] {
  const items: NewsItem[] = []

  // Split by <item> blocks
  const blocks = xml.split(/<item[\s>]/)
  for (const block of blocks.slice(1)) {
    // Title
    const cdataMatch = block.match(/<title><!\[CDATA\[(.+?)\]\]><\/title>/)
    const plainMatch = block.match(/<title>(?!\s*<!\[CDATA\[)([^<]{15,})<\/title>/)
    const title = cdataMatch?.[1] ?? plainMatch?.[1]?.trim() ?? ''

    // Publish date
    const pubDateMatch = block.match(/<pubDate>([^<]+)<\/pubDate>/)
    let pubDate: Date | null = null
    if (pubDateMatch) {
      const parsed = new Date(pubDateMatch[1].trim())
      if (!isNaN(parsed.getTime())) pubDate = parsed
    }

    if (title.length > 15) items.push({ title, pubDate })
  }
  return items
}

function dedup(arr: NewsItem[]): NewsItem[] {
  const seen = new Set<string>()
  return arr.filter(({ title }) => {
    const key = title.toLowerCase().slice(0, 50)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// Only keep articles published within the last 48 hours
function isRecent(item: NewsItem): boolean {
  if (!item.pubDate) return true // if no date, keep it
  const ageHours = (Date.now() - item.pubDate.getTime()) / (1000 * 60 * 60)
  return ageHours <= 48
}

async function fetchGeneralNews(): Promise<NewsItem[]> {
  const feeds = [
    'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC,^DJI,^IXIC&region=US&lang=en-US',
    'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114',
  ]
  const results = await Promise.allSettled(
    feeds.map((url) => fetch(url, { cache: 'no-store' }).then((r) => r.text()).then(parseItems))
  )
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
}

async function fetchTopicalNews(query: string): Promise<NewsItem[]> {
  const stopWords = new Set(['what', 'which', 'should', 'would', 'could', 'i', 'buy', 'sell', 'me', 'tell', 'about', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'how', 'why', 'when', 'where', 'can', 'will', 'best', 'stocks', 'stock', 'good', 'based', 'on', 'of', 'to', 'for', 'in', 'at', 'with', 'still', 'happening', 'right', 'now'])
  const terms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .slice(0, 5)

  if (terms.length === 0) return []

  const searchQuery = encodeURIComponent(terms.join(' ') + ' finance market')

  try {
    const res = await fetch(
      `https://news.google.com/rss/search?q=${searchQuery}&hl=en-US&gl=US&ceid=US:en`,
      { cache: 'no-store' }
    )
    const text = await res.text()
    return parseItems(text).filter((i) => !i.title.toLowerCase().includes('google'))
  } catch {
    return []
  }
}

async function fetchNewsHeadlines(userMessage: string): Promise<string> {
  const [general, topical] = await Promise.all([
    fetchGeneralNews(),
    fetchTopicalNews(userMessage),
  ])

  const combined = dedup([...topical, ...general])

  // Split into recent vs older
  const recent = combined.filter(isRecent)
  const older = combined.filter((i) => !isRecent(i))

  const badWords = ['yahoo finance', 'cnbc.com', 'rss', 'google news']
  const clean = (items: NewsItem[]) =>
    items.filter((i) => !badWords.some((w) => i.title.toLowerCase().includes(w)))

  const recentClean = clean(recent).slice(0, 12)
  const olderClean = clean(older).slice(0, 3)

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  let output = `Today is ${today}.\n\n`

  if (recentClean.length > 0) {
    output += `Recent headlines (last 48 hours):\n`
    output += recentClean.map((i, idx) => `${idx + 1}. ${i.title}`).join('\n')
  }

  if (olderClean.length > 0) {
    output += `\n\nOlder context (may be outdated — use with caution):\n`
    output += olderClean.map((i, idx) => `${idx + 1}. ${i.title}`).join('\n')
  }

  return recentClean.length > 0 || olderClean.length > 0 ? output : ''
}

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json()

    const headlines = await fetchNewsHeadlines(message)
    const newsContext = headlines
      ? `\n\n${headlines}\n\nIMPORTANT: Only reference headlines marked as "recent". If a headline is in the "older context" section, flag it as possibly outdated. If you don't have a current headline confirming the current status of something, say "I don't have a confirmed update on that right now" rather than guessing.`
      : ''

    const messages = [
      ...history
        .filter((m: any) => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message },
    ]

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      system: `You are a sharp, straight-talking investing coach inside Zains Game — a stock market research and learning app for beginners. This app is NOT a brokerage and does NOT let users open accounts or buy stocks. Never suggest users open an account here.

Your job: give real, direct answers about stocks and markets using the latest news headlines provided. Keep it simple — no jargon, no walls of text, 2–4 sentences max.

Rules:
- NEVER use markdown formatting. No asterisks, no bold, no bullet points, no dashes. Plain conversational sentences only.
- Only treat headlines in the "recent" section as current facts. Headlines in "older context" may be outdated — say so if you reference them.
- If asked about the current status of something (like a shutdown, a deal, a meeting) and you only have old headlines, say "I don't have a confirmed update on that right now" — do not guess or present old news as current.
- When asked about specific events tied to the headlines, name specific stocks or sectors affected.
- Give direct recommendations when asked — always end with "Not financial advice — do your own research before investing."
- When telling someone how to start investing, recommend real brokerages like Fidelity, Robinhood, or Webull — never Zains Game.
- No jargon — explain any finance term simply in the same sentence.
- Use real-world analogies for concepts.
- Use $ and % for numbers.
- Be encouraging — beginners find investing intimidating.${newsContext}`,
      messages,
    })

    const reply =
      response.content[0].type === 'text'
        ? response.content[0].text
        : 'Sorry, I had trouble with that. Try rephrasing!'

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ reply: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
