import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

async function getYahooCrumb(): Promise<{ cookie: string; crumb: string } | null> {
  try {
    const r1 = await fetch('https://fc.yahoo.com', { redirect: 'follow' })
    const rawCookies = r1.headers.getSetCookie?.() ?? []
    const cookie = rawCookies.map((c: string) => c.split(';')[0]).join('; ')
    const r2 = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: { Cookie: cookie, 'User-Agent': 'Mozilla/5.0' },
    })
    if (!r2.ok) return null
    const crumb = (await r2.text()).trim()
    return { cookie, crumb }
  } catch {
    return null
  }
}

export async function GET(_req: Request, { params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase()
  const empty = { error: true, putCallRatio: null, totalCallVolume: 0, totalPutVolume: 0, topCalls: [], topPuts: [], expirationDate: null }

  try {
    const session = await getYahooCrumb()
    if (!session) return NextResponse.json(empty)

    const { cookie, crumb } = session
    const url = `https://query1.finance.yahoo.com/v7/finance/options/${ticker}?crumb=${encodeURIComponent(crumb)}`
    const r = await fetch(url, { headers: { Cookie: cookie, 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } })
    if (!r.ok) return NextResponse.json(empty)

    const data = await r.json()
    const result = data?.optionChain?.result?.[0]
    if (!result) return NextResponse.json(empty)

    const options = result.options?.[0]
    if (!options) return NextResponse.json(empty)

    const mapContract = (c: any) => ({
      strike: c.strike,
      expiration: new Date(c.expiration * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      volume: c.volume ?? 0,
      openInterest: c.openInterest ?? 0,
      impliedVolatility: c.impliedVolatility ? (c.impliedVolatility * 100).toFixed(1) + '%' : '—',
      lastPrice: c.lastPrice ?? 0,
      inTheMoney: c.inTheMoney ?? false,
    })

    const calls = (options.calls ?? []).map(mapContract)
    const puts = (options.puts ?? []).map(mapContract)

    const totalCallVolume = calls.reduce((s: number, c: any) => s + c.volume, 0)
    const totalPutVolume = puts.reduce((s: number, p: any) => s + p.volume, 0)
    const putCallRatio = totalCallVolume > 0 ? (totalPutVolume / totalCallVolume) : null

    const topCalls = [...calls].sort((a: any, b: any) => b.volume - a.volume).slice(0, 5)
    const topPuts = [...puts].sort((a: any, b: any) => b.volume - a.volume).slice(0, 5)

    const expDate = options.expirationDate
      ? new Date(options.expirationDate * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : null

    return NextResponse.json({ error: false, putCallRatio, totalCallVolume, totalPutVolume, topCalls, topPuts, expirationDate: expDate })
  } catch {
    return NextResponse.json(empty)
  }
}
