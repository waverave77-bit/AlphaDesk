import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { checkAILimit } from '@/lib/pro'
import { getStockQuote, getAnalystData } from '@/lib/yahoo-finance'

export const dynamic = 'force-dynamic'

const MR_GUY_SYSTEM = `You are Mr. Guy, a funny finance mascot who talks like a smart friend at a bar. Plain English only — no jargon. If you use a finance term, immediately explain it in parentheses. Casual, confident, occasionally funny. No markdown asterisks or pound signs. No em dashes. Emojis only: 🟢 🟡 🔴 🚨 ✅ ❌.`

function extractTickers(text: string): string[] {
  const dollarTickers = (text.match(/\$([A-Z]{1,5})/g) ?? []).map(m => m.slice(1))
  const upperWords = (text.match(/\b([A-Z]{2,5})\b/g) ?? [])
  const skipWords = new Set([
    'AI','ETF','CEO','IPO','GDP','EPS','PE','BUY','SELL','USD','US','UK','EU',
    'FED','SEC','NYSE','SP','IRA','YTD','ATH','ATL','OR','IF','IN','AT','TO',
    'OF','ON','BY','BE','IT','IS','AS','AN','AM','DO','GO','HI','SO','UP','NO',
    'OK','ALL','AND','THE','FOR','NOT','BUT','ARE','WAS','HAS','HAD','CAN',
    'DID','GOT','GET','SET','LET','PUT','NEW','OLD','BIG','LOW','HIGH','TOP',
    'NOW','HOW','WHY','WHO','PPT','OTC','AUM','DCF','ROE','ROI','FCF','EV',
  ])
  const candidates = [...dollarTickers, ...upperWords.filter(w => !skipWords.has(w))]
  return Array.from(new Set(candidates))
}

export async function POST(req: NextRequest) {
  const limited = await checkAILimit('bs-checker')
  if (limited) return limited

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  try {
    const { tip } = await req.json()
    if (!tip || typeof tip !== 'string') {
      return NextResponse.json({ error: 'Missing tip' }, { status: 400 })
    }

    const candidates = extractTickers(tip)
    const tickersToFetch = candidates.slice(0, 2)

    const quoteResults = await Promise.allSettled(
      tickersToFetch.map(t => getStockQuote(t))
    )
    const analystResults = await Promise.allSettled(
      tickersToFetch.map(t => getAnalystData(t))
    )

    let contextParts: string[] = []
    let primaryTicker: string | undefined

    tickersToFetch.forEach((ticker, i) => {
      const quoteResult = quoteResults[i]
      const analystResult = analystResults[i]
      const q = quoteResult.status === 'fulfilled' ? quoteResult.value : null
      const a = analystResult.status === 'fulfilled' ? analystResult.value : null
      if (!q) return
      if (!primaryTicker) primaryTicker = ticker
      let block = `${ticker} (${q.companyName}): price $${q.price.toFixed(2)}, ${q.changePercent >= 0 ? '+' : ''}${q.changePercent.toFixed(2)}% today`
      if (q.peRatio) block += `, P/E ${q.peRatio.toFixed(1)}`
      if (q.week52High && q.week52Low) block += `, 52-week range $${q.week52Low.toFixed(2)}-$${q.week52High.toFixed(2)}`
      if (a?.targetMean && a.targetMean > 0) {
        const upside = ((a.targetMean - q.price) / q.price) * 100
        block += `, analyst target $${a.targetMean.toFixed(2)} (${upside >= 0 ? '+' : ''}${upside.toFixed(1)}% from current), consensus: ${a.recommendationLabel}`
      }
      contextParts.push(block)
    })

    const context = contextParts.length > 0 ? contextParts.join('\n') : 'No live data available for tickers mentioned.'

    const userPrompt = `Someone told me this stock tip: '${tip}'

Live data:
${context}

Give a BS verdict. Structure your response as:
VERDICT: [BS / LEGIT / MIXED]

WHY: [2-3 sentences explaining whether the claim checks out against real data]

BOTTOM LINE: [one punchy sentence]`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      system: MR_GUY_SYSTEM,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    const verdictMatch = text.match(/VERDICT:\s*(BS|LEGIT|MIXED)/i)
    const verdict = (verdictMatch?.[1]?.toUpperCase() ?? 'MIXED') as 'BS' | 'LEGIT' | 'MIXED'

    return NextResponse.json({ verdict, analysis: text, ticker: primaryTicker })
  } catch (err: any) {
    console.error('BS checker error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
