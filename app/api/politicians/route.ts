import { NextResponse } from 'next/server'
import https from 'https'
export const dynamic = 'force-dynamic'

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

async function parseForm4(adsh: string, ciks: string[]): Promise<Trade | null> {
  try {
    const issuerCik = (ciks[1] ?? ciks[0]).replace(/^0+/, '')
    const accNoDash = adsh.replace(/-/g, '')

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
      chamber: 'Executive',
    }
  } catch {
    return null
  }
}

export async function GET() {
  try {
    // Get today and 60 days ago for a wider window
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 60)
    const fmt = (d: Date) => d.toISOString().split('T')[0]

    const searchUrl = `https://efts.sec.gov/LATEST/search-index?q=&forms=4&dateRange=custom&startdt=${fmt(start)}&enddt=${fmt(end)}&_source=adsh,ciks,file_date,display_names`
    const raw = await httpGet(searchUrl)
    const results = JSON.parse(raw)
    const hits: any[] = results.hits?.hits?.slice(0, 80) ?? []

    // Parse in batches of 20 concurrently
    const parse = (h: any) => parseForm4(h._source.adsh, h._source.ciks ?? [])
    const chunks = [hits.slice(0, 20), hits.slice(20, 40), hits.slice(40, 60), hits.slice(60, 80)]
    const settled = (await Promise.all(chunks.map(chunk => Promise.allSettled(chunk.map(parse))))).flat()

    const trades: Trade[] = settled
      .filter((r): r is PromiseFulfilledResult<Trade> => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value)
      .filter(t => t !== null)
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())

    return NextResponse.json({ trades })
  } catch (e: any) {
    return NextResponse.json({ trades: [], error: e.message }, { status: 500 })
  }
}
