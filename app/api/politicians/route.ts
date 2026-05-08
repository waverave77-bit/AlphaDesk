import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

// Congressional stock trades from House Stock Watcher + Senate Stock Watcher
// Prioritises Trump-aligned politicians

const TRUMP_ALLIES = [
  'marjorie taylor greene', 'greene', 'matt gaetz', 'gaetz',
  'jim jordan', 'jordan', 'ted cruz', 'cruz', 'marco rubio', 'rubio',
  'tommy tuberville', 'tuberville', 'bill hagerty', 'hagerty',
  'rand paul', 'paul', 'mike johnson', 'johnson',
  'rick scott', 'scott', 'ron johnson', 'josh hawley', 'hawley',
  'kevin mccarthy', 'mccarthy', 'steve scalise', 'scalise',
  'elise stefanik', 'stefanik', 'byron donalds', 'donalds',
  'nancy mace', 'mace', 'lauren boebert', 'boebert',
  'chip roy', 'roy', 'dan crenshaw', 'crenshaw',
  'roger marshall', 'marshall', 'cynthia lummis', 'lummis',
  'pete sessions', 'sessions', 'john cornyn', 'cornyn',
]

function isAlly(name: string): boolean {
  const lower = name.toLowerCase()
  return TRUMP_ALLIES.some(a => lower.includes(a))
}

function normaliseType(t: string): string {
  const l = t.toLowerCase()
  if (l.includes('purchase') || l === 'buy') return 'Purchase'
  if (l.includes('sale') || l.includes('sell') || l === 'sold') return 'Sale'
  return t
}

function parseMidpoint(range: string): number {
  // e.g. "$1,001 - $15,000"
  const nums = range.replace(/[$,]/g, '').match(/[\d.]+/g)
  if (!nums) return 0
  if (nums.length === 1) return parseFloat(nums[0])
  return (parseFloat(nums[0]) + parseFloat(nums[1])) / 2
}

export async function GET() {
  try {
    const headers = { 'User-Agent': 'AlphaDesk/1.0 contact@alphadesk.app' }

    const [houseRes, senateRes] = await Promise.allSettled([
      fetch('https://housestockwatcher.com/api', { headers, next: { revalidate: 3600 } }),
      fetch('https://senatestockwatcher.com/api', { headers, next: { revalidate: 3600 } }),
    ])

    const houseTrades: any[] = houseRes.status === 'fulfilled' && houseRes.value.ok
      ? await houseRes.value.json().catch(() => [])
      : []

    const senateTrades: any[] = senateRes.status === 'fulfilled' && senateRes.value.ok
      ? await senateRes.value.json().catch(() => [])
      : []

    // Normalise house trades
    const house = houseTrades
      .filter((t: any) => t.ticker && t.ticker !== '--' && t.type && t.representative)
      .map((t: any) => ({
        name: t.representative ?? '',
        title: 'Representative',
        company: t.asset_description ?? t.ticker,
        ticker: (t.ticker ?? '').toUpperCase(),
        type: normaliseType(t.type),
        shares: 0,
        price: 0,
        totalValue: parseMidpoint(t.amount ?? ''),
        transactionDate: t.transaction_date ?? t.disclosure_date ?? '',
        filingDate: t.disclosure_date ?? '',
        chamber: 'House',
      }))

    // Normalise senate trades
    const senate = senateTrades
      .filter((t: any) => t.ticker && t.ticker !== '--' && t.type && t.senator)
      .map((t: any) => ({
        name: t.senator ?? '',
        title: 'Senator',
        company: t.asset_description ?? t.ticker,
        ticker: (t.ticker ?? '').toUpperCase(),
        type: normaliseType(t.type),
        shares: 0,
        price: 0,
        totalValue: parseMidpoint(t.amount ?? ''),
        transactionDate: t.transaction_date ?? t.disclosure_date ?? '',
        filingDate: t.disclosure_date ?? '',
        chamber: 'Senate',
      }))

    const all = [...house, ...senate]
      .filter(t => t.type === 'Purchase' || t.type === 'Sale')
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())

    // Separate allies from all members
    const alliesFirst = [
      ...all.filter(t => isAlly(t.name)),
      ...all.filter(t => !isAlly(t.name)),
    ]

    // Return top 20 so the frontend can split into 10 purchases + 10 sales
    const trades = alliesFirst.slice(0, 200)
      .filter((t, i, arr) => arr.findIndex(x => x.name === t.name && x.ticker === t.ticker && x.transactionDate === t.transactionDate) === i)
      .slice(0, 100)

    return NextResponse.json({ trades })
  } catch (e: any) {
    return NextResponse.json({ trades: [], error: e.message }, { status: 500 })
  }
}
