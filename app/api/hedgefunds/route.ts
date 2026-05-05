import { NextResponse } from 'next/server'

const HEDGE_FUNDS = [
  { name: 'Bridgewater Associates', cik: 1350694 },
  { name: 'Renaissance Technologies', cik: 1037389 },
  { name: 'Citadel Advisors', cik: 1423689 },
  { name: 'Two Sigma Investments', cik: 1179392 },
  { name: 'AQR Capital Management', cik: 1336186 },
  { name: 'D.E. Shaw & Co.', cik: 1142922 },
  { name: 'Millennium Management', cik: 1273931 },
  { name: 'Point72 Asset Management', cik: 1603466 },
  { name: 'Tiger Global Management', cik: 1167483 },
  { name: 'Baupost Group', cik: 851143 },
]

function parseXMLHoldings(xml: string): { name: string; value: number; shares: number }[] {
  const holdings: { name: string; value: number; shares: number }[] = []
  // Handle both plain and namespaced tags (e.g. ns1:infoTable)
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

async function getFundHoldings(fund: { name: string; cik: number }) {
  const padded = String(fund.cik).padStart(10, '0')
  const headers = { 'User-Agent': 'AlphaDesk contact@alphadesk.app', Accept: 'application/json' }

  try {
    const subR = await fetch(`https://data.sec.gov/submissions/CIK${padded}.json`, { headers, next: { revalidate: 3600 } })
    if (!subR.ok) return { ...fund, filingDate: null, topHoldings: [] }
    const sub = await subR.json()

    const forms: string[] = sub.filings?.recent?.form ?? []
    const accessions: string[] = sub.filings?.recent?.accessionNumber ?? []
    const dates: string[] = sub.filings?.recent?.filingDate ?? []

    const idx = forms.findIndex((f: string) => f === '13F-HR')
    if (idx === -1) return { ...fund, filingDate: null, topHoldings: [] }

    const accNo = accessions[idx].replace(/-/g, '')
    const filingDate = dates[idx]

    const xmlUrl = `https://www.sec.gov/Archives/edgar/data/${fund.cik}/${accNo}/infotable.xml`
    const xmlR = await fetch(xmlUrl, { headers: { 'User-Agent': 'AlphaDesk contact@alphadesk.app' }, next: { revalidate: 86400 } })
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
