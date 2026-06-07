import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 604800 // cache a week

/**
 * Same-origin company-logo proxy. Tries a real stock-logo source, then the
 * domain's favicon, and returns the image. 404 → the client shows a letter
 * badge. Keeps logos reliable regardless of any single provider going down.
 */
export async function GET(req: NextRequest, { params }: { params: { ticker: string } }) {
  const ticker = (params.ticker || '').toUpperCase().replace(/[^A-Z0-9.\-]/g, '')
  const domain = req.nextUrl.searchParams.get('domain')

  const sources = [
    `https://financialmodelingprep.com/image-stock/${ticker}.png`,
    domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128` : null,
    domain ? `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico` : null,
  ].filter(Boolean) as string[]

  for (const url of sources) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (!r.ok) continue
      const ct = r.headers.get('content-type') || ''
      if (!ct.startsWith('image/')) continue
      const buf = await r.arrayBuffer()
      if (buf.byteLength < 100) continue // skip empty/placeholder
      return new NextResponse(buf, {
        headers: { 'Content-Type': ct, 'Cache-Control': 'public, max-age=604800, s-maxage=604800, immutable' },
      })
    } catch { /* try next source */ }
  }
  return new NextResponse(null, { status: 404 })
}
