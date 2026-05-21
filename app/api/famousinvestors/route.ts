import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

const INVESTORS = [
  { name: 'Warren Buffett (Berkshire)', cik: '1067983' },
  { name: 'Bill Ackman (Pershing Square)', cik: '1336528' },
  { name: 'Michael Burry (Scion)', cik: '1649339' },
  { name: 'David Einhorn (Greenlight)', cik: '1079114' },
  { name: 'Stanley Druckenmiller (Duquesne)', cik: '1536411' },
  { name: 'George Soros (Soros Fund)', cik: '1029160' },
]

const UA = 'Mr. Guy Invests contact@mrguyinvests.com'

async function secFetch(url: string, timeout = 10000): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: '*/*' },
      signal: AbortSignal.timeout(timeout),
    })
    if (!r.ok) return null
    const text = await r.text()
    if (text.startsWith('<!') || text.startsWith('<html')) return null
    return text
  } catch {
    return null
  }
}

function parseHoldings(txt: string): { name: string; value: number; shares: number }[] {
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
  return holdings.sort((a, b) => b.value - a.value).slice(0, 5)
}

async function getInvestorHoldings(investor: { name: string; cik: string }) {
  const empty = { ...investor, filingDate: null, topHoldings: [] }
  try {
    const padded = investor.cik.padStart(10, '0')

    // Step 1: Get most recent 13F accession number
    const subText = await secFetch(`https://data.sec.gov/submissions/CIK${padded}.json`)
    if (!subText) return empty
    const sub = JSON.parse(subText)

    const forms: string[] = sub.filings?.recent?.form ?? []
    const accessions: string[] = sub.filings?.recent?.accessionNumber ?? []
    const dates: string[] = sub.filings?.recent?.filingDate ?? []

    const idx = forms.findIndex((f: string) => f === '13F-HR')
    if (idx === -1) return empty

    const accNo = accessions[idx]
    const accNoDash = accNo.replace(/-/g, '')
    const filingDate = dates[idx]

    // Step 2: Fetch the full submission .txt — predictable URL, contains all XML
    const txt = await secFetch(
      `https://www.sec.gov/Archives/edgar/data/${investor.cik}/${accNoDash}/${accNo}.txt`,
      12000
    )
    if (!txt) return { ...investor, filingDate, topHoldings: [] }

    const topHoldings = parseHoldings(txt)
    return { ...investor, filingDate, topHoldings }
  } catch {
    return empty
  }
}

async function withConcurrency<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = []
  for (let i = 0; i < tasks.length; i += limit) {
    const batch = tasks.slice(i, i + limit).map(fn => fn())
    results.push(...await Promise.all(batch))
  }
  return results
}

export async function GET() {
  const tasks = INVESTORS.map(inv => () => getInvestorHoldings(inv))
  const investors = await withConcurrency(tasks, 3)
  return NextResponse.json({ investors }, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
  })
}
