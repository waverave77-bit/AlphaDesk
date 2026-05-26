'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Star, Trash2, Plus, RefreshCw, TrendingUp, TrendingDown, ExternalLink, Newspaper } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { GuestLock } from '@/components/GuestGate'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatPercent, gainLossColor, cn } from '@/lib/utils'
import InfoTooltip from '@/components/InfoTooltip'
import LastUpdated from '@/components/LastUpdated'

interface WatchlistItem {
  id: string
  ticker: string
  addedAt: string
}

interface WatchlistItemWithQuote extends WatchlistItem {
  price: number | null
  change: number | null
  changePercent: number | null
  companyName: string | null
  marketCap: number | null
  volume: number | null
}

interface NewsItem {
  title: string
  link: string
  publisher: string
  providerPublishTime: number
  ticker: string
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000 - ts)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ── News Tab ─────────────────────────────────────────────────────────────────
function WatchlistNews({ tickers }: { tickers: string[] }) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    fetch('/api/news/feed')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setNews(d.watchlistNews ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-3 mt-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-gray-800 space-y-2">
          <div className="flex gap-2"><Skeleton className="h-4 w-12 rounded-full" /><Skeleton className="h-4 w-24" /></div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  )

  if (tickers.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl scale-150" />
        <div className="relative rounded-full bg-gray-800/80 p-5 border border-gray-700/50">
          <Newspaper className="h-10 w-10 text-gray-500" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-gray-300 font-semibold">No stocks in your watchlist yet</p>
        <p className="text-sm text-gray-500">Add stocks to see their latest news here</p>
      </div>
    </div>
  )

  if (news.length === 0) return (
    <div className="text-center py-16">
      <p className="text-gray-500 text-sm">No news found for your watchlist stocks.</p>
    </div>
  )

  const filtered = activeFilter === 'all' ? news : news.filter(n => n.ticker === activeFilter)

  return (
    <div className="space-y-4 mt-4">
      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveFilter('all')}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-semibold border transition-all active:scale-95',
            activeFilter === 'all'
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
          )}
        >
          All ({news.length})
        </button>
        {tickers.map(t => {
          const count = news.filter(n => n.ticker === t).length
          if (count === 0) return null
          return (
            <button
              key={t}
              onClick={() => setActiveFilter(t)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold border transition-all active:scale-95',
                activeFilter === t
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
              )}
            >
              {t} ({count})
            </button>
          )
        })}
      </div>

      {/* Articles */}
      <div className="space-y-2">
        {filtered.map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-4 rounded-xl border border-gray-800 hover:border-gray-700 hover:bg-gray-800/50 transition-all group"
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
                <span className="text-[10px] text-gray-500">{item.publisher}</span>
                <span className="text-[10px] text-gray-600 ml-auto">{timeAgo(item.providerPublishTime)}</span>
              </div>
              <p className="text-sm font-medium text-gray-200 group-hover:text-blue-400 leading-snug transition-colors">
                {item.title}
              </p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-gray-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
          </a>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WatchlistPage() {
  const { data: session, status } = useSession()
  const [tab, setTab] = useState<'stocks' | 'news'>('stocks')
  const [items, setItems] = useState<WatchlistItemWithQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchWatchlist = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/watchlist')
      const data = await res.json()
      const rawItems: WatchlistItem[] = data.items || []

      const enriched = await Promise.all(
        rawItems.map(async (item) => {
          try {
            const qRes = await fetch(`/api/stock/${item.ticker}`)
            const qData = await qRes.json()
            const q = qData.quote
            return {
              ...item,
              price: q?.price ?? null,
              change: q?.change ?? null,
              changePercent: q?.changePercent ?? null,
              companyName: q?.companyName ?? null,
              marketCap: q?.marketCap ?? null,
              volume: q?.volume ?? null,
            }
          } catch {
            return { ...item, price: null, change: null, changePercent: null, companyName: null, marketCap: null, volume: null }
          }
        })
      )
      setItems(enriched)
    } finally {
      setLoading(false)
      setLastUpdated(new Date())
    }
  }, [])

  const refresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    await fetchWatchlist()
    setRefreshing(false)
  }

  useEffect(() => { fetchWatchlist() }, [fetchWatchlist])

  const removeFromWatchlist = async (ticker: string) => {
    setRemoving(ticker)
    try {
      await fetch('/api/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      })
      setItems((prev) => prev.filter((i) => i.ticker !== ticker))
      toast({ title: 'Removed', description: `${ticker} removed from watchlist` })
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setRemoving(null)
    }
  }

  // Guard placed after all hooks so React's rules of hooks are never violated
  if (status !== 'loading' && !session) return <GuestLock feature="your Watchlist" />

  const tickers = items.map(i => i.ticker)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Watchlist
            <InfoTooltip text="A personal list of stocks you want to watch. Add any stock to track its price without actually buying it." />
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Track stocks you&apos;re interested in</p>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated time={lastUpdated} className="text-slate-400" />
          {tab === 'stocks' && (
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={refreshing}
              className="active:scale-95 transition-transform"
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {(['stocks', 'news'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px capitalize flex items-center gap-2',
              tab === t
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            )}
          >
            {t === 'news' && <Newspaper className="h-3.5 w-3.5" />}
            {t === 'stocks' ? 'Stocks' : 'News'}
            {t === 'news' && items.length > 0 && (
              <span className="text-[10px] bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded-full font-bold">
                {items.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stocks Tab */}
      {tab === 'stocks' && (
        <>
          <p className="text-xs text-gray-600 -mt-4">Prices may be delayed up to 15 minutes. Not a reflection of real-time value.</p>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-4 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-16 rounded bg-gray-800/60" />
                      <div className="h-3 w-32 rounded bg-gray-800/60" />
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="space-y-2 text-right">
                        <div className="h-4 w-20 rounded bg-gray-800/60 ml-auto" />
                        <div className="h-3 w-14 rounded bg-gray-800/60 ml-auto" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-8 rounded-md bg-gray-800/60" />
                        <div className="h-8 w-8 rounded-md bg-gray-800/60" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-20 text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-yellow-500/10 blur-xl scale-150" />
                  <div className="relative rounded-full bg-gray-800/80 p-5 border border-gray-700/50">
                    <Star className="h-10 w-10 text-gray-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-300 font-semibold text-lg">Your watchlist is empty</p>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto">
                    Track stocks you&apos;re interested in — add any stock from its research page
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="mt-2 active:scale-95 transition-transform border-gray-700 hover:border-gray-500 hover:bg-gray-800/60"
                  asChild
                >
                  <Link href="/research">
                    <Plus className="h-4 w-4 mr-1" />
                    Discover Stocks
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const positive = (item.changePercent ?? 0) >= 0
                const isRemoving = removing === item.ticker
                return (
                  <Card
                    key={item.id}
                    className={cn(
                      'hover:border-gray-700 hover:bg-gray-800/30 transition-all cursor-default group',
                      isRemoving && 'opacity-50 scale-[0.99] pointer-events-none'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <Link href={`/research/${item.ticker}`} className="font-semibold text-white hover:text-blue-400 transition-colors">
                              {item.ticker}
                            </Link>
                            {item.companyName && (
                              <p className="text-xs text-gray-500 mt-0.5">{item.companyName}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-6">
                          <div className="text-right">
                            {item.price ? (
                              <>
                                <p className="text-white font-semibold flex items-center justify-end gap-1">
                                  {formatCurrency(item.price)}
                                  <InfoTooltip text="Current stock price. Updates when you refresh the page." />
                                </p>
                                <div className="flex items-center justify-end gap-1">
                                  {positive
                                    ? <TrendingUp className="h-3 w-3 text-green-400" />
                                    : <TrendingDown className="h-3 w-3 text-red-400" />
                                  }
                                  <span className={cn('text-xs', gainLossColor(item.changePercent ?? 0))}>
                                    <span className="hidden sm:inline">{item.change != null ? (item.change >= 0 ? '+' : '') + item.change.toFixed(2) : ''}{' '}</span>({formatPercent(item.changePercent ?? 0)})
                                  </span>
                                  <InfoTooltip text="How much the stock has moved today compared to yesterday's closing price." />
                                </div>
                              </>
                            ) : <Skeleton className="h-8 w-20" />}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 active:scale-95 transition-transform"
                              asChild
                            >
                              <Link href={`/research/${item.ticker}`}>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:text-red-400 hover:bg-red-400/10 active:scale-95 transition-all"
                              onClick={() => removeFromWatchlist(item.ticker)}
                              disabled={isRemoving}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* News Tab */}
      {tab === 'news' && <WatchlistNews tickers={tickers} />}

      <p className="text-xs text-gray-500 text-center mt-6 pb-4 px-4">
        Prices are sourced from third-party market data providers and may be delayed. For informational purposes only. Not financial advice.
      </p>
    </div>
  )
}
