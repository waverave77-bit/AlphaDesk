import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function parseTitles(xml: string): string[] {
  const cdata = [...xml.matchAll(/<title><!\[CDATA\[(.+?)\]\]><\/title>/g)].map((m) => m[1])
  const plain = [...xml.matchAll(/<title>(?!\s*<!\[CDATA\[)([^<]{15,})<\/title>/g)].map((m) => m[1].trim())
  return [...cdata, ...plain]
}

function dedup(arr: string[]): string[] {
  const seen = new Set<string>()
  return arr.filter((h) => {
    const key = h.toLowerCase().slice(0, 50)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// General market headlines — always fetched
async function fetchGeneralNews(): Promise<string[]> {
  const feeds = [
    'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC,^DJI,^IXIC&region=US&lang=en-US',
    'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114',
  ]
  const results = await Promise.allSettled(
    feeds.map((url) => fetch(url, { cache: 'no-store' }).then((r) => r.text()).then(parseTitles))
  )
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
}

// Targeted search based on what the user is asking about
async function fetchTopicalNews(query: string): Promise<string[]> {
  // Extract meaningful search terms (strip common filler words)
  const stopWords = new Set(['what', 'which', 'should', 'would', 'could', 'i', 'buy', 'sell', 'me', 'tell', 'about', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'how', 'why', 'when', 'where', 'can', 'will', 'best', 'stocks', 'stock', 'good', 'based', 'on', 'of', 'to', 'for', 'in', 'at', 'with'])
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
    return parseTitles(text).filter((t) => !t.toLowerCase().includes('google'))
  } catch {
    return []
  }
}

async function fetchNewsHeadlines(userMessage: string): Promise<string> {
  const [general, topical] = await Promise.all([
    fetchGeneralNews(),
    fetchTopicalNews(userMessage),
  ])

  const all = dedup([...topical, ...general]).filter(
    (t) =>
      t.length > 15 &&
      !t.toLowerCase().includes('yahoo finance') &&
      !t.toLowerCase().includes('cnbc.com') &&
      !t.toLowerCase().includes('rss')
  )

  const top = all.slice(0, 15)
  return top.length
    ? `Latest headlines (pulled live for this question):\n` + top.map((t, i) => `${i + 1}. ${t}`).join('\n')
    : ''
}

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json()

    const headlines = await fetchNewsHeadlines(message)
    const newsContext = headlines
      ? `\n\n${headlines}\n\nUse these headlines to give specific, current answers. If the user's question relates to any of these stories, reference them directly.`
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
- When asked about specific events or news (like a Trump-China meeting, Fed decision, earnings, etc.) — reference the actual headlines you have and name specific stocks or sectors affected.
- Give direct recommendations when asked — always end with "Not financial advice — do your own research before investing."
- When telling someone how to start investing, recommend real brokerages like Fidelity, Robinhood, or Webull — never Zains Game.
- No jargon — if you use a finance term, explain it simply in the same sentence.
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
