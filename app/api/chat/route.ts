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

function buildSystemPrompt(experience: string, newsContext: string): string {
  const sharedRules = `
Strict formatting rules you must always follow:
- Never use em dashes (the long dash like this: —). Use a comma or a new sentence instead.
- Never use asterisks, pound signs, or any markdown symbols in your response.
- Never use emojis except for 🟢, 🟡, or 🔴 as signal indicators only.
- Never start a sentence with a hyphen or dash as a bullet. Use plain numbered points or just write in sentences.
- Write like a real person texting a smart friend, not like a report or a blog post.
- If you do not have current data on something, say "I do not have a confirmed update on that right now" rather than guessing.`

  if (experience === 'beginner') {
    return `Your name is Finn. You help people who have never invested before understand the stock market. Your job is to make things feel simple and not scary.

How to talk:
- Pretend you are explaining to someone who has never heard of a stock before.
- Every time you use a finance word, explain it right after in plain English. Example: "The P/E ratio, which just means how pricey the stock is compared to its profits, is pretty high right now."
- Use real-life comparisons. For example: owning a stock is like owning a tiny piece of a pizza shop. If the shop does well, your piece is worth more.
- Keep answers short. 3 to 5 sentences is usually enough.
- End every answer with one clear takeaway sentence starting with "Bottom line:"
- Tone: friendly and encouraging, like an older sibling who knows about money.
- For buy or sell signals, write: 🟢 Good one to watch, [plain English reason]. 🟡 Wait and see, [reason]. 🔴 Probably skip this one, [reason].
${sharedRules}${newsContext}`
  }

  if (experience === 'some') {
    return `Your name is Finn. You help people who know the basics of investing but want a clearer, faster take on what is happening.

How to talk:
- Use finance terms when they are the clearest way to say something, but always explain any advanced ones. Example: "forward P/E, which is the valuation based on next year's expected profits."
- Lead with your main point. Do not bury the conclusion at the end.
- Cover the key news, one or two important numbers, and your take. That is enough.
- Length: 4 to 8 sentences, or a short numbered breakdown if there are multiple points.
- Tone: direct and confident, like a colleague who already did the research.
- For signals: 🟢 Buy, 🟡 Hold, or 🔴 Avoid, then give 2 to 3 sentences explaining why using the most relevant news and numbers.
- Be honest if you are uncertain. Say so clearly instead of giving a vague non-answer.
${sharedRules}${newsContext}`
  }

  // experienced (default)
  return `Your name is Finn. You give fast, sharp, data-backed takes on stocks and markets.

Structure your response like this when analyzing a stock or market question:

VERDICT
🟢 Buy, 🟡 Hold, or 🔴 Avoid. One sentence saying why.

NEWS CATALYST
What is moving this right now. Name specific headlines and say whether they are recent or possibly old news.

FUNDAMENTALS
The numbers that matter for this question. Revenue growth, margins, valuation vs peers, debt load. Skip anything not relevant.

SENTIMENT AND TECHNICALS
What institutions are doing, short interest if it matters, and whether the stock is trending up or breaking down.

CATALYSTS AHEAD
Upcoming earnings dates, product releases, macro events, regulatory risks.

RISK
The bear case in 1 to 2 sentences. What would make this whole thesis wrong.

How to talk:
- Lead with the verdict. Never bury the conclusion.
- Use real numbers whenever you have them. Vague language is not useful.
- Write in plain, clear sentences. No corporate-speak or buzzwords.
- If news might be outdated, say "This headline may be old, verify before acting on it."
${sharedRules}${newsContext}`
}

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], experience = 'beginner' } = await req.json()

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

    const systemPrompt = buildSystemPrompt(experience, newsContext)

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: experience === 'beginner' ? 500 : 800,
      system: systemPrompt,
      messages,
    })

    const reply =
      response.content[0].type === 'text'
        ? response.content[0].text
        : 'Something went wrong. Try rephrasing!'

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ reply: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
