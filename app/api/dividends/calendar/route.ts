import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Curated list of reliable dividend-paying stocks for the calendar
const CALENDAR_TICKERS = [
  'AAPL','MSFT','JNJ','KO','PEP','MCD','T','VZ','XOM','CVX',
  'WMT','PG','HD','IBM','MRK','ABT','MMM','CAT','GD','TGT',
  'O','MO','PM','ABBV','AFL','ADP','EMR','ITW','DOV','SHW',
  'LOW','COST','CINF','TROW','GPC','CLX','CL','KMB','HRL','NUE',
]

async function fetchExDivDate(ticker: string): Promise<{ ticker: string; companyName: string; exDate: Date | null; payDate: Date | null; dividendAmount: number | null } | null> {
  try {
    const modules = 'summaryDetail%2CcalendarEvents'
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=${modules}`
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) return null
    const data = await r.json()
    const result = data?.quoteSummary?.result?.[0] ?? {}
    const sd = result.summaryDetail ?? {}
    const cal = result.calendarEvents ?? {}

    const toDate = (raw: any): Date | null => {
      const ts = raw?.raw ?? raw
      if (typeof ts !== 'number' || ts <= 0) return null
      return new Date(ts * 1000)
    }

    const exDate = toDate(sd.exDividendDate) ?? toDate(cal.exDividendDate)
    const payDate = toDate(cal.dividendDate)
    const dividendAmount = sd.dividendRate?.raw ? sd.dividendRate.raw / 4 : // quarterly
      (sd.trailingAnnualDividendRate?.raw ? sd.trailingAnnualDividendRate.raw / 4 : null)

    // Get company name from chart
    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
    const chartR = await fetch(chartUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) })
    let companyName = ticker
    if (chartR.ok) {
      const chartData = await chartR.json()
      const meta = chartData?.chart?.result?.[0]?.meta
      companyName = meta?.longName ?? meta?.shortName ?? ticker
    }

    return { ticker, companyName, exDate, payDate, dividendAmount }
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const now = new Date()
    const cutoff = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000) // 60 days out

    // Fetch in batches to avoid rate limiting
    const results: any[] = []
    const batchSize = 8
    for (let i = 0; i < CALENDAR_TICKERS.length; i += batchSize) {
      const batch = CALENDAR_TICKERS.slice(i, i + batchSize)
      const batchResults = await Promise.allSettled(batch.map(fetchExDivDate))
      for (const r of batchResults) {
        if (r.status === 'fulfilled' && r.value) results.push(r.value)
      }
      if (i + batchSize < CALENDAR_TICKERS.length) {
        await new Promise(res => setTimeout(res, 200))
      }
    }

    const upcoming = results
      .filter(r => r.exDate && r.exDate >= now && r.exDate <= cutoff)
      .sort((a, b) => a.exDate.getTime() - b.exDate.getTime())
      .map(r => ({
        ticker: r.ticker,
        companyName: r.companyName,
        exDate: r.exDate.toISOString(),
        exDateFormatted: r.exDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        payDate: r.payDate?.toISOString() ?? null,
        payDateFormatted: r.payDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? null,
        dividendAmount: r.dividendAmount,
        daysUntilExDate: Math.ceil((r.exDate.getTime() - now.getTime()) / 86400000),
      }))

    return NextResponse.json({ upcoming, fetchedAt: now.toISOString() })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
