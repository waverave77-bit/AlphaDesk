import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const HEDGE_FUNDS = [
  { name: 'Bridgewater Associates',   cik: '1350694' },
  { name: 'Renaissance Technologies', cik: '1037389' },
  { name: 'Citadel Advisors',         cik: '1423053' },
  { name: 'Two Sigma Investments',    cik: '1179392' },
  { name: 'AQR Capital Management',   cik: '1167557' },
  { name: 'D.E. Shaw & Co.',          cik: '1009207' },
  { name: 'Viking Global Investors',  cik: '1103804' },
  { name: 'Point72 Asset Management', cik: '1603466' },
]

const CACHE_TTL_HOURS = 24
const UA = 'Zains Game contact@zainsgame.app'

async function secFetch(url: string, timeout = 12000): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: '*/*' },
      signal: AbortSignal.timeout(timeout),
    })
    if (!r.ok) return null
    const text = await r.text()
    if (text.startsWith('<!') || text.startsWith('<html')) return null
    return text
  } catch { return null }
}

function parseHoldings(txt: string, limit = 20) {
  const holdings: { name: string; value: number; shares: number }[] = []
  const regex = /<(?:\w+:)?infoTable>([\s\S]*?)<\/(?:\w+:)?infoTable>/gi
  let match
  while ((match = regex.exec(txt)) !== null) {
    const block = match[1]
    const name = block.match(/<(?:\w+:)?nameOfIssuer>(.*?)<\/(?:\w+:)?nameOfIssuer>/i)?.[1]?.trim() ?? ''
    const value = parseInt(block.match(/<(?:\w+:)?value>(.*?)<\/(?:\w+:)?value>/i)?.[1]?.trim() ?? '0', 10)
    const shares = parseInt(block.match(/<(?:\w+:)?sshPrnamt>(.*?)<\/(?:\w+:)?sshPrnamt>/i)?.[1]?.trim() ?? '0', 10)
    if (name && value > 0) holdings.push({ name, value, shares })
  }
  return holdings.sort((a, b) => b.value - a.value).slice(0, limit)
}

async function fetchFilingHoldings(cik: string, accNo: string, limit = 20) {
  const accNoDash = accNo.replace(/-/g, '')
  const base = `https://www.sec.gov/Archives/edgar/data/${cik}/${accNoDash}`
  const indexText = await secFetch(`${base}/${accNo}-index.json`)
  if (indexText) {
    try {
      const index = JSON.parse(indexText)
      const items: { name: string; type?: string }[] = index.directory?.item ?? []
      const infoFile = items.find(item => {
        const t = (item.type ?? '').toLowerCase()
        const n = (item.name ?? '').toLowerCase()
        return t.includes('information table') || n.includes('informationtable') || n.includes('infotable')
      })
      const anyXml = items.find(item => {
        const n = (item.name ?? '').toLowerCase()
        const t = (item.type ?? '').toLowerCase()
        return n.endsWith('.xml') && !n.includes('primary') && !t.includes('13f-hr') && !t.includes('submission')
      })
      const candidate = infoFile ?? anyXml
      if (candidate?.name) {
        const xmlText = await secFetch(`${base}/${candidate.name}`, 15000)
        if (xmlText) {
          const holdings = parseHoldings(xmlText, limit)
          if (holdings.length > 0) return holdings
        }
      }
    } catch {}
  }
  const txt = await secFetch(`${base}/${accNo}.txt`, 15000)
  return txt ? parseHoldings(txt, limit) : []
}

async function fetchFromSEC(fund: { name: string; cik: string }) {
  const empty = { ...fund, filingDate: null, topHoldings: [] }
  try {
    const padded = fund.cik.padStart(10, '0')
    const subText = await secFetch(`https://data.sec.gov/submissions/CIK${padded}.json`)
    if (!subText) return empty
    const sub = JSON.parse(subText)
    const forms: string[] = sub.filings?.recent?.form ?? []
    const accessions: string[] = sub.filings?.recent?.accessionNumber ?? []
    const dates: string[] = sub.filings?.recent?.filingDate ?? []
    const idx = forms.findIndex((f: string) => f === '13F-HR')
    if (idx === -1) return empty
    const topHoldings = await fetchFilingHoldings(fund.cik, accessions[idx])
    return { ...fund, filingDate: dates[idx], topHoldings }
  } catch { return empty }
}

async function withConcurrency<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = []
  for (let i = 0; i < tasks.length; i += limit) {
    results.push(...await Promise.all(tasks.slice(i, i + limit).map(fn => fn())))
  }
  return results
}

export async function GET() {
  try {
    // Load all cached entries
    const cached = await prisma.hedgeFundCache.findMany()
    const cacheMap = new Map(cached.map(c => [c.cik, c]))

    const now = Date.now()
    const stale = (updatedAt: Date) => (now - updatedAt.getTime()) > CACHE_TTL_HOURS * 60 * 60 * 1000

    // Funds that need a fresh SEC fetch
    const toFetch = HEDGE_FUNDS.filter(f => {
      const c = cacheMap.get(f.cik)
      return !c || stale(c.updatedAt)
    })

    // Fetch stale/missing funds from SEC (max 3 at a time)
    if (toFetch.length > 0) {
      const fresh = await withConcurrency(toFetch.map(f => () => fetchFromSEC(f)), 3)
      // Upsert into DB cache
      await Promise.all(
        fresh.map(f =>
          prisma.hedgeFundCache.upsert({
            where: { cik: f.cik },
            update: { data: JSON.stringify(f), name: f.name },
            create: { cik: f.cik, name: f.name, data: JSON.stringify(f) },
          })
        )
      )
      // Refresh cache map
      for (const f of fresh) cacheMap.set(f.cik, { cik: f.cik, name: f.name, data: JSON.stringify(f), updatedAt: new Date() })
    }

    // Build response from cache
    const funds = HEDGE_FUNDS.map(f => {
      const c = cacheMap.get(f.cik)
      if (!c) return { ...f, filingDate: null, topHoldings: [] }
      try { return JSON.parse(c.data) } catch { return { ...f, filingDate: null, topHoldings: [] } }
    })

    return NextResponse.json({ funds })
  } catch (err) {
    console.error('Hedgefunds route error:', err)
    return NextResponse.json({ funds: [] })
  }
}
