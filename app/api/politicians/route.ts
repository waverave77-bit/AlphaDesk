import { NextResponse } from 'next/server'
import https from 'https'
export const dynamic = 'force-dynamic'

interface HouseTrade {
  disclosure_date: string
  transaction_date: string
  representative: string
  party: string
  state: string
  ticker: string
  asset_description: string
  type: string
  amount: string
}

interface SenateTrade {
  transaction_date: string
  first_name: string
  last_name: string
  party: string
  ticker: string
  asset_type: string
  type: string
  amount: string
  asset_description: string
}

interface NormalizedTrade {
  name: string
  chamber: 'House' | 'Senate'
  party: string
  ticker: string
  assetDescription: string
  type: string
  amount: string
  transactionDate: string
  disclosureDate: string
}

function fetchJSON<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'AlphaDesk contact@alphadesk.app' } }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data) as T)
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

export async function GET() {
  try {
    const [houseRaw, senateRaw] = await Promise.allSettled([
      fetchJSON<HouseTrade[]>('https://house-stock-watcher-data.s3-us-east-2.amazonaws.com/data/all_transactions.json'),
      fetchJSON<SenateTrade[]>('https://senate-stock-watcher-data.s3-us-east-2.amazonaws.com/aggregate/all_transactions.json'),
    ])

    const houseTrades: NormalizedTrade[] = houseRaw.status === 'fulfilled'
      ? (houseRaw.value ?? [])
          .filter((t) => t.ticker && t.ticker !== '--' && t.ticker.trim() !== '')
          .map((t) => ({
            name: t.representative,
            chamber: 'House' as const,
            party: t.party,
            ticker: t.ticker.trim().toUpperCase(),
            assetDescription: t.asset_description ?? '',
            type: t.type,
            amount: t.amount,
            transactionDate: t.transaction_date,
            disclosureDate: t.disclosure_date,
          }))
      : []

    const senateTrades: NormalizedTrade[] = senateRaw.status === 'fulfilled'
      ? (senateRaw.value ?? [])
          .filter((t) => t.ticker && t.ticker !== '--' && t.ticker.trim() !== '')
          .map((t) => ({
            name: `${t.first_name} ${t.last_name}`.trim(),
            chamber: 'Senate' as const,
            party: t.party,
            ticker: t.ticker.trim().toUpperCase(),
            assetDescription: t.asset_description ?? t.asset_type ?? '',
            type: t.type,
            amount: t.amount,
            transactionDate: t.transaction_date,
            disclosureDate: t.transaction_date,
          }))
      : []

    const allTrades = [...houseTrades, ...senateTrades]
      .sort((a, b) => {
        const da = new Date(a.transactionDate).getTime()
        const db = new Date(b.transactionDate).getTime()
        return isNaN(db) || isNaN(da) ? 0 : db - da
      })
      .slice(0, 60)

    return NextResponse.json({ trades: allTrades })
  } catch {
    return NextResponse.json({ trades: [] }, { status: 500 })
  }
}
