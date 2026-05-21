import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase()

  try {
    const url = `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(ticker)}%22&forms=10-K%2C10-Q%2C8-K&dateRange=custom&startdt=2023-01-01`
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mr. Guy Invests contact@alphadesk.app', Accept: 'application/json' },
      next: { revalidate: 3600 },
    })

    if (!r.ok) return NextResponse.json({ filings: [] })
    const data = await r.json()
    const hits = data?.hits?.hits ?? []

    const filings = hits.slice(0, 8).map((hit: any) => {
      const src = hit._source ?? {}
      const accession = (hit._id ?? '').replace(/\//g, '-')
      const cik = src.entity_id ?? ''
      const url = cik && accession
        ? `https://www.sec.gov/Archives/edgar/data/${cik}/${accession.replace(/-/g, '')}/${accession}-index.htm`
        : `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${ticker}&type=${src.form_type}&dateb=&owner=include&count=10`

      return {
        formType: src.form_type ?? '—',
        filedDate: src.file_date ?? '—',
        entityName: src.entity_name ?? ticker,
        description: src.period_of_report ? `Period: ${src.period_of_report}` : '',
        url,
      }
    })

    return NextResponse.json({ filings })
  } catch {
    return NextResponse.json({ filings: [] })
  }
}
