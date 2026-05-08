export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

// Fetch the next 7 days from Nasdaq earnings calendar
async function fetchDay(dateStr: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://api.nasdaq.com/api/calendar/earnings?date=${dateStr}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
        },
        next: { revalidate: 3600 },
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data?.data?.rows ?? []
  } catch {
    return []
  }
}

export async function GET() {
  try {
    // Fetch earnings for next 14 days
    const dates: string[] = []
    for (let i = 0; i <= 13; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      // Skip weekends
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        dates.push(d.toISOString().split('T')[0])
      }
    }

    const results = await Promise.all(dates.map(async (date) => {
      const rows = await fetchDay(date)
      return rows.map((r: any) => ({
        ticker: r.symbol ?? '',
        companyName: r.name ?? r.symbol ?? '',
        earningsDate: date,
        time: r.time ?? '',
        epsForecast: r.epsForecast ?? '',
        marketCap: r.marketCap ?? '',
      }))
    }))

    const earnings = results.flat().filter(e => e.ticker)

    return NextResponse.json(earnings)
  } catch (error) {
    console.error('Earnings fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
