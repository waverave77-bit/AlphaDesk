import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

const HEDGE_FUNDS = [
  { name: 'Bridgewater Associates', cik: 1350694 },
  { name: 'Renaissance Technologies', cik: 1037389 },
  { name: 'Citadel Advisors', cik: 1423053 },
  { name: 'Two Sigma Investments', cik: 1179392 },
  { name: 'AQR Capital Management', cik: 1167557 },
  { name: 'D.E. Shaw & Co.', cik: 1009207 },
  { name: 'Viking Global Investors', cik: 1103804 },
  { name: 'Point72 Asset Management', cik: 1603466 },
]

const UA = 'Zains Game contact@zainsgame.app'

function parseXMLHoldings(xml: string): { name: string; value: number; shares: number }[] {
  const holdings: { name: string; value: number; shares: number }[] = []
  const infoTableRegex = /<(?:\w+:)?infoTable>([\s\S]*?)<\/(?:\w+:)?infoTable>/gi
  let match
  while ((match = infoTableRegex.exec(xml)) !== null) {
    const block = match[1]
    const name = block.match(/<(?:\w+:)?nameOfIssuer>(.*?)<\/(?:\w+:)?nameOfIssuer>/i)?.[1]?.trim() ?? ''
    const value = parseInt(block.match(/<(?:\w+:)?value>(.*?)<\/(?:\w+:)?value>/i)?.[1]?.trim() ?? '0', 10)
    const shares = parseInt(block.match(/<(?:\w+:)?sshPrnamt>(.*?)<\/(?:\w+:)?sshPrnamt>/i)?.[1]?.trim() ?? '0', 10)
    if (name) holdings.push({ name, value, shares })
  }
  return holdings.sort((a, b) => b.value - a.value).slice(0, 5)
}

async function secFetch(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: '*/*' },
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) return null
    return await r.text()
  } catch {
    return null
  }
}

async function getFundHoldings(fund: { name: string; cik: number }) {
  const empty = { ...fund, filingDate: null, topHoldings: [] }
  try {
    const padded = String(fund.cik).padStart(10, '0')

    // Step 1: Get submission metadata
    const sub = await secFetch(`https://data.sec.gov/submissions/CIK${padded}.json`)
    if (!sub) return empty
    const data = JSON.parse(sub)

    const forms: string[] = data.filings?.recent?.form ?? []
    const accessions: string[] = data.filings?.recent?.accessionNumber ?? []
    const dates: string[] = data.filings?.recent?.filingDate ?? []

    const idx = forms.findIndex((f: string) => f === '13F-HR')
    if (idx === -1) return empty

    const accNo = accessions[idx]           // e.g. 0001234567-26-000001
    const accNoDash = accNo.replace(/-/g, '') // e.g. 000123456726000001
    const filingDate = dates[idx]

    // Step 2: Use the filing index JSON to find the XML document
    const indexJson = await secFetch(
      `https://www.sec.gov/Archives/edgar/data/${fund.cik}/${accNoDash}/${accNo}-index.json`
    )
    if (!indexJson) return { ...fund, filingDate, topHoldings: [] }

    const indexData = JSON.parse(indexJson)
    const docs: { name: string; type: string }[] = indexData.directory?.item ?? []

    // Find the information table XML (not primary_doc.xml, not xsl)
    const xmlDoc = docs.find(
      d => d.name.endsWith('.xml') &&
        d.name !== 'primary_doc.xml' &&
        !d.name.includes('xsl') &&
        (d.type?.includes('13F') || d.name.includes('infotable') || d.name.includes('form13'))
    ) ?? docs.find(
      d => d.name.endsWith('.xml') && d.name !== 'primary_doc.xml' && !d.name.includes('xsl')
    )

    if (!xmlDoc) return { ...fund, filingDate, topHoldings: [] }

    // Step 3: Fetch and parse the holdings XML
    const xml = await secFetch(
      `https://www.sec.gov/Archives/edgar/data/${fund.cik}/${accNoDash}/${xmlDoc.name}`
    )
    if (!xml) return { ...fund, filingDate, topHoldings: [] }

    const topHoldings = parseXMLHoldings(xml)
    return { ...fund, filingDate, topHoldings }
  } catch {
    return empty
  }
}

// Process in small batches to avoid SEC rate limiting
async function withConcurrency<T>(items: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = []
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit)
    const batchResults = await Promise.all(batch.map(fn => fn()))
    results.push(...batchResults)
  }
  return results
}

export async function GET() {
  const tasks = HEDGE_FUNDS.map(fund => () => getFundHoldings(fund))
  const funds = await withConcurrency(tasks, 3)

  return NextResponse.json({ funds }, {
    headers: {
      // Cache for 1 hour — 13F data is filed quarterly, changes very rarely
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  })
}
