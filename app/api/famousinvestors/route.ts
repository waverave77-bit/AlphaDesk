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

async function getInvestorHoldings(investor: { name: string; cik: string }) {
  const empty = { ...investor, filingDate: null, topHoldings: [] }
  try {
    const padded = investor.cik.padStart(10, '0')

    // Step 1: Get submission metadata
    const sub = await secFetch(`https://data.sec.gov/submissions/CIK${padded}.json`)
    if (!sub) return empty
    const data = JSON.parse(sub)

    const forms: string[] = data.filings?.recent?.form ?? []
    const accessions: string[] = data.filings?.recent?.accessionNumber ?? []
    const dates: string[] = data.filings?.recent?.filingDate ?? []

    const idx = forms.findIndex((f: string) => f === '13F-HR')
    if (idx === -1) return empty

    const accNo = accessions[idx]
    const accNoDash = accNo.replace(/-/g, '')
    const filingDate = dates[idx]

    // Step 2: Use filing index JSON to locate the holdings XML
    const indexJson = await secFetch(
      `https://www.sec.gov/Archives/edgar/data/${investor.cik}/${accNoDash}/${accNo}-index.json`
    )
    if (!indexJson) return { ...investor, filingDate, topHoldings: [] }

    const indexData = JSON.parse(indexJson)
    const docs: { name: string; type: string }[] = indexData.directory?.item ?? []

    const xmlDoc = docs.find(
      d => d.name.endsWith('.xml') &&
        d.name !== 'primary_doc.xml' &&
        !d.name.includes('xsl') &&
        (d.type?.includes('13F') || d.name.includes('infotable') || d.name.includes('form13'))
    ) ?? docs.find(
      d => d.name.endsWith('.xml') && d.name !== 'primary_doc.xml' && !d.name.includes('xsl')
    )

    if (!xmlDoc) return { ...investor, filingDate, topHoldings: [] }

    // Step 3: Fetch and parse
    const xml = await secFetch(
      `https://www.sec.gov/Archives/edgar/data/${investor.cik}/${accNoDash}/${xmlDoc.name}`
    )
    if (!xml) return { ...investor, filingDate, topHoldings: [] }

    const topHoldings = parseXMLHoldings(xml)
    return { ...investor, filingDate, topHoldings }
  } catch {
    return empty
  }
}

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
  const tasks = INVESTORS.map(inv => () => getInvestorHoldings(inv))
  const investors = await withConcurrency(tasks, 3)

  return NextResponse.json({ investors }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  })
}
