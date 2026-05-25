import { NextRequest, NextResponse } from 'next/server'
import { checkAILimit } from '@/lib/pro'
import { getStockQuote, getAnalystData, getEarningsHistory } from '@/lib/yahoo-finance'
import { getExperienceContext } from '@/lib/experience'
import { callDeepSeek } from '@/lib/deepseek'

export const dynamic = 'force-dynamic'

const MR_GUY_SYSTEM_BASE = `You are Mr. Guy, a funny finance mascot who talks like a smart friend at a bar. Plain English only — no complicated finance terms. If you use a finance term, immediately explain it in parentheses. Casual, confident, occasionally funny. No markdown asterisks or pound signs. No em dashes. Emojis only: 🟢 🟡 🔴 🚨 ✅ ❌.`

export async function GET(req: NextRequest) {
  const limited = await checkAILimit('report-card')
  if (limited) return limited

  try {
    const { searchParams } = new URL(req.url)
    const ticker = searchParams.get('ticker')?.toUpperCase()
    const experience = searchParams.get('experience') ?? 'beginner'
    if (!ticker) {
      return NextResponse.json({ error: 'Missing ticker' }, { status: 400 })
    }

    const [quoteResult, analystResult, earningsResult] = await Promise.allSettled([
      getStockQuote(ticker),
      getAnalystData(ticker),
      getEarningsHistory(ticker),
    ])

    const q = quoteResult.status === 'fulfilled' ? quoteResult.value : null
    const a = analystResult.status === 'fulfilled' ? analystResult.value : null
    const earnings: { date: string; eps: number }[] = earningsResult.status === 'fulfilled' ? (earningsResult.value ?? []) : []

    if (!q) {
      return NextResponse.json({ error: `Could not find data for ${ticker}` }, { status: 404 })
    }

    const last4 = earnings.slice(-4)
    // TTM EPS requires a full 4 quarters for accuracy; fewer quarters understates or overstates annualised earnings
    const ttmEps = last4.length >= 4 ? last4.reduce((s, x) => s + x.eps, 0) : null
    const epsTrend = last4.length >= 2 ? last4.map(e => `$${e.eps.toFixed(2)}`).join(' -> ') : 'N/A'

    const pctFromHigh = q.week52High && q.price ? ((q.price - q.week52High) / q.week52High) * 100 : null
    const pctFromLow = q.week52Low && q.price ? ((q.price - q.week52Low) / q.week52Low) * 100 : null
    const analystUpside = a?.targetMean && q.price ? ((a.targetMean - q.price) / q.price) * 100 : null

    const dataBlock = `
Ticker: ${ticker}
Company: ${q.companyName}
Price: $${q.price.toFixed(2)} (${q.changePercent >= 0 ? '+' : ''}${q.changePercent.toFixed(2)}% today)
P/E Ratio: ${q.peRatio ? q.peRatio.toFixed(1) : 'N/A'}
EPS (TTM): ${ttmEps ? `$${ttmEps.toFixed(2)}` : q.eps ? `$${q.eps.toFixed(2)}` : 'N/A'}
EPS quarterly trend: ${epsTrend}
Beta (volatility): ${q.beta ? q.beta.toFixed(2) : 'N/A'}
52-week range: $${q.week52Low?.toFixed(2) ?? 'N/A'} - $${q.week52High?.toFixed(2) ?? 'N/A'}
Distance from 52wk high: ${pctFromHigh ? `${pctFromHigh.toFixed(1)}%` : 'N/A'}
Distance from 52wk low: ${pctFromLow ? `+${pctFromLow.toFixed(1)}%` : 'N/A'}
Analyst target: ${a?.targetMean ? `$${a.targetMean.toFixed(2)}` : 'N/A'}
Analyst upside: ${analystUpside != null ? `${analystUpside >= 0 ? '+' : ''}${analystUpside.toFixed(1)}%` : 'N/A'}
Analyst consensus: ${a?.recommendationLabel ?? 'N/A'}
Sector: ${q.sector ?? 'N/A'}
Market Cap: ${q.marketCap ? `$${(q.marketCap / 1e9).toFixed(1)}B` : 'N/A'}
Dividend Yield: ${q.dividendYield ? `${(q.dividendYield * 100).toFixed(2)}%` : 'None'}
`.trim()

    const userPrompt = `Grade this stock across 5 categories based on the data. Use letter grades: A+, A, A-, B+, B, B-, C+, C, C-, D, F.

${dataBlock}

Respond ONLY with valid JSON in this exact format (no extra text, no markdown):
{
  "grades": {
    "valuation": { "grade": "B", "note": "short note about why" },
    "growth": { "grade": "A", "note": "short note about why" },
    "momentum": { "grade": "C+", "note": "short note about why" },
    "risk": { "grade": "B-", "note": "short note about why" },
    "fundamentals": { "grade": "A-", "note": "short note about why" }
  },
  "overallGrade": "B+",
  "summary": "Mr. Guy one-sentence take on this stock"
}`

    const text = await callDeepSeek(
      MR_GUY_SYSTEM_BASE + getExperienceContext(experience),
      userPrompt,
      500,
    )
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse grades' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      ticker,
      companyName: q.companyName,
      price: q.price,
      changePercent: q.changePercent,
      grades: parsed.grades,
      overallGrade: parsed.overallGrade,
      summary: parsed.summary,
    })
  } catch (err: any) {
    console.error('Report card error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
