import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const CACHE_TTL_HOURS = 24
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
  } catch { return null }
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

async function fetchFilingHoldings(cik: string, accNo: string, limit = 20) {
  const accNoDash = accNo.replace(/-/g, '')
  const base = `https://www.sec.gov/Archives/edgar/data/${cik}/${accNoDash}`
  const indexText = await secFetch(`${base}/${accNo}-index.json`)
  if (indexText) {
    try {
      const index = JSON.parse(indexText)
      const items: { name: string; type?: string }[] = index.directory?.item ?? []
      const infoFile = items.find(item => {
        const t = (item.type ?? '').toLowerCase()
        const n = (item.name ?? '').toLowerCase()
        return t.includes('information table') || n.includes('informationtable') || n.includes('infotable')
      })
      const anyXml = items.find(item => {
        const n = (item.name ?? '').toLowerCase()
        const t = (item.type ?? '').toLowerCase()
        return n.endsWith('.xml') && !n.includes('primary') && !t.includes('13f-hr') && !t.includes('submission')
      })
      const candidate = infoFile ?? anyXml
      if (candidate?.name) {
        const xmlText = await secFetch(`${base}/${candidate.name}`, 15000)
        if (xmlText) {
          const holdings = parseHoldings(xmlText, limit)
          if (holdings.length > 0) return holdings
        }
      }
    } catch {}
  }
  const txt = await secFetch(`${base}/${accNo}.txt`, 15000)
  return txt ? parseHoldings(txt, limit) : []
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const cik = searchParams.get('cik')
  if (!cik) return NextResponse.json({ error: 'cik required' }, { status: 400 })

  const cacheKey = `detail_${cik}`

  // Check DB cache
  try {
    const cached = await prisma.hedgeFundCache.findUnique({ where: { cik: cacheKey } })
    if (cached) {
      const ageHours = (Date.now() - cached.updatedAt.getTime()) / (1000 * 60 * 60)
      if (ageHours < CACHE_TTL_HOURS) {
        return NextResponse.json(JSON.parse(cached.data))
      }
    }
  } catch {}

  // Fetch fresh from SEC
  try {
    const padded = cik.padStart(10, '0')
    const subText = await secFetch(`https://data.sec.gov/submissions/CIK${padded}.json`)
    if (!subText) return NextResponse.json({ error: 'Failed to fetch' }, { status: 502 })

    const sub = JSON.parse(subText)
    const forms: string[] = sub.filings?.recent?.form ?? []
    const accessions: string[] = sub.filings?.recent?.accessionNumber ?? []
    const dates: string[] = sub.filings?.recent?.filingDate ?? []

    const indices: number[] = []
    for (let i = 0; i < forms.length && indices.length < 2; i++) {
      if (forms[i] === '13F-HR') indices.push(i)
    }

    if (indices.length === 0) return NextResponse.json({ error: 'No 13F found' }, { status: 404 })

    const [currentHoldings, prevHoldings] = await Promise.all([
      fetchFilingHoldings(cik, accessions[indices[0]], 20),
      indices[1] !== undefined ? fetchFilingHoldings(cik, accessions[indices[1]], 20) : Promise.resolve([]),
    ])

    const prevMap = new Map(prevHoldings.map(h => [h.name, h]))
    const currentMap = new Map(currentHoldings.map(h => [h.name, h]))
    const newPositions = currentHoldings.filter(h => !prevMap.has(h.name))
    const exits = prevHoldings.filter(h => !currentMap.has(h.name))
    const increased = currentHoldings.filter(h => { const p = prevMap.get(h.name); return p && h.value > p.value })
    const decreased = currentHoldings.filter(h => { const p = prevMap.get(h.name); return p && h.value < p.value })

    const result = {
      currentHoldings,
      prevHoldings,
      currentDate: dates[indices[0]] ?? null,
      prevDate: indices[1] !== undefined ? (dates[indices[1]] ?? null) : null,
      qoq: {
        new: newPositions.length,
        exit: exits.length,
        increase: increased.length,
        decrease: decreased.length,
        newNames: newPositions.slice(0, 5).map(h => h.name),
        exitNames: exits.slice(0, 5).map(h => h.name),
      },
    }

    // Save to cache
    try {
      await prisma.hedgeFundCache.upsert({
        where: { cik: cacheKey },
        update: { data: JSON.stringify(result), name: `detail_${cik}` },
        create: { cik: cacheKey, name: `detail_${cik}`, data: JSON.stringify(result) },
      })
    } catch {}

    return NextResponse.json(result)
  } catch (err) {
    console.error('Detail error:', err)
    return NextResponse.json({ error: 'Failed to fetch detail' }, { status: 500 })
  }
}
