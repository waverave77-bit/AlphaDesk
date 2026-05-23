import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Dividend Aristocrats — 25+ consecutive years of dividend increases
const ARISTOCRATS = new Set([
  'ABBV','ABT','ADM','ADP','AFL','ATO','BDX','BEN','CAH','CAT','CB','CHRW',
  'CINF','CL','CLX','CTAS','CVX','DOV','ECL','ED','EMR','FDS','FRT','GD',
  'GPC','GWW','HRL','IBM','ITW','JNJ','KMB','KO','LOW','MCD','MDT','MKC',
  'MMM','NDSN','NUE','O','PEP','PG','PH','PPG','ROP','ROST','SHW','SPGI',
  'SWK','SYY','TGT','TROW','WMT','XOM',
])

async function fetchSummary(ticker: string) {
  const modules = 'summaryDetail%2CassetProfile%2CdefaultKeyStatistics%2CcalendarEvents'
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=${modules}`
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    signal: AbortSignal.timeout(10000),
  })
  if (!r.ok) throw new Error(`Yahoo summary failed: ${r.status}`)
  return r.json()
}

async function fetchPrice(ticker: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(8000),
  })
  if (!r.ok) return null
  const d = await r.json()
  const meta = d?.chart?.result?.[0]?.meta
  return meta ? { price: meta.regularMarketPrice, companyName: meta.longName ?? meta.shortName ?? ticker } : null
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get('symbol')?.toUpperCase()
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  try {
    const [summaryRes, priceRes] = await Promise.allSettled([fetchSummary(symbol), fetchPrice(symbol)])

    const summaryData = summaryRes.status === 'fulfilled' ? summaryRes.value : null
    const priceData = priceRes.status === 'fulfilled' ? priceRes.value : null

    const result = summaryData?.quoteSummary?.result?.[0] ?? {}
    const sd = result.summaryDetail ?? {}
    const cal = result.calendarEvents ?? {}
    const ks = result.defaultKeyStatistics ?? {}

    const toDate = (raw: any): string | null => {
      if (!raw) return null
      const ts = raw?.raw ?? raw
      if (typeof ts !== 'number') return null
      return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const dividendRate: number | null = sd.dividendRate?.raw ?? null
    const dividendYield: number | null = sd.dividendYield?.raw ?? null
    const trailingDividendRate: number | null = sd.trailingAnnualDividendRate?.raw ?? null
    const trailingDividendYield: number | null = sd.trailingAnnualDividendYield?.raw ?? null
    const fiveYearAvgYield: number | null = sd.fiveYearAvgDividendYield?.raw ?? null
    const payoutRatio: number | null = sd.payoutRatio?.raw ?? null
    const exDividendDate: string | null = toDate(sd.exDividendDate) ?? toDate(cal.exDividendDate)
    const paymentDate: string | null = toDate(cal.dividendDate)
    // frequency: 1=annual,2=semi,4=quarterly,12=monthly
    const frequency: number | null = ks.lastDividendValue?.raw != null ? null : null

    return NextResponse.json({
      ticker: symbol,
      companyName: priceData?.companyName ?? symbol,
      price: priceData?.price ?? null,
      dividendRate,
      dividendYield,
      trailingDividendRate,
      trailingDividendYield,
      fiveYearAvgYield,
      payoutRatio,
      exDividendDate,
      paymentDate,
      isAristocrat: ARISTOCRATS.has(symbol),
      paysDividend: (dividendRate ?? 0) > 0 || (trailingDividendRate ?? 0) > 0,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
