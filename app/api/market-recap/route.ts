import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Slot helpers ─────────────────────────────────────────────────────────────
function getSlot(): { date: string; slot: 'morning' | 'midday'; id: string } {
  const now = new Date()
  const etHour = parseInt(
    now.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/New_York' }),
    10
  )
  const date = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const slot: 'morning' | 'midday' = etHour < 12 ? 'morning' : 'midday'
  return { date, slot, id: `recap-${date}-${slot}` }
}

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
  const { date, slot, id } = getSlot()

  // 1. Serve from DB cache
  const cached = await prisma.marketBriefCache.findUnique({ where: { id } }).catch(() => null)
  if (cached) {
    return NextResponse.json({ ...(JSON.parse(cached.data)), fromCache: true })
  }

  // 2. Cache miss — generate
  const [fearGreed, sectors] = await Promise.all([fetchFearGreed(), fetchSectors()])

  const top3 = (sectors as any[]).slice(0, 3).map((s: any) => `${s.sym} ${s.pct > 0 ? '+' : ''}${s.pct}%`).join(', ')
  const bot3 = (sectors as any[]).slice(-3).map((s: any) => `${s.sym} ${s.pct > 0 ? '+' : ''}${s.pct}%`).join(', ')

  const context = [
    fearGreed ? `Fear & Greed Index: ${fearGreed}` : '',
    top3 ? `Top performing sectors: ${top3}` : '',
    bot3 ? `Weakest sectors: ${bot3}` : '',
  ].filter(Boolean).join('. ')

  let recap = 'Market recap unavailable right now. Check the Markets page for live data.'
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 200,
      system: `You write brief, sharp ${slot} market recaps for retail investors. 2-3 sentences max. Plain English, no complicated finance terms. Mention sentiment and notable sector moves. No investment advice. No bullet points.`,
      messages: [{
        role: 'user',
        content: `Write a ${slot === 'morning' ? 'morning market outlook' : 'midday market check-in'} based on this data: ${context || 'Markets are trading normally today.'}`,
      }],
    })
    if (response.content[0].type === 'text') recap = response.content[0].text
  } catch { /* use fallback */ }

  const payload = { recap, fearGreed, generatedAt: new Date().toISOString(), slot }

  // 3. Save to DB — fire and forget
  prisma.marketBriefCache.upsert({
    where: { id },
    update: { data: JSON.stringify(payload) },
    create: { id, slot, date, data: JSON.stringify(payload) },
  }).catch(() => {})

  return NextResponse.json(payload)
}
