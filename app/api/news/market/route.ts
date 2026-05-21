import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface Article {
  title: string
  link: string
  pubDate: string
  source: string
}

const RSS_FEEDS = [
  { url: 'https://feeds.bloomberg.com/markets/news.rss', source: 'Bloomberg' },
  { url: 'https://feeds.reuters.com/reuters/businessNews', source: 'Reuters Business' },
  { url: 'https://feeds.reuters.com/reuters/technologyNews', source: 'Reuters Tech' },
  { url: 'https://feeds.marketwatch.com/marketwatch/topstories/', source: 'MarketWatch' },
  { url: 'https://finance.yahoo.com/rss/topfinstories', source: 'Financial News' },
]

function stripCdata(str: string): string {
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return match ? stripCdata(match[1]).trim() : ''
}

function parseRss(xml: string, source: string): Article[] {
  const re = /<item>([\s\S]*?)<\/item>/g
  const articles: Article[] = []
  let match: RegExpExecArray | null

  while ((match = re.exec(xml)) !== null) {
    const item = match[1]
    const title = extractTag(item, 'title')
    const link = extractTag(item, 'link') || extractTag(item, 'guid')
    const pubDate = extractTag(item, 'pubDate')

    if (title && link) {
      articles.push({ title, link, pubDate, source })
    }
  }

  return articles
}

async function fetchFeed(url: string, source: string): Promise<Article[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AlphaDesk/1.0)' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return []
  const xml = await res.text()
  return parseRss(xml, source)
}

function isSimilar(a: string, b: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return true
  // Check if one title starts with enough of the other (first 60 chars)
  const shorter = na.length < nb.length ? na : nb
  const longer = na.length < nb.length ? nb : na
  return shorter.length > 30 && longer.startsWith(shorter.slice(0, 60))
}

function deduplicateArticles(articles: Article[]): Article[] {
  const result: Article[] = []
  for (const article of articles) {
    const isDuplicate = result.some((r) => isSimilar(r.title, article.title))
    if (!isDuplicate) {
      result.push(article)
    }
  }
  return result
}

export async function GET() {
  const results = await Promise.allSettled(
    RSS_FEEDS.map((feed) => fetchFeed(feed.url, feed.source))
  )

  const allArticles: Article[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value)
    }
  }

  // Sort by pubDate descending
  allArticles.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0
    return db - da
  })

  const deduplicated = deduplicateArticles(allArticles)
  const articles = deduplicated.slice(0, 40)

  return NextResponse.json(
    { articles },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  )
}
