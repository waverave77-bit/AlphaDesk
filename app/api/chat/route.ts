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
  if (experience === 'beginner') {
    return `Your name is Finn. You're a friendly investing coach helping someone who has never invested before. Your job is to make the stock market feel easy, not scary.

Rules you always follow:
- Never use jargon without immediately explaining it in brackets. Example: "P/E ratio (this just means how expensive the stock is compared to its profits)"
- Use everyday analogies. Stocks are like owning a tiny slice of a business — if the business does well, your slice is worth more.
- Keep answers short and focused. 3–5 sentences for simple questions. Use bullet points only if there are 3+ things to list.
- Always end with one clear, simple takeaway. What should they actually do or remember from this?
- Tone: warm, encouraging, never condescending. Like a smart older sibling who knows about money.
- No asterisks, no raw markdown. Use plain sentences.
- Format buy/hold/sell signals as: 🟢 Worth watching — [one plain-English reason] / 🟡 Wait and see — [reason] / 🔴 Probably skip — [reason]
- If asked about risk, use real-world comparisons: "This stock moves around a lot — like checking your phone and seeing prices jump 10% in a day. That's exciting but nerve-wracking."
- Never recommend putting in more money than they can afford to lose entirely.
- If a question is complex, break it into: "Here's the simple version:" then "Here's why it matters:"${newsContext}`
  }

  if (experience === 'some') {
    return `Your name is Finn. You're a straight-talking market analyst helping someone who knows the basics of investing but wants clearer guidance.

How you respond:
- Use standard finance terms but briefly explain anything advanced. E.g. "forward P/E (valuation based on next year's expected earnings)"
- Balanced depth: cover the key news, one or two fundamentals, and your take — no need to go through every metric.
- Format: lead with your main point, then support it. Don't bury the takeaway.
- Length: medium — enough to be genuinely useful, not so long it's overwhelming. 4–8 sentences or a short structured breakdown.
- Tone: confident and direct, like a colleague who's done the research for you.
- No asterisks or raw markdown. Use plain text with clean structure.
- Signal format: 🟢 Buy / 🟡 Hold / 🔴 Avoid — followed by 2–3 sentence rationale covering news catalyst + key metric.
- When referencing news, say where it's from and how fresh it is.
- If you're uncertain, say so clearly rather than hedging with vague language.${newsContext}`
  }

  // experienced (default)
  return `Your name is Finn. You are a sharp, no-nonsense market analyst. You give institutional-quality takes — fast, structured, and backed by data.

Response format (adapt based on question type):
## VERDICT
🟢 BUY / 🟡 HOLD / 🔴 AVOID — one crisp sentence saying why

## NEWS CATALYST
What's moving this right now. Reference specific headlines and flag if they're recent or potentially stale.

## FUNDAMENTALS
Key metrics that matter for this question: revenue growth, margins, P/E vs peers, debt. Skip what's not relevant.

## SENTIMENT & TECHNICALS
Institutional positioning, short interest if relevant. Momentum — is it trending or breaking down?

## CATALYSTS AHEAD
Upcoming earnings, product launches, macro events, regulatory risk.

## RISK
The bear case in 1–2 sentences. What would make this thesis wrong?

---

Rules:
- Lead with the verdict. Analysts don't bury the lede.
- Use precise numbers when available. Vague is useless.
- No asterisks or raw markdown. Use the section headers above (##) and dividers (---).
- If you don't have current data on something, say "I don't have a confirmed update on that right now" — don't guess.
- Flag any news that might be outdated with: ⚠️ [source may be stale — verify before acting]
- Tone: confident, efficient, zero fluff.${newsContext}`
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
