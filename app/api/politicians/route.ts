import { NextResponse } from 'next/server'
import https from 'https'
export const dynamic = 'force-dynamic'

// Fetches recent SEC Form 4 insider trades (corporate executives/directors)
// Uses EDGAR full-text search + filing index + XML parsing

function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'AlphaDesk/1.0 contact@alphadesk.app', Accept: '*/*' },
      timeout: 8000,
    }, (res) => {
      let data = ''
      res.on('data', (c) => { data += c })
      res.on('end', () => resolve(data))
    }).on('error', reject).on('timeout', () => reject(new Error('timeout')))
  })
}

interface InsiderTrade {
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
}

async function parseForm4(adsh: string, ciks: string[]): Promise<InsiderTrade | null> {
  try {
    // issuer is typically the second CIK
    const issuerCik = (ciks[1] ?? ciks[0]).replace(/^0+/, '')
    const accNoDash = adsh.replace(/-/g, '')

    // Get directory listing to find the XML filename
    const dir = await httpGet(`https://www.sec.gov/Archives/edgar/data/${issuerCik}/${accNoDash}/`)
    const xmlMatch = dir.match(/href="\/Archives\/edgar\/data\/[^"]+\.xml"/)
    if (!xmlMatch) return null
    const xmlPath = xmlMatch[0].replace('href="', '').replace('"', '')

    const xml = await httpGet('https://www.sec.gov' + xmlPath)

    const ticker = xml.match(/<issuerTradingSymbol>(.*?)<\/issuerTradingSymbol>/)?.[1]?.trim() ?? ''
    const company = xml.match(/<issuerName>(.*?)<\/issuerName>/)?.[1]?.trim() ?? ''
    const ownerName = xml.match(/<rptOwnerName>(.*?)<\/rptOwnerName>/)?.[1]?.trim() ?? ''
    const title = xml.match(/<officerTitle>(.*?)<\/officerTitle>/)?.[1]?.trim() ?? 'Director'
    const transCode = xml.match(/<transactionCode>(.*?)<\/transactionCode>/i)?.[1]?.trim() ?? ''
    const shares = parseFloat(xml.match(/<transactionShares>[\s\S]*?<value>(.*?)<\/value>/)?.[1] ?? '0')
    const price = parseFloat(xml.match(/<transactionPricePerShare>[\s\S]*?<value>(.*?)<\/value>/)?.[1] ?? '0')
    const txDate = xml.match(/<transactionDate>[\s\S]*?<value>(.*?)<\/value>/)?.[1]?.trim() ?? ''

    if (!ticker || !company || !ownerName || shares === 0) return null

    // Filter: only show real purchases (P) and sales (S), skip awards/grants
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
      filingDate: adsh.split('-').slice(1).join('-').slice(0, 6),
    }
  } catch {
    return null
  }
}

export async function GET() {
  try {
    // Fetch recent Form 4 filings from EDGAR
    const searchUrl = 'https://efts.sec.gov/LATEST/search-index?q=&forms=4&dateRange=custom&startdt=2026-04-01&enddt=2026-05-07&_source=adsh,ciks,file_date,display_names'
    const raw = await httpGet(searchUrl)
    const results = JSON.parse(raw)
    const hits: any[] = results.hits?.hits?.slice(0, 40) ?? []

    // Parse Form 4s in parallel, limit concurrency
    const batch1 = hits.slice(0, 20)
    const batch2 = hits.slice(20, 40)

    const parse = (h: any) => parseForm4(h._source.adsh, h._source.ciks ?? [])

    const results1 = await Promise.allSettled(batch1.map(parse))
    const results2 = await Promise.allSettled(batch2.map(parse))

    const trades: InsiderTrade[] = [...results1, ...results2]
      .filter((r): r is PromiseFulfilledResult<InsiderTrade> => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value)
      .filter((t) => t !== null)
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, 30)

    return NextResponse.json({ trades })
  } catch (e: any) {
    return NextResponse.json({ trades: [], error: e.message }, { status: 500 })
  }
}
