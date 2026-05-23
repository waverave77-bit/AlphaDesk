import { NextResponse } from 'next/server'
import { getYahooCrumb } from '@/lib/yahoo-finance'

export const dynamic = 'force-dynamic'

// Well-known dividend payers — broad set so we always have something to show
const CALENDAR_TICKERS = [
  'AAPL','MSFT','JNJ','KO','PEP','MCD','T','VZ','XOM','CVX',
  'WMT','PG','HD','IBM','MRK','ABT','MMM','CAT','GD','TGT',
  'O','MO','PM','ABBV','AFL','ADP','EMR','ITW','DOV','SHW',
  'LOW','COST','CINF','TROW','GPC','CLX','CL','KMB','HRL','NUE',
  'JPM','BAC','WFC','USB','PNC','TFC','C','GS','MS','BLK',
]

async function fetchSummaryBatch(tickers: string[], cookie: string, crumb: string) {
  return Promise.allSettled(
    tickers.map(async ticker => {
      const modules = 'summaryDetail,calendarEvents'
      const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=${encodeURIComponent(modules)}&crumb=${encodeURIComponent(crumb)}`
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Cookie': cookie,
        },
        signal: AbortSignal.timeout(8000),
      })
      if (!r.ok) return null
      const data = await r.json()
      const result = data?.quoteSummary?.result?.[0] ?? {}
      const sd = result.summaryDetail ?? {}
      const cal = result.calendarEvents ?? {}

      // Try to get the most future-looking ex-date available
      const toDate = (raw: any): Date | null => {
        const ts = raw?.raw ?? raw
        if (typeof ts !== 'number' || ts <= 0) return null
        return new Date(ts * 1000)
      }

      // calendarEvents.exDividendDate tends to be more forward-looking than summaryDetail
      const exDate = toDate(cal.exDividendDate) ?? toDate(sd.exDividendDate)
      const payDate = toDate(cal.dividendDate)

      // Annual dividend rate ÷ 4 for quarterly estimate
      const annualRate = sd.dividendRate?.raw ?? sd.trailingAnnualDividendRate?.raw ?? null
      const dividendAmount = annualRate ? annualRate / 4 : null

      // Get company name from chart endpoint (lightweight)
      let companyName = ticker
      try {
        const chartR = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
          { headers: { 'User-Agent': 'Mozilla/5.0', 'Cookie': cookie }, signal: AbortSignal.timeout(5000) }
        )
        if (chartR.ok) {
          const chartData = await chartR.json()
          const meta = chartData?.chart?.result?.[0]?.meta
          companyName = meta?.longName ?? meta?.shortName ?? ticker
        }
      } catch {}

      return { ticker, companyName, exDate, payDate, dividendAmount }
    })
  )
}

export async function GET() {
  try {
    const now = new Date()
    // Show dates from 7 days ago through 90 days from now — wider window catches more
    const windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const windowEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    const { cookie, crumb } = await getYahooCrumb()

    const results: any[] = []
    const batchSize = 10

    for (let i = 0; i < CALENDAR_TICKERS.length; i += batchSize) {
      const batch = CALENDAR_TICKERS.slice(i, i + batchSize)
      const batchResults = await fetchSummaryBatch(batch, cookie, crumb)
      for (const r of batchResults) {
        if (r.status === 'fulfilled' && r.value) results.push(r.value)
      }
      if (i + batchSize < CALENDAR_TICKERS.length) {
        await new Promise(res => setTimeout(res, 150))
      }
    }

    const upcoming = results
      .filter(r => r.exDate && r.exDate >= windowStart && r.exDate <= windowEnd)
      .sort((a, b) => a.exDate.getTime() - b.exDate.getTime())
      .map(r => {
        const daysUntil = Math.ceil((r.exDate.getTime() - now.getTime()) / 86400000)
        const alreadyPassed = daysUntil < 0
        return {
          ticker: r.ticker,
          companyName: r.companyName,
          exDate: r.exDate.toISOString(),
          exDateFormatted: r.exDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          payDate: r.payDate?.toISOString() ?? null,
          payDateFormatted: r.payDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? null,
          dividendAmount: r.dividendAmount,
          daysUntilExDate: daysUntil,
          alreadyPassed,
        }
      })

    return NextResponse.json({ upcoming, fetchedAt: now.toISOString() })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
