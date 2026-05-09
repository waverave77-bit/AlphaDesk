import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

const BULLISH_WORDS = ['buy', 'calls', 'moon', 'bull', 'long', 'squeeze', 'undervalued', 'breakout', 'strong', 'rocket', 'upside', 'growth', 'bullish', 'green']
const BEARISH_WORDS = ['puts', 'short', 'sell', 'crash', 'bear', 'drop', 'overvalued', 'weak', 'dump', 'avoid', 'downside', 'bearish', 'red', 'falling']

function getSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
  const lower = text.toLowerCase()
  const b = BULLISH_WORDS.filter(w => lower.includes(w)).length
  const s = BEARISH_WORDS.filter(w => lower.includes(w)).length
  if (b > s) return 'bullish'
  if (s > b) return 'bearish'
  return 'neutral'
}

async function fetchSubreddit(url: string) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Zains Game/1.0' },
      next: { revalidate: 300 },
    })
    if (!r.ok) return []
    const data = await r.json()
    return data?.data?.children ?? []
  } catch {
    return []
  }
}

export async function GET(_req: Request, { params }: { params: { ticker: string } }) {
  const ticker = params.ticker.toUpperCase()

  const [general, wsb] = await Promise.all([
    fetchSubreddit(`https://www.reddit.com/search.json?q=${ticker}+stock&sort=new&limit=20&type=link`),
    fetchSubreddit(`https://www.reddit.com/r/wallstreetbets/search.json?q=${ticker}&sort=new&limit=15&restrict_sr=true`),
  ])

  const seen = new Set<string>()
  const posts: any[] = []

  for (const child of [...general, ...wsb]) {
    const p = child.data
    if (!p?.title || seen.has(p.title)) continue
    seen.add(p.title)
    const sentiment = getSentiment(p.title + ' ' + (p.selftext || ''))
    posts.push({
      title: p.title,
      url: `https://reddit.com${p.permalink}`,
      subreddit: p.subreddit,
      score: p.score ?? 0,
      created_utc: p.created_utc ?? 0,
      sentiment,
    })
  }

  posts.sort((a, b) => b.score - a.score)

  const bullishCount = posts.filter(p => p.sentiment === 'bullish').length
  const bearishCount = posts.filter(p => p.sentiment === 'bearish').length
  const neutralCount = posts.filter(p => p.sentiment === 'neutral').length

  let sentiment: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral'
  if (bullishCount > bearishCount + neutralCount * 0.3) sentiment = 'Bullish'
  else if (bearishCount > bullishCount + neutralCount * 0.3) sentiment = 'Bearish'

  return NextResponse.json({
    mentions: posts.length,
    bullishCount,
    bearishCount,
    neutralCount,
    sentiment,
    posts: posts.slice(0, 8),
  })
}
