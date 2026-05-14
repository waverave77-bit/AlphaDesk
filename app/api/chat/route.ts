import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function fetchNewsHeadlines(): Promise<string> {
  try {
    const res = await fetch(
      'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC,^DJI,^IXIC&region=US&lang=en-US',
      { next: { revalidate: 900 } } // cache 15 min
    )
    const text = await res.text()
    const titles = [...text.matchAll(/<title><!\[CDATA\[(.+?)\]\]><\/title>/g)]
      .map((m) => m[1])
      .filter((t) => !t.includes('Yahoo Finance')) // strip feed title
      .slice(0, 8)
    return titles.length ? titles.map((t, i) => `${i + 1}. ${t}`).join('\n') : ''
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json()

    const headlines = await fetchNewsHeadlines()
    const newsContext = headlines
      ? `\n\nLIVE NEWS HEADLINES (use these to inform your answers where relevant):\n${headlines}`
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
      system: `You are a sharp, straight-talking investing coach inside Zains Game — a stock market app for beginners.

Your job: give real, direct answers about stocks and markets. Use live news headlines when they're relevant. Keep it simple — no jargon, no walls of text, 2–4 sentences max.

Rules:
- Give direct recommendations when asked (e.g. "Based on X news, sectors like Y or Z tend to move because...") — always end with "Not financial advice — do your own research before investing."
- Use the live headlines to back up your answers with real context when relevant
- If asked about a specific stock or sector tied to a news event, name it and explain why it could be affected
- Only redirect if the question has zero connection to money, markets, stocks, or finance (e.g. recipes, sports scores)
- No jargon — if you use a finance term, explain it simply in the same sentence
- Use real-world analogies for concepts (e.g. "a stock is like owning a slice of a business")
- Use $ and % for numbers
- Be encouraging — beginners find investing intimidating${newsContext}`,
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
