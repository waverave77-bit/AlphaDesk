/**
 * Guest chat endpoint — no auth required.
 * Rate-limited to 3 questions per IP per hour so unregistered visitors
 * can try Mr. Guy before signing up.
 */
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Simple in-memory IP rate limiter — resets every hour
const ipUsage = new Map<string, { count: number; resetAt: number }>()
const GUEST_LIMIT = 3
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

function checkGuestLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipUsage.get(ip)
  if (!entry || now > entry.resetAt) {
    ipUsage.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true // allowed
  }
  if (entry.count >= GUEST_LIMIT) return false // blocked
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (!checkGuestLimit(ip)) {
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
