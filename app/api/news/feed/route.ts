import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStockNews } from '@/lib/yahoo-finance'

export const dynamic = 'force-dynamic'

// General market tickers always included as background context
const MARKET_TICKERS = ['SPY', 'QQQ', 'BTC-USD']

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get the user's watchlist
  const watchlistItems = await prisma.watchlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { addedAt: 'desc' },
  })

  const watchlistTickers = watchlistItems.map(i => i.ticker)

  // Combine watchlist + market tickers, deduplicate
  const allTickers = [...new Set([...watchlistTickers, ...MARKET_TICKERS])]

  // Fetch news for all tickers in parallel
  const results = await Promise.allSettled(
    allTickers.map(async ticker => {
      const news = await getStockNews(ticker)
      return news.map(n => ({ ...n, ticker }))
    })
  )

  // Flatten, dedupe by link, sort newest first
  const seen = new Set<string>()
  const allNews: { title: string; link: string; publisher: string; providerPublishTime: number; ticker: string }[] = []

  for (const r of results) {
    if (r.status === 'fulfilled') {
      for (const item of r.value) {
        if (item.link && !seen.has(item.link)) {
          seen.add(item.link)
          allNews.push(item)
        }
      }
    }
  }

  allNews.sort((a, b) => b.providerPublishTime - a.providerPublishTime)

  // Split into watchlist news vs market news
  const watchlistSet = new Set(watchlistTickers)
  const watchlistNews = allNews.filter(n => watchlistSet.has(n.ticker))
  const marketNews = allNews.filter(n => !watchlistSet.has(n.ticker))

  return NextResponse.json({
    watchlistTickers,
    watchlistNews,
    marketNews,
    fetchedAt: new Date().toISOString(),
  })
}
