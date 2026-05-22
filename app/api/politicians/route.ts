import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

// SEC EDGAR requires: "Company Name contact@domain.com" format in User-Agent
const SEC_HEADERS = {
  'User-Agent': 'Mr. Guy Invests noreply@mrguyinvests.com',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Encoding': 'gzip, deflate, br',
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

// ─── Parse a single Form 4 filing ─────────────────────────────────────────────

async function parseForm4(adsh: string, ciks: string[]): Promise<Trade | null> {
  try {
    const issuerCik = (ciks[1] ?? ciks[0]).replace(/^0+/, '')
    const accNoDash = adsh.replace(/-/g, '')
    const url = `https://www.sec.gov/Archives/edgar/data/${issuerCik}/${accNoDash}/${adsh}.txt`

    const res = await fetch(url, {
      headers: SEC_HEADERS,
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const txt = await res.text()

    // SEC returns HTML when rate-limited — bail immediately
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
    if (transCode !== 'P' && transCode !== 'S') return null   // purchases and sales only

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

// Bounded-concurrency — SEC allows ≤ 10 req/sec
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
  try {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 60) // 60-day window
    const fmt = (d: Date) => d.toISOString().split('T')[0]

    // EDGAR EFTS full-text search for recent Form 4 filings
    const searchUrl =
      `https://efts.sec.gov/LATEST/search-index?q=%22%22&forms=4` +
      `&dateRange=custom&startdt=${fmt(start)}&enddt=${fmt(end)}` +
      `&from=0&size=100`

    const searchRes = await fetch(searchUrl, {
      headers: SEC_HEADERS,
      signal: AbortSignal.timeout(10000),
    })

    if (!searchRes.ok) {
      console.error('[politicians] EFTS search failed:', searchRes.status, await searchRes.text().then(t => t.slice(0, 200)))
      return NextResponse.json({ trades: [], error: `EFTS ${searchRes.status}` }, { status: 500 })
    }

    const body = await searchRes.text()

    // Guard against HTML error pages from SEC
    if (body.startsWith('<!') || body.startsWith('<html') || body.includes('Undeclared Automated Tool')) {
      console.error('[politicians] SEC blocked request — check User-Agent')
      return NextResponse.json({ trades: [], error: 'sec_blocked' }, { status: 503 })
    }

    const json = JSON.parse(body)
    const hits: any[] = json.hits?.hits ?? []

    if (hits.length === 0) {
      console.warn('[politicians] EFTS returned 0 hits')
      return NextResponse.json({ trades: [] })
    }

    // Parse filings concurrently, max 8 at a time to stay under SEC rate limit
    const tasks = hits.map((h: any) => () => parseForm4(
      h._source?.adsh ?? h._id ?? '',
      h._source?.ciks ?? h._source?.entity_id ? [h._source.entity_id] : []
    ))
    const results = await withLimit(tasks, 8)

    const trades: Trade[] = (results.filter(Boolean) as Trade[])
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())

    console.log(`[politicians] Parsed ${trades.length} P/S trades from ${hits.length} filings`)

    return NextResponse.json(
      { trades },
      { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' } },
    )
  } catch (e: any) {
    console.error('[politicians] unhandled error:', e.message)
    return NextResponse.json({ trades: [], error: e.message }, { status: 500 })
  }
}
