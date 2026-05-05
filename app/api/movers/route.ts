import { NextResponse } from 'next/server'
import https from 'https'

export const dynamic = 'force-dynamic'

function httpGet(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      timeout: 8000,
    }, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch { reject(new Error('Invalid JSON')) } })
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')))
  })
}

async function getMovers(scrId: string) {
  try {
    const data = await httpGet(
      `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?count=5&scrIds=${scrId}`
    )
    const quotes: any[] = data?.finance?.result?.[0]?.quotes ?? []
    return quotes.map((q) => ({
      ticker: q.symbol ?? '',
      name: q.shortName ?? q.longName ?? q.symbol ?? '',
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
    }))
  } catch {
    return []
  }
}

export async function GET() {
  const [gainers, losers] = await Promise.all([
    getMovers('day_gainers'),
    getMovers('day_losers'),
  ])
  return NextResponse.json({ gainers, losers })
}
