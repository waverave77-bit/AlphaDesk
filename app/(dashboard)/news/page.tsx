'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { GuestLock } from '@/components/GuestGate'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, Newspaper, TrendingUp, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/ThemeProvider'
import LastUpdated from '@/components/LastUpdated'
import Link from 'next/link'

interface NewsItem {
  title: string
  link: string
  publisher: string
  providerPublishTime: number
  ticker: string
}

interface FeedData {
  watchlistTickers: string[]
  watchlistNews: NewsItem[]
  marketNews: NewsItem[]
  fetchedAt: string
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() / 1000) - ts)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function NewsCard({ item, isDark }: { item: NewsItem; isDark: boolean }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border transition-all group',
        isDark
          ? 'bg-gray-900/60 border-gray-800 hover:border-gray-700 hover:bg-gray-800/60'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <Link
            href={`/research/${item.ticker}`}
            onClick={e => e.stopPropagation()}
            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600/15 border border-blue-500/25 text-blue-400 hover:bg-blue-600/25 transition-colors"
          >
            {item.ticker}
          </Link>
          <span className={cn('text-[10px]', isDark ? 'text-gray-500' : 'text-slate-400')}>
            {item.publisher}
          </span>
          <span className={cn('text-[10px] ml-auto', isDark ? 'text-gray-600' : 'text-slate-400')}>
            {timeAgo(item.providerPublishTime)}
          </span>
        </div>
        <p className={cn(
          'text-sm font-medium leading-snug group-hover:underline decoration-1 underline-offset-2',
          isDark ? 'text-gray-200' : 'text-slate-800'
        )}>
          {item.title}
        </p>
      </div>
      <ExternalLink className={cn('h-3.5 w-3.5 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity', isDark ? 'text-gray-500' : 'text-slate-400')} />
    </a>
  )
}

function NewsSkeletons() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-gray-800 space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-4 w-12 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  )
}

export default function NewsPage() {
  const { data: session, status } = useSession()
  const { themeId } = useTheme()
  const isDark = themeId !== 'white'
  const router = useRouter()

  const [feed, setFeed] = useState<FeedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>('all')

  async function loadFeed(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await fetch('/api/news/feed')
      const data = await res.json()
      setFeed(data)
      setLastUpdated(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadFeed() }, [])

  if (status === 'loading') return null
  if (!session) return <GuestLock feature="your News Feed" />

  const allTickers = feed?.watchlistTickers ?? []
  const allNews = [...(feed?.watchlistNews ?? []), ...(feed?.marketNews ?? [])]
    .sort((a, b) => b.providerPublishTime - a.providerPublishTime)

  const filtered = activeFilter === 'all'
    ? allNews
    : activeFilter === 'market'
    ? (feed?.marketNews ?? [])
    : allNews.filter(n => n.ticker === activeFilter)

  const hasWatchlist = allTickers.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>
            Your News Feed
          </h1>
          <p className={cn('text-sm mt-0.5', isDark ? 'text-gray-400' : 'text-slate-500')}>
            {hasWatchlist
              ? `Live news for your ${allTickers.length} watchlist stock${allTickers.length !== 1 ? 's' : ''} + markets`
              : 'Add stocks to your watchlist to see personalized news'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LastUpdated time={lastUpdated} />
          <button
            onClick={() => loadFeed(true)}
            disabled={refreshing}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
              isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100'
            )}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Empty watchlist nudge */}
      {!loading && !hasWatchlist && (
        <Card>
          <CardContent className="py-12 text-center">
            <Newspaper className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <p className={cn('font-semibold mb-1', isDark ? 'text-white' : 'text-slate-800')}>No watchlist yet</p>
            <p className={cn('text-sm mb-4', isDark ? 'text-gray-400' : 'text-slate-500')}>
              Add stocks to your watchlist and their news will show up here automatically.
            </p>
            <Link
              href="/watchlist"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
            >
              Go to Watchlist
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Filter pills */}
      {!loading && (allNews.length > 0) && (
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'All News' },
            ...allTickers.map(t => ({ key: t, label: t })),
            { key: 'market', label: '📈 Markets' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                activeFilter === key
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : isDark
                  ? 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Main feed */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-5 w-32 mb-3" />
            <NewsSkeletons />
          </div>
          <div>
            <Skeleton className="h-5 w-32 mb-3" />
            <NewsSkeletons />
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className={cn('text-sm', isDark ? 'text-gray-500' : 'text-slate-400')}>No news found for this filter.</p>
          </CardContent>
        </Card>
      ) : activeFilter === 'all' ? (
        // Two-column layout for "All" view
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Watchlist news */}
          {(feed?.watchlistNews?.length ?? 0) > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <h2 className={cn('text-sm font-bold uppercase tracking-wider', isDark ? 'text-gray-300' : 'text-slate-700')}>
                  Your Stocks
                </h2>
                <Badge variant="outline" className="text-[10px]">{feed?.watchlistNews?.length}</Badge>
              </div>
              <div className="space-y-2">
                {feed!.watchlistNews.map((item, i) => (
                  <NewsCard key={`wl-${i}`} item={item} isDark={isDark} />
                ))}
              </div>
            </div>
          )}

          {/* Market news */}
          {(feed?.marketNews?.length ?? 0) > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Newspaper className="h-4 w-4 text-purple-400" />
                <h2 className={cn('text-sm font-bold uppercase tracking-wider', isDark ? 'text-gray-300' : 'text-slate-700')}>
                  Market News
                </h2>
                <Badge variant="outline" className="text-[10px]">{feed?.marketNews?.length}</Badge>
              </div>
              <div className="space-y-2">
                {feed!.marketNews.map((item, i) => (
                  <NewsCard key={`mk-${i}`} item={item} isDark={isDark} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Filtered single-column view
        <div className="space-y-2">
          {filtered.map((item, i) => (
            <NewsCard key={i} item={item} isDark={isDark} />
          ))}
        </div>
      )}

      <p className={cn('text-xs text-center pb-4', isDark ? 'text-gray-600' : 'text-slate-400')}>
        News sourced from Yahoo Finance. For informational purposes only.
      </p>
    </div>
  )
}
