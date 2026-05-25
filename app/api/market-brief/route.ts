import { NextResponse } from 'next/server'
import { getMarketStatus } from '@/lib/market-hours'

export const dynamic = 'force-dynamic'

// Simple in-memory cache — refreshes every 30 minutes
let _cache: { text: string; status: string; cachedAt: number } | null = null
const CACHE_TTL = 30 * 60 * 1000

async function callGrok(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) throw new Error('XAI_API_KEY not set')

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-3',
      max_tokens: 200,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      // Grok live search — pulls real-time web + X (Twitter) data
      search_parameters: {
        mode: 'auto',
        sources: [{ type: 'web' }, { type: 'x' }],
      },
    }),
    signal: AbortSignal.timeout(20000),
  })

  if (!res.ok) throw new Error(`Grok API error: ${res.status}`)
  const json = await res.json()
  return (json.choices?.[0]?.message?.content ?? '').trim()
}

export async function GET() {
  // Serve from cache if fresh
  if (_cache && Date.now() - _cache.cachedAt < CACHE_TTL) {
    return NextResponse.json({ text: _cache.text, status: _cache.status })
  }

  const { status, label, dayName } = getMarketStatus()
  const holidayName = label.startsWith('Closed ·') ? label.replace('Closed · ', '') : null
  const nextOpen   = 'Monday' // simplification — good enough for weekend/holiday copy

  const systemPrompt = `You write short, sharp daily market recaps for retail investors. Friendly and conversational — like a smart friend who follows markets. No markdown, no bullet points, no "Note:", never start with "I". Plain English only. Be specific and confident. Use your live search to get today's real market data.`

  const userPrompt = status === 'weekend'
    ? `Today is ${dayName}. Markets are closed for the weekend. Search for what happened in markets this past week and what investors should watch when they open ${nextOpen}. Write a 2-3 sentence recap. Be concrete — name actual catalysts (Fed speakers, earnings, economic data, geopolitical events).`
    : status === 'holiday'
    ? `Today is ${dayName} and markets are closed for ${holidayName}. Write a 2-3 sentence market note. Wish investors a happy ${holidayName}, briefly cover recent market context, and note what to watch when markets reopen.`
    : status === 'pre'
    ? `Today is ${dayName} and markets open in a few hours. Search for overnight futures action and pre-market news. Write a 2-3 sentence pre-market recap covering what to watch when the market opens today.`
    : status === 'open'
    ? `Markets are open right now (${dayName}). Search for today's market action. Write a 2-3 sentence recap: what's driving markets today, which sectors are moving, what's the main story.`
    : `Markets just closed today (${dayName}). Search for how markets closed and why. Write a 2-3 sentence end-of-day recap covering what happened and what to watch tomorrow.`

  try {
    const text = await callGrok(systemPrompt, userPrompt)
    _cache = { text, status: label, cachedAt: Date.now() }
    return NextResponse.json({ text, status: label })
  } catch {
    return NextResponse.json({ text: '', status: label })
  }
}
