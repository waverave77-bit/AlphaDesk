import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getStockQuote } from '@/lib/yahoo-finance'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

function getAnthropicKey(): string {
  const fromEnv = process.env.ANTHROPIC_API_KEY
  if (fromEnv && fromEnv.length > 10) return fromEnv
  try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    const content = fs.readFileSync(envPath, 'utf8')
    const match = content.match(/ANTHROPIC_API_KEY="?([^"\n]+)"?/)
    return match?.[1] ?? ''
  } catch { return '' }
}

// Week key based on the Sunday that starts the current Sun–Sat week
function getWeekKey(): string {
  const now = new Date()
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - now.getDay()) // getDay() 0=Sun
  const y = sunday.getFullYear()
  const m = String(sunday.getMonth() + 1).padStart(2, '0')
  const d = String(sunday.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// A rotating list of interesting tickers Mr. Guy picks from
const CANDIDATE_TICKERS = [
  'NVDA','TSLA','AAPL','META','AMZN','GOOGL','MSFT','AMD','NFLX','COIN',
  'PLTR','RBLX','SNAP','SPOT','HOOD','CRWD','NET','DDOG','SQ','SHOP',
  'SOFI','RIVN','NIO','GME','AMC','SMCI','ARM','AVGO','TSM','QCOM',
]

export async function GET() {
  const weekKey = getWeekKey()

  // Check DB for existing pick this week
  try {
    const cached = await prisma.weeklyPickCache.findUnique({ where: { weekKey } })
    if (cached) {
      const parsed = JSON.parse(cached.data)
      // One-time fix: if price was stored as previousClose (differs from live), refresh it with live price
      // We detect this by checking if price looks stale (no way to tell directly, so we re-fetch live price once
      // if the stored data lacks a "priceFixed" flag)
      if (!parsed.priceFixed) {
        try {
          const liveQuote = await getStockQuote(parsed.ticker).catch(() => null)
          if (liveQuote?.price) {
            parsed.price = liveQuote.price
            parsed.priceFixed = true
            await prisma.weeklyPickCache.update({
              where: { weekKey },
              data: { data: JSON.stringify(parsed) },
            })
          }
        } catch {}
      }
      return NextResponse.json(parsed)
    }
  } catch {}

  // Pick a ticker based on week hash (deterministic per week)
  const weekHash = weekKey.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const ticker = CANDIDATE_TICKERS[weekHash % CANDIDATE_TICKERS.length]

  try {
    const quote = await getStockQuote(ticker).catch(() => null)
    if (!quote) return NextResponse.json({ error: 'No data' }, { status: 500 })

    const client = new Anthropic({ apiKey: getAnthropicKey() })

    const prompt = `This week's stock pick challenge is ${ticker} (${quote.companyName}). Current price: $${quote.price?.toFixed(2)}, P/E: ${quote.peRatio?.toFixed(1) ?? 'N/A'}, this year change: approx ${quote.changePercent?.toFixed(1)}% today.

You are Mr. Guy picking this stock for the weekly challenge. Give your prediction for this week in this exact JSON format (no other text):
{
  "direction": "up" or "down",
  "targetPct": number (1-15, how much you think it moves this week),
  "reasoning": "2 sentences max, casual and funny, explain why you picked this direction this week"
}

Be opinionated. Pick a direction and commit.`

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 200,
      system: 'You are Mr. Guy, a funny finance mascot. Return only valid JSON, no markdown, no extra text.',
      messages: [{ role: 'user', content: prompt }],
    })

    const text = (msg.content[0] as any).text?.trim() ?? ''
    let parsed: any = {}
    try {
      parsed = JSON.parse(text)
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
    }

    const data = {
      weekKey,
      ticker,
      companyName: quote.companyName,
      // Use current price as entry — locked in at first view, persisted in DB so it never drifts
      price: quote.price,
      changePercent: quote.changePercent,
      direction: parsed.direction ?? 'up',
      targetPct: parsed.targetPct ?? 5,
      reasoning: parsed.reasoning ?? 'I have a good feeling about this one.',
    }

    // Persist to DB so cold starts don't regenerate with a new entry price
    try {
      await prisma.weeklyPickCache.upsert({
        where: { weekKey },
        update: {},   // never overwrite an existing pick
        create: { weekKey, data: JSON.stringify(data) },
      })
    } catch {}

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to generate pick' }, { status: 500 })
  }
}
