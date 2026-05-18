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

export interface HotTakeResult {
  ticker: string
  companyName: string
  price: number
  changePercent: number
  hotTake: string
  verdict: 'bullish'
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

interface YahooQuote {
  symbol: string
  shortName?: string
  longName?: string
  regularMarketPrice?: number
  regularMarketChangePercent?: number
  averageDailyVolume3Month?: number
}

// Use Yahoo Finance screener to dynamically find active stocks under $100
// Sorted by % change so the most interesting ones bubble up
async function fetchScreenerStocks(): Promise<YahooQuote[]> {
  try {
    const body = {
      offset: 0,
      size: 200,
      sortField: 'percentchange',
      sortType: 'DESC',
      quoteType: 'EQUITY',
      topOperator: 'AND',
      query: {
        operator: 'AND',
        operands: [
          { operator: 'lt', operands: ['regularMarketPrice', 100] },
          { operator: 'gt', operands: ['regularMarketPrice', 2] },        // skip penny stocks
          { operator: 'gt', operands: ['averageDailyVolume3Month', 500000] }, // decent liquidity
        ],
      },
    }

    const res = await fetch(
      'https://query1.finance.yahoo.com/v1/finance/screener?formatted=false&lang=en-US&region=US',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(12000),
      }
    )

    if (!res.ok) return []
    const data = await res.json()
    return data?.finance?.result?.[0]?.quotes ?? []
  } catch {
    return []
  }
}

// Fallback: batch-fetch a larger hardcoded list if screener fails
const FALLBACK_TICKERS = [
  'SOFI','HOOD','RIVN','NIO','SNAP','PLTR','RBLX','GME','F','T','BAC','WFC',
  'LYFT','VALE','SOUN','IONQ','SQ','MARA','RIOT','AI','JOBY','BBAI','CLSK',
  'GRAB','DKNG','LCID','SPCE','HUT','OPEN','SMCI','UBER','DASH','COIN','DDOG',
  'CRWD','NET','AFRM','UPST','LMND','WISH','CLOV','WKHS','NKLA','BLNK','CHPT',
  'PLUG','FCEL','BLDP','HYZN','NNOX','SKLZ','GENI','MTTR','BIRD','CRTX','SEER',
  'OZON','LIZI','TIGR','FUTU','BEKE','VNET','KC','DOYU','HUYA','IQ','BILI',
  'SE','GRAB','GOTO','BABA','JD','PDD','NTES','BIDU','TME','WB','MOMO',
  'VALE','ITUB','BBD','SID','PBR','CIG','ABEV','ERJ','AZUL','TUPY',
  'NOK','ERIC','TEF','KB','SAN','ING','AEG','PHG','ASML','STM',
  'BB','BBRY','SIRI','VUZI','KTOS','AVAV','RCAT','AEYE','AIOT','BZFD',
]

async function fetchBatchQuotes(symbols: string[]): Promise<YahooQuote[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}&fields=symbol,shortName,longName,regularMarketPrice,regularMarketChangePercent,averageDailyVolume3Month`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data?.quoteResponse?.result ?? []
  } catch {
    return []
  }
}

export async function GET() {
  const today = todayStr()

  // Check DB for today's pick first
  try {
    const cached = await prisma.hotTakeCache.findUnique({ where: { date: today } })
    if (cached) return NextResponse.json(JSON.parse(cached.data))
  } catch {}

  // Try live screener first (hundreds of stocks), fallback to hardcoded list
  let allQuotes = await fetchScreenerStocks()

  if (allQuotes.length < 10) {
    // Screener failed — use fallback batch fetch
    const fallback = await fetchBatchQuotes(FALLBACK_TICKERS)
    allQuotes = fallback.filter(
      (q) => q.regularMarketPrice != null && q.regularMarketPrice < 100 && q.regularMarketPrice > 2
    )
  }

  if (allQuotes.length === 0) {
    return NextResponse.json({ error: 'Could not fetch stock data' }, { status: 503 })
  }

  // Randomly sample 20 from the pool so Mr. Guy sees different stocks each day
  // (screener is already sorted by % change so shuffle gives variety)
  const shuffled = allQuotes
    .filter((q) => q.regularMarketPrice != null && q.regularMarketPrice < 100 && q.regularMarketPrice > 2)
    .sort(() => Math.random() - 0.5)
    .slice(0, 20)

  const summary = shuffled
    .map((q) => {
      const pct = q.regularMarketChangePercent ?? 0
      const sign = pct >= 0 ? '+' : ''
      const name = q.shortName ?? q.longName ?? q.symbol
      return `${q.symbol} (${name}): $${(q.regularMarketPrice ?? 0).toFixed(2)} ${sign}${pct.toFixed(2)}% today`
    })
    .join('\n')

  const client = new Anthropic({ apiKey: getAnthropicKey() })

  const prompt = `Here are ${shuffled.length} stocks currently trading under $100:\n\n${summary}\n\nYou are Mr. Guy. Pick the ONE stock from this list you are most bullish on for the next 1–2 weeks. Think about momentum, sector, or just your gut. Give your hot take on why it's about to pop.\n\nRespond ONLY with valid JSON in exactly this format, no extra text:\n{"ticker":"SYMBOL","companyName":"Full Name","price":12.34,"changePercent":1.23,"hotTake":"Your 2-3 sentence casual bullish take on why this stock is about to move up in the next week or two.","verdict":"bullish"}\n\nverdict must always be exactly: bullish`

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 400,
      system: 'You are Mr. Guy, a funny stock mascot who is always bullish on under-$100 stocks. Pick your favorite for the next 1-2 weeks. Plain casual English. No jargon. No markdown. Be confident and funny.',
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = ((msg.content[0] as any).text ?? '').trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const parsed: HotTakeResult = JSON.parse(jsonMatch[0])

    // Sanity-fill from real Yahoo data so price is always accurate
    const source = allQuotes.find((q) => q.symbol === parsed.ticker)
    if (source) {
      parsed.price = source.regularMarketPrice ?? parsed.price
      parsed.changePercent = source.regularMarketChangePercent ?? parsed.changePercent
      parsed.companyName = source.shortName ?? source.longName ?? parsed.companyName
    }

    parsed.verdict = 'bullish'

    // Persist to DB — never overwrite once set for the day
    try {
      await prisma.hotTakeCache.upsert({
        where: { date: today },
        update: {},
        create: { date: today, data: JSON.stringify(parsed) },
      })
    } catch {}

    return NextResponse.json(parsed)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to generate hot take' }, { status: 500 })
  }
}
