import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAILimit } from '@/lib/pro'
import { getStockQuote, searchStocks } from '@/lib/yahoo-finance'
import { getExperienceContext } from '@/lib/experience'
import { callDeepSeek } from '@/lib/deepseek'

export const dynamic = 'force-dynamic'


function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface BullVsBearResult {
  ticker: string
  companyName: string
  price: number
  changePercent: number
  bullCase: string
  bearCase: string
  verdict: 'bull' | 'bear'
  verdictText: string
}

export async function POST(req: Request) {
  const limited = await checkAILimit('bull-vs-bear')
  if (limited) return limited

  let rawQuery: string
  let experience: string
  try {
    const body = await req.json()
    rawQuery = (body.ticker ?? '').trim()
    experience = (body.experience ?? 'beginner') as string
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!rawQuery) {
    return NextResponse.json({ error: 'Ticker or company name is required' }, { status: 400 })
  }

  // Step 1: Resolve to a canonical ticker symbol
  // If it looks like a ticker already, skip the search
  let ticker = rawQuery.toUpperCase()
  let companyName = ticker

  const looksLikeTicker = /^[A-Za-z]{1,6}$/.test(rawQuery)

  if (!looksLikeTicker) {
    // Company name — search for the best match
    const results = await searchStocks(rawQuery)
    if (results.length === 0) {
      return NextResponse.json(
        { error: `Couldn't find a stock matching "${rawQuery}". Try a ticker like AAPL or TSLA.` },
        { status: 400 }
      )
    }
    ticker = results[0].ticker
    companyName = results[0].name
  } else {
    // Might still be a company name typed in all-caps — try search first
    const results = await searchStocks(rawQuery)
    if (results.length > 0) {
      ticker = results[0].ticker
      companyName = results[0].name
    }
  }

  // Step 2: Check cache — same verdict all day for the same ticker
  const cacheKey = `${ticker}-${todayStr()}`
  try {
    const cached = await prisma.bullBearCache.findUnique({ where: { id: cacheKey } })
    if (cached) return NextResponse.json(JSON.parse(cached.data))
  } catch {}

  // Step 3: Fetch real quote data (uses crumb auth internally)
  const quote = await getStockQuote(ticker)
  if (!quote) {
    return NextResponse.json(
      { error: `No price data found for "${ticker}". It may be delisted or unavailable.` },
      { status: 400 }
    )
  }

  // Use the most accurate names from the quote
  companyName = quote.companyName || companyName

  // Build data context string for the AI
  const sign = quote.changePercent >= 0 ? '+' : ''
  const dataLines: string[] = [
    `Ticker: ${ticker}`,
    `Company: ${companyName}`,
    `Current Price: $${quote.price.toFixed(2)}`,
    `Today's Change: ${sign}${quote.changePercent.toFixed(2)}%`,
  ]
  if (quote.dayHigh != null) dataLines.push(`Day Range: $${(quote.dayLow ?? 0).toFixed(2)} – $${quote.dayHigh.toFixed(2)}`)
  if (quote.week52High != null) dataLines.push(`52-Week Range: $${(quote.week52Low ?? 0).toFixed(2)} – $${quote.week52High.toFixed(2)}`)
  if (quote.peRatio != null && quote.peRatio > 0) dataLines.push(`P/E Ratio: ${quote.peRatio.toFixed(1)}`)
  if (quote.marketCap != null) dataLines.push(`Market Cap: $${(quote.marketCap / 1_000_000_000).toFixed(1)}B`)
  if (quote.volume > 0) dataLines.push(`Volume: ${(quote.volume / 1_000_000).toFixed(1)}M`)
  if (quote.sector) dataLines.push(`Sector: ${quote.sector}`)

  const stockDataStr = dataLines.join('\n')

  const userPrompt = `${stockDataStr}

For ${ticker} (${companyName}) trading at $${quote.price.toFixed(2)} (${sign}${quote.changePercent.toFixed(2)}% today), give me:
1. The BULL CASE: 3-4 punchy sentences why this stock rips from here
2. The BEAR CASE: 3-4 punchy sentences why this stock is cooked
3. YOUR VERDICT: Which side wins and why in 2 sentences max. Be decisive.

Respond ONLY in this exact JSON format:
{"ticker":"SYMBOL","companyName":"Name","price":0.00,"changePercent":0.00,"bullCase":"...","bearCase":"...","verdict":"bull","verdictText":"..."}

verdict must be exactly "bull" or "bear".`

  try {
    const raw = await callDeepSeek(
      `You are Mr. Guy — a sharp, funny, no-BS stock analyst. When asked to debate a stock, you write both sides of the trade honestly, then pick one. Casual language. No markdown asterisks. No headers with ##. Just clean sentences.${getExperienceContext(experience)}`,
      userPrompt,
      600,
    )
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const parsed: BullVsBearResult = JSON.parse(jsonMatch[0])

    // Ensure verdict is valid
    if (parsed.verdict !== 'bull' && parsed.verdict !== 'bear') parsed.verdict = 'bull'

    // Always overwrite with real Yahoo data — never trust hallucinated numbers
    parsed.ticker = ticker
    parsed.price = quote.price
    parsed.changePercent = quote.changePercent
    parsed.companyName = companyName

    // Cache so the same ticker returns the same verdict all day
    try {
      await prisma.bullBearCache.upsert({
        where: { id: cacheKey },
        update: {},
        create: { id: cacheKey, data: JSON.stringify(parsed) },
      })
    } catch {}

    return NextResponse.json(parsed)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to generate analysis: ${message}` }, { status: 500 })
  }
}
