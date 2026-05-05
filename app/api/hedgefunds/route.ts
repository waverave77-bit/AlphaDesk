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
  { name: 'Tiger Global Management', cik: 1167483 },
  { name: 'Baupost Group', cik: 1061768 },
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

async function getHoldingsXmlFilename(cik: number, accNoDash: string): Promise<string | null> {
  try {
    const dirUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accNoDash}/`
    const r = await fetch(dirUrl, { headers: { 'User-Agent': HEADERS['User-Agent'] } })
    if (!r.ok) return null
    const html = await r.text()
    // Find XML files that are not the primary doc
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

async function getFundHoldings(fund: { name: string; cik: number }) {
  const padded = String(fund.cik).padStart(10, '0')

  try {
    const subR = await fetch(`https://data.sec.gov/submissions/CIK${padded}.json`, {
      headers: HEADERS,
      next: { revalidate: 3600 },
    })
    if (!subR.ok) return { ...fund, filingDate: null, topHoldings: [] }
    const sub = await subR.json()

    const forms: string[] = sub.filings?.recent?.form ?? []
    const accessions: string[] = sub.filings?.recent?.accessionNumber ?? []
    const dates: string[] = sub.filings?.recent?.filingDate ?? []

    const idx = forms.findIndex((f: string) => f === '13F-HR')
    if (idx === -1) return { ...fund, filingDate: null, topHoldings: [] }

    const accNoDash = accessions[idx].replace(/-/g, '')
    const filingDate = dates[idx]

    // Dynamically find the holdings XML filename
    const xmlFile = await getHoldingsXmlFilename(fund.cik, accNoDash)
    if (!xmlFile) return { ...fund, filingDate, topHoldings: [] }

    const xmlUrl = `https://www.sec.gov/Archives/edgar/data/${fund.cik}/${accNoDash}/${xmlFile}`
    const xmlR = await fetch(xmlUrl, {
      headers: { 'User-Agent': HEADERS['User-Agent'] },
      next: { revalidate: 3600 },
    })
    if (!xmlR.ok) return { ...fund, filingDate, topHoldings: [] }

    const xml = await xmlR.text()
    const topHoldings = parseXMLHoldings(xml)

    return { ...fund, filingDate, topHoldings }
  } catch {
    return { ...fund, filingDate: null, topHoldings: [] }
  }
}

export async function GET() {
  const funds = await Promise.all(HEDGE_FUNDS.map(getFundHoldings))
  return NextResponse.json({ funds })
}
