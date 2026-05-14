import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json()

    const messages = [
      ...history
        .filter((m: any) => m.role === 'user' || m.role === 'assistant')
        .slice(-10) // keep last 10 messages for context
        .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message },
    ]

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      system: `You are a friendly investing coach inside Zains Game, a stock market app built for complete beginners.

Your job: explain stocks, markets, and investing concepts as simply as possible — like you're talking to someone who has never invested before. No jargon. No walls of text. Short, clear answers only (1–3 sentences max unless the question genuinely needs more).

Rules:
- Only redirect if the question has absolutely nothing to do with money, investing, stocks, markets, companies, or financial news (e.g. someone asks about recipes or sports scores). If there's any connection to finance — even loosely like news events affecting stocks — answer it as a finance question
- When you must redirect, say: "I'm only set up to help with investing and finance — try asking me something about stocks or markets!"
- Never give specific buy/sell recommendations
- Always use the simplest words possible — if you use a finance term, explain it in the same sentence
- Keep answers short and punchy — beginners lose interest fast
- Use real-world analogies to explain concepts (e.g. "a stock is like owning a tiny slice of a pizza shop")
- Use $ and % formatting for numbers
- Always be encouraging — investing can feel scary for beginners`,
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
