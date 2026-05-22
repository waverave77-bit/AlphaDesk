import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// SEC EDGAR requires: "Company Name contact@domain.com" format in User-Agent
const SEC_HEADERS = {
  'User-Agent': 'Mr. Guy Invests noreply@mrguyinvests.com',
  'Accept': 'application/json, text/plain, */*',
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Trade {
  name: string
  title: string
  company: string
  ticker: string
  type: string
  shares: number
  price: number
  totalValue: number
  transactionDate: string
  filingDate: string
  chamber: string
}

// ─── DB cache helpers ─────────────────────────────────────────────────────────

async function loadCachedTrades(): Promise<{ trades: Trade[]; updatedAt: Date } | null> {
  try {
    const row = await prisma.insiderTradeCache.findUnique({ where: { id: 'singleton' } })
    if (!row) return null
    return { trades: JSON.parse(row.trades) as Trade[], updatedAt: row.updatedAt }
  } catch {
    return null
  }
}

async function saveCachedTrades(trades: Trade[]): Promise<void> {
  try {
    await prisma.insiderTradeCache.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', trades: JSON.stringify(trades) },
      update: { trades: JSON.stringify(trades) },
    })
  } catch (e) {
    console.error('[politicians] failed to save DB cache:', e)
  }
}

// ─── Parse a single Form 4 filing ─────────────────────────────────────────────

async function parseForm4(adsh: string, ciks: string[]): Promise<Trade | null> {
  try {
    if (!adsh) return null
    const issuerCik = (ciks[1] ?? ciks[0] ?? '').replace(/^0+/, '')
    if (!issuerCik) return null

    const accNoDash = adsh.replace(/-/g, '')
    const url = `https://www.sec.gov/Archives/edgar/data/${issuerCik}/${accNoDash}/${adsh}.txt`

    const res = await fetch(url, {
      headers: SEC_HEADERS,
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const txt = await res.text()

    if (txt.startsWith('<!') || txt.startsWith('<html') || txt.includes('Undeclared Automated Tool')) return null

    const xmlMatch = txt.match(/<XML>([\s\S]*?)<\/XML>/i)
    if (!xmlMatch) return null
    const xml = xmlMatch[1]

    const ticker    = xml.match(/<issuerTradingSymbol>(.*?)<\/issuerTradingSymbol>/)?.[1]?.trim() ?? ''
    const company   = xml.match(/<issuerName>(.*?)<\/issuerName>/)?.[1]?.trim() ?? ''
    const ownerName = xml.match(/<rptOwnerName>(.*?)<\/rptOwnerName>/)?.[1]?.trim() ?? ''
    const title     = xml.match(/<officerTitle>(.*?)<\/officerTitle>/)?.[1]?.trim() ?? 'Director'
    const transCode = xml.match(/<transactionCode>(.*?)<\/transactionCode>/i)?.[1]?.trim() ?? ''
    const shares    = parseFloat(xml.match(/<transactionShares>[\s\S]*?<value>(.*?)<\/value>/)?.[1] ?? '0')
    const price     = parseFloat(xml.match(/<transactionPricePerShare>[\s\S]*?<value>(.*?)<\/value>/)?.[1] ?? '0')
    const txDate    = xml.match(/<transactionDate>[\s\S]*?<value>(.*?)<\/value>/)?.[1]?.trim() ?? ''

    if (!ticker || !company || !ownerName || shares === 0) return null
    if (transCode !== 'P' && transCode !== 'S') return null

    return {
      name: ownerName,
      title,
      company,
      ticker: ticker.toUpperCase(),
      type: transCode === 'P' ? 'Purchase' : 'Sale',
      shares,
      price,
      totalValue: shares * price,
      transactionDate: txDate,
      filingDate: txDate,
      chamber: title,
    }
  } catch {
    return null
  }
}

// Bounded concurrency — SEC allows ≤ 10 req/sec
async function withLimit<T>(tasks: (() => Promise<T | null>)[], limit: number): Promise<(T | null)[]> {
  const out: (T | null)[] = new Array(tasks.length).fill(null)
  let cur = 0
  const run = async (): Promise<void> => {
    while (cur < tasks.length) {
      const i = cur++
      try { out[i] = await tasks[i]() } catch { out[i] = null }
    }
  }
  await Promise.all(Array.from({ length: limit }, run))
  return out
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET() {
  // ── 1. Try to fetch fresh data from SEC EDGAR ──────────────────────────────
  try {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 60)
    const fmt = (d: Date) => d.toISOString().split('T')[0]

    const searchUrl =
      `https://efts.sec.gov/LATEST/search-index?q=%22%22&forms=4` +
      `&dateRange=custom&startdt=${fmt(start)}&enddt=${fmt(end)}` +
      `&from=0&size=100`

    const searchRes = await fetch(searchUrl, {
      headers: SEC_HEADERS,
      signal: AbortSignal.timeout(10000),
    })

    if (searchRes.ok) {
      const body = await searchRes.text()

      // Guard against SEC block page
      if (!body.startsWith('<!') && !body.includes('Undeclared Automated Tool')) {
        const json = JSON.parse(body)
        const hits: any[] = json.hits?.hits ?? []

        if (hits.length > 0) {
          const tasks = hits.map((h: any) => () => parseForm4(
            h._source?.adsh ?? '',
            h._source?.ciks ?? [],
          ))
          const results = await withLimit(tasks, 8)
          const trades: Trade[] = (results.filter(Boolean) as Trade[])
            .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())

          if (trades.length > 0) {
            // ✅ Success — save to DB so future failures can fall back to this
            await saveCachedTrades(trades)
            console.log(`[politicians] live fetch: ${trades.length} trades saved to DB cache`)

            return NextResponse.json(
              { trades, fromCache: false },
              { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' } },
            )
          }
        }
      }
    }
  } catch (e: any) {
    console.error('[politicians] live fetch failed:', e.message)
  }

  // ── 2. Live fetch failed or returned empty — serve last DB-cached data ──────
  console.warn('[politicians] falling back to DB cache')
  const cached = await loadCachedTrades()

  if (cached && cached.trades.length > 0) {
    console.log(`[politicians] serving ${cached.trades.length} cached trades from ${cached.updatedAt.toISOString()}`)
    return NextResponse.json(
      { trades: cached.trades, fromCache: true, cachedAt: cached.updatedAt.toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
    )
  }

  // ── 3. No cache at all — return empty with a clear error ───────────────────
  console.error('[politicians] no live data and no DB cache available')
  return NextResponse.json({ trades: [], error: 'unavailable' }, { status: 503 })
}
