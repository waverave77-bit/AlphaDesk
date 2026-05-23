import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const revalidate = 3600 // cache for 1 hour

const getClient = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function fetchFearGreed() {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1', { next: { revalidate: 3600 } })
    const d = await res.json()
    const val = d?.data?.[0]
    return val ? `${val.value} (${val.value_classification})` : null
  } catch { return null }
}

async function fetchSectors() {
  try {
    const SECTORS = ['XLK', 'XLC', 'XLV', 'XLY', 'XLP', 'XLE', 'XLB', 'XLI', 'XLRE', 'XLF', 'XLU']
    const results = await Promise.allSettled(
      SECTORS.map(async (sym) => {
        const r = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=2d`,
          { next: { revalidate: 3600 } }
        )
        const d = await r.json()
        const quotes = d?.chart?.result?.[0]?.indicators?.quote?.[0]
        const closes = quotes?.close?.filter(Boolean)
        if (!closes || closes.length < 2) return null
        const pct = ((closes[closes.length - 1] - closes[closes.length - 2]) / closes[closes.length - 2]) * 100
        return { sym, pct: pct.toFixed(2) }
      })
    )
    return results
      .filter((r) => r.status === 'fulfilled' && r.value)
      .map((r) => (r as any).value)
      .sort((a: any, b: any) => parseFloat(b.pct) - parseFloat(a.pct))
  } catch { return [] }
}

export async function GET() {
  const [fearGreed, sectors] = await Promise.all([fetchFearGreed(), fetchSectors()])

  const top3 = (sectors as any[]).slice(0, 3).map((s: any) => `${s.sym} ${s.pct > 0 ? '+' : ''}${s.pct}%`).join(', ')
  const bot3 = (sectors as any[]).slice(-3).map((s: any) => `${s.sym} ${s.pct > 0 ? '+' : ''}${s.pct}%`).join(', ')

  const context = [
    fearGreed ? `Fear & Greed Index: ${fearGreed}` : '',
    top3 ? `Top performing sectors today: ${top3}` : '',
    bot3 ? `Weakest sectors today: ${bot3}` : '',
  ]
    .filter(Boolean)
    .join('. ')

  try {
    const response = await getClient().messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 200,
      system: `You write brief, sharp daily market recaps for retail investors.
Write 2-3 sentences max. Be factual, plain English, no jargon.
Mention sentiment and notable sector moves. No investment advice. No bullet points.`,
      messages: [
        {
          role: 'user',
          content: `Write today's market recap based on this data: ${context || 'Markets are open and trading normally today.'}`,
        },
      ],
    })

    const recap =
      response.content[0].type === 'text'
        ? response.content[0].text
        : 'Markets are trading today. Check the Markets page for full details.'

    return NextResponse.json({ recap, fearGreed, generatedAt: new Date().toISOString() })
  } catch {
    return NextResponse.json({
      recap: 'Market recap unavailable right now. Check the Markets page for live data.',
      generatedAt: new Date().toISOString(),
    })
  }
}
