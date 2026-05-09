import { NextResponse } from 'next/server'
import https from 'https'
export const dynamic = 'force-dynamic'

// ─── HTTP helper ───────────────────────────────────────────────────────────────

function httpGet(url: string, timeoutMs = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const req = https.get({
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: {
        'User-Agent': 'AlphaDesk/1.0 contact@alphadesk.app',
        'Accept': '*/*',
      },
      timeout: timeoutMs,
    }, (res) => {
      let data = ''
      res.on('data', (c: Buffer) => { data += c.toString() })
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
  })
}

// Bounded-concurrency executor — keeps at most `limit` async tasks running at once.
// SEC EDGAR allows ≤ 10 req/sec; we stay under that to avoid rate-limiting.
async function withLimit<T>(
  tasks: (() => Promise<T | null>)[],
  limit: number,
): Promise<(T | null)[]> {
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

// ─── EDGAR parser ─────────────────────────────────────────────────────────────
//
// Every EDGAR filing has a guaranteed submission text file:
//   /Archives/edgar/data/{issuerCik}/{accno_nodash}/{accno_dashes}.txt
//
// This file always exists, is ~5-10 KB, and contains the full XML inside
// an <XML>…</XML> block — no directory-listing round-trip needed.
// This halves the total request count vs. the old approach.

async function parseForm4(adsh: string, ciks: string[]): Promise<Trade | null> {
  const issuerCik = (ciks[1] ?? ciks[0]).replace(/^0+/, '')
  const accNoDash = adsh.replace(/-/g, '')
  const url = `https://www.sec.gov/Archives/edgar/data/${issuerCik}/${accNoDash}/${adsh}.txt`

  const txt = await httpGet(url, 5000)

  // SEC returns HTML when rate-limited — bail immediately
  if (txt.startsWith('<!') || txt.startsWith('<html')) return null

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
  if (transCode !== 'P' && transCode !== 'S') return null   // skip awards, auto-plans, etc.

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
    filingDate: adsh.split('-').slice(1).join('-').slice(0, 6),
    chamber: title,
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 90)  // 90-day window for more variety
    const fmt = (d: Date) => d.toISOString().split('T')[0]

    // Search EDGAR for recent Form 4 filings — 100 results (EFTS max per page)
    const searchUrl =
      `https://efts.sec.gov/LATEST/search-index?q=&forms=4` +
      `&dateRange=custom&startdt=${fmt(start)}&enddt=${fmt(end)}` +
      `&_source=adsh,ciks,file_date&from=0&size=100`

    const raw = await httpGet(searchUrl, 8000)
    const hits: any[] = JSON.parse(raw).hits?.hits ?? []

    // Parse each filing using the predictable .txt URL — 10 concurrent to stay within
    // EDGAR's 10 req/sec limit.  On Vercel, CDN caching means this runs at most once
    // every 15 minutes so rate-limiting is not a practical concern.
    const tasks = hits.map((h: any) => () => parseForm4(h._source.adsh, h._source.ciks ?? []))
    const results = await withLimit(tasks, 10)

    const trades: Trade[] = (results.filter(Boolean) as Trade[])
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())

    // Cache at Vercel's CDN for 15 min so EDGAR is only hit once per 15-min window.
    // stale-while-revalidate means users always see data immediately (no spinner).
    return NextResponse.json(
      { trades },
      { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' } },
    )
  } catch (e: any) {
    return NextResponse.json({ trades: [], error: e.message }, { status: 500 })
  }
}
