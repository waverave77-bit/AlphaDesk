/**
 * Guest chat endpoint — no auth required.
 * Rate-limited to 3 questions per IP per hour so unregistered visitors
 * can try Mr. Guy before signing up.
 */
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkIpLimit, getIp } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  // 3 questions per IP per hour — lets guests try the product without burning credits
  if (!checkIpLimit(getIp(req), 'guest-chat', 3, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Guest limit reached', limitReached: true },
      { status: 429 }
    )
  }

  const { message } = await req.json().catch(() => ({ message: '' }))
  if (!message?.trim()) {
    return NextResponse.json({ error: 'No message' }, { status: 400 })
  }

  try {
    const stream = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      stream: true,
      system: `You are Mr. Guy — a funny, friendly pixel-art finance mascot. You explain investing in plain English. Short answers only (2-4 sentences max). No markdown, no bullet points. Always end with a one-liner nudge to sign up for free to get unlimited questions.`,
      messages: [{ role: 'user', content: message.slice(0, 500) }],
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
