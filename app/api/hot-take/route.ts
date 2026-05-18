import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

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

interface HotTakeResult {
  ticker: string
  companyName: string
  price: number
  changePercent: number
  hotTake: string
  verdict: 'bullish' | 'bearish' | 'chaotic'
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

interface YahooMover {
  symbol: string
  shortName?: string
  longName?: string
  regularMarketPrice?: number
  regularMarketChangePercent?: number
}

async function fetchMovers(scrId: string): Promise<YahooMover[]> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds=${scrId}&count=5`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(8000),
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data?.finance?.result?.[0]?.quotes ?? []
  } catch {
    return []
  }
}

export async function GET() {
  const today = todayStr()

  // Check DB for today's hot take first
  try {
    const cached = await prisma.hotTakeCache.findUnique({ where: { date: today } })
    if (cached) return NextResponse.json(JSON.parse(cached.data))
  } catch {}

  const [gainers, losers] = await Promise.all([
    fetchMovers('day_gainers'),
    fetchMovers('day_losers'),
  ])

  const allMovers = [...gainers, ...losers]

  if (allMovers.length === 0) {
    return NextResponse.json({ error: 'Could not fetch market movers' }, { status: 503 })
  }

  const moverSummary = allMovers
    .map((q) => {
      const pct = q.regularMarketChangePercent ?? 0
      const sign = pct >= 0 ? '+' : ''
      return `${q.symbol} (${q.shortName ?? q.longName ?? q.symbol}): $${(q.regularMarketPrice ?? 0).toFixed(2)} ${sign}${pct.toFixed(2)}%`
    })
    .join('\n')

  const client = new Anthropic({ apiKey: getAnthropicKey() })

  const prompt = `Here are today's biggest stock movers:\n\n${moverSummary}\n\nPick the single most interesting stock from this list. Give me your hot take on it. Respond ONLY with valid JSON in exactly this format, no extra text:\n{"ticker":"SYMBOL","companyName":"Full Name","price":123.45,"changePercent":4.56,"hotTake":"Your 2-3 sentence casual hot take here.","verdict":"bullish"}\n\nverdict must be exactly one of: bullish, bearish, chaotic`

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 400,
      system: 'You are Mr. Guy, a funny stock mascot. Give hot takes on stocks in plain casual English. No jargon. No markdown. Be opinionated.',
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = ((msg.content[0] as any).text ?? '').trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const parsed: HotTakeResult = JSON.parse(jsonMatch[0])

    // Sanity-fill price/changePercent from Yahoo data if Claude hallucinated
    const source = allMovers.find((q) => q.symbol === parsed.ticker)
    if (source) {
      parsed.price = source.regularMarketPrice ?? parsed.price
      parsed.changePercent = source.regularMarketChangePercent ?? parsed.changePercent
      parsed.companyName = source.shortName ?? source.longName ?? parsed.companyName
    }

    if (!['bullish', 'bearish', 'chaotic'].includes(parsed.verdict)) {
      parsed.verdict = 'chaotic'
    }

    // Persist to DB so cold starts don't regenerate a different stock
    try {
      await prisma.hotTakeCache.upsert({
        where: { date: today },
        update: {},  // never overwrite existing hot take for the day
        create: { date: today, data: JSON.stringify(parsed) },
      })
    } catch {}

    return NextResponse.json(parsed)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to generate hot take' }, { status: 500 })
  }
}
