import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkAILimit } from '@/lib/pro'
import { getStockQuote, getAnalystData } from '@/lib/yahoo-finance'

export const dynamic = 'force-dynamic'

// Extract tickers from text
function extractTickers(text: string): string[] {
  const results = new Set<string>()
  // $TICKER format
  const dollar = text.match(/\$([A-Za-z]{1,5})/g) ?? []
  dollar.forEach(m => results.add(m.slice(1).toUpperCase()))
  // Bare uppercase 2-5 chars
  const upper = text.match(/\b([A-Z]{2,5})\b/g) ?? []
  const skip = new Set(['AI','ETF','CEO','IPO','GDP','EPS','PE','BUY','SELL','USD','US','UK','IF','OR','IN','AT','TO','OF','ON','BY','BE','IT','IS','AS','AN','AM','DO','GO','SO','UP','NO','OK'])
  upper.forEach(m => { if (!skip.has(m)) results.add(m) })
  return Array.from(results).slice(0, 2)
}

export async function POST(req: Request) {
  const limited = await checkAILimit('reality-check')
  if (limited) return limited

  try {
    const { input } = await req.json()
    if (!input?.trim()) return NextResponse.json({ error: 'No input' }, { status: 400 })

    // Try to fetch live stock data for any tickers mentioned
    const tickers = extractTickers(input)
    let liveContext = ''

    if (tickers.length > 0) {
      const results = await Promise.allSettled(
        tickers.map(async (t) => {
          const [quote, analyst] = await Promise.allSettled([
            getStockQuote(t),
            getAnalystData(t),
          ])
          const q = quote.status === 'fulfilled' ? quote.value : null
          const a = analyst.status === 'fulfilled' ? analyst.value : null
          if (!q) return null
          let ctx = `${t} (${q.companyName}): $${q.price?.toFixed(2)}, ${q.changePercent >= 0 ? '+' : ''}${q.changePercent?.toFixed(2)}% today`
          if (q.peRatio) ctx += `, P/E ${q.peRatio.toFixed(1)}`
          if (q.week52High && q.week52Low) ctx += `, 52wk range $${q.week52Low.toFixed(2)}–$${q.week52High.toFixed(2)}`
          if (a?.targetMean && q.price) {
            const upside = ((a.targetMean - q.price) / q.price) * 100
            ctx += `, analyst target $${a.targetMean.toFixed(2)} (${upside >= 0 ? '+' : ''}${upside.toFixed(1)}% from here), rating: ${a.recommendationLabel ?? a.recommendation ?? 'N/A'}`
          }
          return ctx
        })
      )
      const valid = results.filter(r => r.status === 'fulfilled' && r.value).map(r => (r as any).value)
      if (valid.length > 0) liveContext = `\n\nLive data:\n${valid.join('\n')}`
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `Someone said this: "${input}"${liveContext}

Give them a reality check. This could be a stock tip, a trade idea, or anything finance-related. Be direct, funny if appropriate, and use the live data if available.

Structure your response EXACTLY like this (use these exact labels on their own line):

VERDICT: [one of: SOLID IDEA / RISKY BUT COULD WORK / SKETCHY / NOPE]

WHAT'S REAL: [2-3 sentences fact-checking the claim against real data if available, or giving honest context. Be specific with numbers if you have them.]

THE CATCH: [1-2 sentences on the biggest risk or thing they're missing]

BOTTOM LINE: [one punchy sentence. Make it memorable.]`

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      system: 'You are Mr. Guy, a funny finance mascot who gives brutally honest reality checks. Plain English only — no jargon. No markdown asterisks or pound signs. No em dashes. Confident, direct, occasionally funny. If you use a finance term, explain it immediately in plain words.',
      messages: [{ role: 'user', content: prompt }],
    })

    const text = ((msg.content[0] as any).text ?? '').trim()

    // Parse sections
    const verdictMatch = text.match(/VERDICT:\s*(.+)/i)
    const realMatch = text.match(/WHAT'S REAL:\s*([\s\S]+?)(?=THE CATCH:|BOTTOM LINE:|$)/i)
    const catchMatch = text.match(/THE CATCH:\s*([\s\S]+?)(?=BOTTOM LINE:|$)/i)
    const bottomMatch = text.match(/BOTTOM LINE:\s*(.+)/i)

    return NextResponse.json({
      verdict: verdictMatch?.[1]?.trim() ?? 'SKETCHY',
      whatsReal: realMatch?.[1]?.trim() ?? '',
      theCatch: catchMatch?.[1]?.trim() ?? '',
      bottomLine: bottomMatch?.[1]?.trim() ?? '',
      rawText: text,
      tickersFound: tickers,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
