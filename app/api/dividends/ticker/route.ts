import { NextRequest, NextResponse } from 'next/server'
import { getYahooCrumb } from '@/lib/yahoo-finance'

export const dynamic = 'force-dynamic'

const ARISTOCRATS = new Set([
  'ABBV','ABT','ADM','ADP','AFL','ATO','BDX','BEN','CAH','CAT','CB','CHRW',
  'CINF','CL','CLX','CTAS','CVX','DOV','ECL','ED','EMR','FDS','FRT','GD',
  'GPC','GWW','HRL','IBM','ITW','JNJ','KMB','KO','LOW','MCD','MDT','MKC',
  'MMM','NDSN','NUE','O','PEP','PG','PH','PPG','ROP','ROST','SHW','SPGI',
  'SWK','SYY','TGT','TROW','WMT','XOM',
])

function toDateStr(raw: any): string | null {
  const ts = raw?.raw ?? raw
  if (typeof ts !== 'number' || ts <= 0) return null
  return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function fetchSummaryWithCrumb(ticker: string) {
  const { cookie, crumb } = await getYahooCrumb()
  const modules = 'summaryDetail,calendarEvents,defaultKeyStatistics'
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=${encodeURIComponent(modules)}&crumb=${encodeURIComponent(crumb)}`
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Cookie': cookie,
    },
    signal: AbortSignal.timeout(10000),
  })
  if (!r.ok) throw new Error(`Yahoo summary ${r.status}`)
  return r.json()
}

async function fetchSummaryNoCrumb(ticker: string) {
  const modules = 'summaryDetail%2CcalendarEvents%2CdefaultKeyStatistics'
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=${modules}`
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    signal: AbortSignal.timeout(10000),
  })
  if (!r.ok) throw new Error(`Yahoo summary no-crumb ${r.status}`)
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
  return meta ? {
    price: meta.regularMarketPrice as number,
    companyName: (meta.longName ?? meta.shortName ?? ticker) as string,
  } : null
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get('symbol')?.toUpperCase()
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  try {
    // Fetch price and summary in parallel — try crumb auth first, fall back
    const [priceRes, summaryRes] = await Promise.allSettled([
      fetchPrice(symbol),
      fetchSummaryWithCrumb(symbol).catch(() => fetchSummaryNoCrumb(symbol)),
    ])

    const priceData = priceRes.status === 'fulfilled' ? priceRes.value : null
    const summaryData = summaryRes.status === 'fulfilled' ? summaryRes.value : null
    const result = summaryData?.quoteSummary?.result?.[0] ?? {}
    const sd = result.summaryDetail ?? {}
    const cal = result.calendarEvents ?? {}

    const dividendRate: number | null = sd.dividendRate?.raw ?? null
    const dividendYield: number | null = sd.dividendYield?.raw ?? null
    const trailingDividendRate: number | null = sd.trailingAnnualDividendRate?.raw ?? null
    const trailingDividendYield: number | null = sd.trailingAnnualDividendYield?.raw ?? null
    const fiveYearAvgYield: number | null = sd.fiveYearAvgDividendYield?.raw ?? null
    const payoutRatio: number | null = sd.payoutRatio?.raw ?? null
    const exDividendDate: string | null = toDateStr(sd.exDividendDate) ?? toDateStr(cal.exDividendDate)
    const paymentDate: string | null = toDateStr(cal.dividendDate)

    // A stock pays a dividend if any of these fields are positive
    const paysDividend =
      (dividendRate ?? 0) > 0 ||
      (trailingDividendRate ?? 0) > 0 ||
      (dividendYield ?? 0) > 0 ||
      (trailingDividendYield ?? 0) > 0

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
      paysDividend,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
