import { NextResponse } from 'next/server'
import { getYahooCrumb, getMultipleQuotes } from '@/lib/yahoo-finance'

export const dynamic = 'force-dynamic'

const ARISTOCRATS = new Set([
  'ABBV','ABT','ADM','ADP','AFL','ATO','BDX','BEN','CAH','CAT','CB','CHRW',
  'CINF','CL','CLX','CTAS','CVX','DOV','ECL','ED','EMR','FDS','FRT','GD',
  'GPC','GWW','HRL','IBM','ITW','JNJ','KMB','KO','LOW','MCD','MDT','MKC',
  'MMM','NDSN','NUE','O','PEP','PG','PH','PPG','ROP','ROST','SHW','SPGI',
  'SWK','SYY','TGT','TROW','WMT','XOM',
])

// Fallback list of well-known dividend payers
const FALLBACK = [
  'KO','PEP','JNJ','PG','T','VZ','XOM','CVX','MCD','WMT','HD','TGT','MO',
  'PM','BTI','O','MAIN','ABBV','IBM','MMM','CAT','GD','EMR','ITW','DOV',
  'SHW','PPG','LOW','COST','MRK','ABT','MDT','AFL','ADP','CTAS','CINF',
  'TROW','SYY','GPC','CLX','CL','KMB','HRL','MKC','NUE','ATO',
]

async function fetchScreener() {
  const { cookie, crumb } = await getYahooCrumb()
  const body = {
    offset: 0, size: 100,
    sortField: 'annualDividendYield', sortType: 'DESC',
    quoteType: 'EQUITY',
    topOperator: 'AND',
    query: {
      operator: 'AND',
      operands: [
        { operator: 'gt', operands: ['annualDividendYield', 0.015] },
        { operator: 'gt', operands: ['marketCap', 1_000_000_000] },
        { operator: 'gt', operands: ['averageDailyVolume3Month', 200_000] },
      ],
    },
  }
  const r = await fetch(
    `https://query1.finance.yahoo.com/v1/finance/screener?formatted=false&lang=en-US&region=US&crumb=${encodeURIComponent(crumb)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0', Cookie: cookie },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    }
  )
  if (!r.ok) return []
  const d = await r.json()
  return d?.finance?.result?.[0]?.quotes ?? []
}

export async function GET() {
  try {
    let quotes: any[] = []

    try {
      quotes = await fetchScreener()
    } catch {
      // fallback
    }

    if (quotes.length < 5) {
      // Use fallback tickers with getMultipleQuotes
      const map = await getMultipleQuotes(FALLBACK)
      quotes = Array.from(map.entries()).map(([sym, q]) => ({
        symbol: sym,
        shortName: q.companyName,
        regularMarketPrice: q.price,
        regularMarketChangePercent: q.changePercent,
        trailingAnnualDividendYield: q.dividendYield,
        trailingAnnualDividendRate: q.dividendYield ? q.price * q.dividendYield : null,
        marketCap: q.marketCap,
      }))
    }

    const results = quotes
      .filter((q: any) => {
        const y = q.trailingAnnualDividendYield ?? q.dividendYield ?? 0
        return y > 0.01
      })
      .slice(0, 40)
      .map((q: any) => {
        const yieldVal: number = q.trailingAnnualDividendYield ?? q.dividendYield ?? 0
        const annualDiv: number = q.trailingAnnualDividendRate ?? q.dividendRate ?? (q.regularMarketPrice * yieldVal)
        return {
          ticker: q.symbol,
          companyName: q.shortName ?? q.longName ?? q.symbol,
          price: q.regularMarketPrice ?? 0,
          changePercent: q.regularMarketChangePercent ?? 0,
          dividendYield: yieldVal,
          annualDividend: annualDiv,
          quarterlyDividend: annualDiv / 4,
          marketCap: q.marketCap ?? null,
          isAristocrat: ARISTOCRATS.has(q.symbol),
          yieldBucket: yieldVal >= 0.06 ? '6%+' : yieldVal >= 0.04 ? '4-6%' : '2-4%',
        }
      })
      .sort((a: any, b: any) => b.dividendYield - a.dividendYield)

    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
