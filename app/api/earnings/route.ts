export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

const SYMBOLS =
  'AAPL,MSFT,GOOGL,AMZN,META,NVDA,TSLA,JPM,JNJ,V,XOM,UNH,MA,HD,PG,ABBV,MRK,CVX,LLY,PEP,KO,AVGO,COST,MCD,WMT,BAC,DIS,ADBE,CRM,NFLX,CSCO,ABT,ACN,TMO,NKE,TXN,INTC,AMD,QCOM,PM,BMY,UPS,LIN,NEE,HON,GS,BLK,GE,CAT,IBM'

export async function GET() {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${SYMBOLS}&fields=earningsTimestampStart,earningsTimestampEnd,symbol,shortName`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AlphaDesk/1.0)',
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch earnings data' }, { status: 502 })
    }

    const data = await res.json()
    const quotes = data?.quoteResponse?.result ?? []

    const now = Date.now()
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

    const earnings = quotes
      .filter((q: { earningsTimestampStart?: number }) => {
        if (!q.earningsTimestampStart) return false
        const ts = q.earningsTimestampStart * 1000
        return ts >= now && ts <= now + thirtyDaysMs
      })
      .map((q: { symbol: string; shortName?: string; earningsTimestampStart: number }) => {
        const ts = q.earningsTimestampStart * 1000
        const daysUntil = Math.ceil((ts - now) / (24 * 60 * 60 * 1000))
        return {
          ticker: q.symbol,
          companyName: q.shortName ?? q.symbol,
          earningsDate: new Date(ts).toISOString(),
          daysUntil,
        }
      })
      .sort(
        (
          a: { daysUntil: number },
          b: { daysUntil: number }
        ) => a.daysUntil - b.daysUntil
      )

    return NextResponse.json(earnings)
  } catch (error) {
    console.error('Earnings fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
