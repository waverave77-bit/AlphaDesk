import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

const UA = 'Zains Game contact@zainsgame.app'

async function secFetch(url: string, timeout = 12000): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: '*/*' },
      signal: AbortSignal.timeout(timeout),
    })
    if (!r.ok) return null
    const text = await r.text()
    if (text.startsWith('<!') || text.startsWith('<html')) return null
    return text
  } catch {
    return null
  }
}

function parseHoldings(txt: string, limit = 20) {
  const holdings: { name: string; value: number; shares: number }[] = []
  const regex = /<(?:\w+:)?infoTable>([\s\S]*?)<\/(?:\w+:)?infoTable>/gi
  let match
  while ((match = regex.exec(txt)) !== null) {
    const block = match[1]
    const name = block.match(/<(?:\w+:)?nameOfIssuer>(.*?)<\/(?:\w+:)?nameOfIssuer>/i)?.[1]?.trim() ?? ''
    const value = parseInt(block.match(/<(?:\w+:)?value>(.*?)<\/(?:\w+:)?value>/i)?.[1]?.trim() ?? '0', 10)
    const shares = parseInt(block.match(/<(?:\w+:)?sshPrnamt>(.*?)<\/(?:\w+:)?sshPrnamt>/i)?.[1]?.trim() ?? '0', 10)
    if (name && value > 0) holdings.push({ name, value, shares })
  }
  return holdings.sort((a, b) => b.value - a.value).slice(0, limit)
}

/**
 * Fetch holdings for a specific accession number.
 * Strategy:
 *   1. Check the filing index JSON for a dedicated Information Table XML document
 *   2. Fall back to the full submission .txt
 */
async function fetchFilingHoldings(cik: string, accNo: string, limit = 20) {
  const accNoDash = accNo.replace(/-/g, '')
  const base = `https://www.sec.gov/Archives/edgar/data/${cik}/${accNoDash}`

  // Try to find the dedicated holdings XML from the filing index
  const indexText = await secFetch(`${base}/${accNo}-index.json`)
  if (indexText) {
    try {
      const index = JSON.parse(indexText)
      const items: { name: string; type?: string }[] = index.directory?.item ?? []

      const infoFile = items.find(item => {
        const t = (item.type ?? '').toLowerCase()
        const n = (item.name ?? '').toLowerCase()
        return (
          t.includes('information table') ||
          n.includes('informationtable') ||
          n.includes('infotable')
        )
      })
      const anyXml = items.find(item => {
        const n = (item.name ?? '').toLowerCase()
        const t = (item.type ?? '').toLowerCase()
        return (
          n.endsWith('.xml') &&
          !n.includes('primary') &&
          !t.includes('13f-hr') &&
          !t.includes('submission')
        )
      })
      const candidate = infoFile ?? anyXml
      if (candidate?.name) {
        const xmlText = await secFetch(`${base}/${candidate.name}`, 15000)
        if (xmlText) {
          const holdings = parseHoldings(xmlText, limit)
          if (holdings.length > 0) return holdings
        }
      }
    } catch { /* ignore */ }
  }

  // Fall back to full .txt
  const txt = await secFetch(`${base}/${accNo}.txt`, 15000)
  return txt ? parseHoldings(txt, limit) : []
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const cik = searchParams.get('cik')
  if (!cik) return NextResponse.json({ error: 'cik required' }, { status: 400 })

  const padded = cik.padStart(10, '0')

  const subText = await secFetch(`https://data.sec.gov/submissions/CIK${padded}.json`)
  if (!subText) return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 502 })

  const sub = JSON.parse(subText)
  const forms: string[] = sub.filings?.recent?.form ?? []
  const accessions: string[] = sub.filings?.recent?.accessionNumber ?? []
  const dates: string[] = sub.filings?.recent?.filingDate ?? []

  // Find the 2 most recent 13F-HR filings
  const indices: number[] = []
  for (let i = 0; i < forms.length && indices.length < 2; i++) {
    if (forms[i] === '13F-HR') indices.push(i)
  }

  if (indices.length === 0) return NextResponse.json({ error: 'No 13F found' }, { status: 404 })

  const [currentHoldings, prevHoldings] = await Promise.all([
    fetchFilingHoldings(cik, accessions[indices[0]], 20),
    indices[1] !== undefined ? fetchFilingHoldings(cik, accessions[indices[1]], 20) : Promise.resolve([]),
  ])

  const currentDate = dates[indices[0]] ?? null
  const prevDate = indices[1] !== undefined ? (dates[indices[1]] ?? null) : null

  // Compute QoQ changes
  const prevMap = new Map(prevHoldings.map(h => [h.name, h]))
  const currentMap = new Map(currentHoldings.map(h => [h.name, h]))

  const newPositions = currentHoldings.filter(h => !prevMap.has(h.name))
  const exits = prevHoldings.filter(h => !currentMap.has(h.name))
  const increased = currentHoldings.filter(h => { const p = prevMap.get(h.name); return p && h.value > p.value })
  const decreased = currentHoldings.filter(h => { const p = prevMap.get(h.name); return p && h.value < p.value })

  return NextResponse.json({
    currentHoldings,
    prevHoldings,
    currentDate,
    prevDate,
    qoq: {
      new: newPositions.length,
      exit: exits.length,
      increase: increased.length,
      decrease: decreased.length,
      newNames: newPositions.slice(0, 5).map(h => h.name),
      exitNames: exits.slice(0, 5).map(h => h.name),
    },
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
  })
}
