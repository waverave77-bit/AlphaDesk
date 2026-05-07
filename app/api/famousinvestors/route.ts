import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

const INVESTORS = [
  { name: 'Warren Buffett (Berkshire)', cik: '1067983' },
  { name: 'Bill Ackman (Pershing Square)', cik: '1336528' },
  { name: 'Michael Burry (Scion)', cik: '1649339' },
  { name: 'David Tepper (Appaloosa)', cik: '1656081' },
  { name: 'Stanley Druckenmiller (Duquesne)', cik: '1536411' },
  { name: 'George Soros (Soros Fund)', cik: '1029160' },
]

const HEADERS = { 'User-Agent': 'AlphaDesk contact@alphadesk.app', Accept: 'application/json' }

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
  return holdings.sort((a, b) => b.value - a.value).slice(0, 10)
}

async function getHoldingsXmlFilename(cik: string, accNoDash: string): Promise<string | null> {
  try {
    const dirUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accNoDash}/`
    const r = await fetch(dirUrl, { headers: { 'User-Agent': HEADERS['User-Agent'] } })
    if (!r.ok) return null
    const html = await r.text()
    const regex = /href="([^"]+\.xml)"/gi
    const matches: string[] = []
    let m: RegExpExecArray | null
    while ((m = regex.exec(html)) !== null) {
      const fname = m[1].split('/').pop() ?? ''
      if (fname && fname !== 'primary_doc.xml' && !fname.includes('xsl')) matches.push(fname)
    }
    return matches[0] ?? null
  } catch {
    return null
  }
}

async function getFundHoldings(investor: { name: string; cik: string }) {
  const padded = String(investor.cik).padStart(10, '0')

  try {
    const subR = await fetch(`https://data.sec.gov/submissions/CIK${padded}.json`, {
      headers: HEADERS,
      next: { revalidate: 3600 },
    })
    if (!subR.ok) return { ...investor, filingDate: null, topHoldings: [] }
    const sub = await subR.json()

    const forms: string[] = sub.filings?.recent?.form ?? []
    const accessions: string[] = sub.filings?.recent?.accessionNumber ?? []
    const dates: string[] = sub.filings?.recent?.filingDate ?? []

    const idx = forms.findIndex((f: string) => f === '13F-HR')
    if (idx === -1) return { ...investor, filingDate: null, topHoldings: [] }

    const accNoDash = accessions[idx].replace(/-/g, '')
    const filingDate = dates[idx]

    const xmlFile = await getHoldingsXmlFilename(investor.cik, accNoDash)
    if (!xmlFile) return { ...investor, filingDate, topHoldings: [] }

    const xmlUrl = `https://www.sec.gov/Archives/edgar/data/${investor.cik}/${accNoDash}/${xmlFile}`
    const xmlR = await fetch(xmlUrl, {
      headers: { 'User-Agent': HEADERS['User-Agent'] },
      next: { revalidate: 3600 },
    })
    if (!xmlR.ok) return { ...investor, filingDate, topHoldings: [] }

    const xml = await xmlR.text()
    const topHoldings = parseXMLHoldings(xml)

    return { ...investor, filingDate, topHoldings }
  } catch {
    return { ...investor, filingDate: null, topHoldings: [] }
  }
}

export async function GET() {
  const investors = await Promise.all(INVESTORS.map(getFundHoldings))
  return NextResponse.json({ investors })
}
