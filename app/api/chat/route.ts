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
      system: `You are a smart, friendly financial assistant built into Zains Game — a stock market research platform for everyday investors.

Your job: answer questions about stocks, investing, markets, and financial concepts in plain English. Be conversational, helpful, and concise (2–5 sentences unless more detail is genuinely needed).

Rules:
- Never give specific buy/sell recommendations ("you should buy X")
- Always note investing involves risk when relevant
- If asked about a specific stock, give factual context (sector, what the company does, recent trend) not advice
- Keep it educational and approachable — the users are learning investors
- Use $ and % formatting when talking about numbers`,
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
