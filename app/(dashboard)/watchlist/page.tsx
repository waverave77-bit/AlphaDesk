'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Star, Trash2, Plus, RefreshCw, TrendingUp, TrendingDown, ExternalLink, Newspaper } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { GuestLock } from '@/components/GuestGate'
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

const CARD = 'rounded-2xl border-2 border-[#16130a] shadow-[4px_4px_0_#16130a] dark:border-gray-700 dark:shadow-none bg-[#fff] dark:bg-gray-900'

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
        <div key={i} className={cn(CARD, 'p-4 space-y-2')}>
          <div className="flex gap-2"><Skeleton className="h-4 w-12 rounded-full" /><Skeleton className="h-4 w-24" /></div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  )

  if (tickers.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
      <div className={cn(CARD, 'p-5')}>
        <Newspaper className="h-10 w-10 text-[#16130a]/30 dark:text-gray-500" />
      </div>
      <div className="space-y-1">
        <p className="font-display uppercase text-[#16130a] dark:text-gray-300">No stocks in your watchlist yet</p>
        <p className="text-sm text-[#16130a]/60 dark:text-gray-500">Add stocks to see their latest news here</p>
      </div>
    </div>
  )

  if (news.length === 0) return (
    <div className="text-center py-16">
      <p className="text-[#16130a]/50 dark:text-gray-500 text-sm">No news found for your watchlist stocks.</p>
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
            'px-3 py-1.5 rounded-full text-xs font-mono font-bold border-2 transition-all',
            activeFilter === 'all'
              ? 'bg-[#16130a] border-[#16130a] text-[#fff] dark:bg-white dark:border-white dark:text-[#16130a]'
              : 'bg-[#fff] dark:bg-gray-800 border-[#16130a]/20 dark:border-gray-600 text-[#16130a]/60 dark:text-gray-400 hover:border-[#16130a] dark:hover:border-gray-400'
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
                'px-3 py-1.5 rounded-full text-xs font-mono font-bold border-2 transition-all',
                activeFilter === t
                  ? 'bg-[#16130a] border-[#16130a] text-[#fff] dark:bg-white dark:border-white dark:text-[#16130a]'
                  : 'bg-[#fff] dark:bg-gray-800 border-[#16130a]/20 dark:border-gray-600 text-[#16130a]/60 dark:text-gray-400 hover:border-[#16130a] dark:hover:border-gray-400'
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
            className={cn(CARD, 'flex items-start gap-3 p-4 hover:shadow-[2px_2px_0_#16130a] dark:hover:border-gray-600 transition-all group')}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Link
                  href={`/research/${item.ticker}`}
                  onClick={e => e.stopPropagation()}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2563eb]/10 border border-[#2563eb]/20 text-[#2563eb] dark:text-blue-400 hover:bg-[#2563eb]/20 transition-colors"
                >
                  {item.ticker}
                </Link>
                <span className="text-[10px] text-[#16130a]/50 dark:text-gray-500">{item.publisher}</span>
                <span className="text-[10px] text-[#16130a]/40 dark:text-gray-600 ml-auto">{timeAgo(item.providerPublishTime)}</span>
              </div>
              <p className="text-sm font-medium text-[#16130a] dark:text-gray-200 group-hover:text-[#2563eb] dark:group-hover:text-blue-400 leading-snug transition-colors">
                {item.title}
              </p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-[#16130a]/30 dark:text-gray-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
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

  if (status !== 'loading' && !session) return <GuestLock feature="your Watchlist" />

  const tickers = items.map(i => i.ticker)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-[#ffd23f] border-2 border-[#16130a] shadow-[3px_3px_0_#16130a] dark:border-gray-700 dark:shadow-none flex items-center justify-center shrink-0">
            <Star className="h-5 w-5 lg:h-6 lg:w-6 text-[#16130a]" />
          </div>
          <div>
            <h1 className="font-display uppercase text-2xl lg:text-3xl text-[#16130a] dark:text-white flex items-center gap-2">
              Watchlist
              <InfoTooltip text="A personal list of stocks you want to watch. Add any stock to track its price without actually buying it." />
            </h1>
            <p className="text-sm text-[#16130a]/60 dark:text-gray-400 mt-0.5">Track stocks you&apos;re interested in</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated time={lastUpdated} className="text-[#16130a]/40 dark:text-slate-400" />
          {tab === 'stocks' && (
            <button
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#16130a] dark:border-gray-600 bg-[#fff] dark:bg-gray-800 text-[#16130a] dark:text-white text-xs font-mono font-bold hover:shadow-[2px_2px_0_#16130a] dark:hover:border-gray-500 transition-all disabled:opacity-50"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Tabs — arcade segmented control */}
      <div className="flex gap-1 p-1 bg-[#16130a]/8 dark:bg-gray-800 rounded-full w-fit">
        {(['stocks', 'news'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-1.5 text-sm font-mono font-bold rounded-full transition-colors flex items-center gap-1.5',
              tab === t
                ? 'bg-[#16130a] text-[#fff] dark:bg-white dark:text-[#16130a]'
                : 'text-[#16130a]/55 dark:text-gray-400 hover:text-[#16130a] dark:hover:text-white'
            )}
          >
            {t === 'news' && <Newspaper className="h-3.5 w-3.5" />}
            {t === 'stocks' ? 'Stocks' : 'News'}
            {t === 'news' && items.length > 0 && (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                tab === 'news' ? 'bg-[#fff]/20 dark:bg-[#16130a]/20' : 'bg-[#16130a]/10 dark:bg-gray-700 text-[#16130a]/60 dark:text-gray-400'
              )}>
                {items.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stocks Tab */}
      {tab === 'stocks' && (
        <>
          <p className="font-mono text-xs text-[#16130a]/40 dark:text-gray-600 -mt-4">Prices may be delayed up to 15 minutes.</p>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={cn(CARD, 'p-4 animate-pulse')}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-16 rounded bg-[#16130a]/8 dark:bg-gray-800" />
                      <div className="h-3 w-32 rounded bg-[#16130a]/8 dark:bg-gray-800" />
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="space-y-2 text-right">
                        <div className="h-4 w-20 rounded bg-[#16130a]/8 dark:bg-gray-800 ml-auto" />
                        <div className="h-3 w-14 rounded bg-[#16130a]/8 dark:bg-gray-800 ml-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className={cn(CARD, 'flex flex-col items-center py-20 text-center space-y-4')}>
              <div className="rounded-xl bg-[#ffd23f] border-2 border-[#16130a] dark:border-gray-700 dark:bg-gray-800 p-5">
                <Star className="h-10 w-10 text-[#16130a] dark:text-gray-400" />
              </div>
              <div className="space-y-1">
                <p className="font-display uppercase text-lg text-[#16130a] dark:text-gray-300">Your watchlist is empty</p>
                <p className="text-sm text-[#16130a]/60 dark:text-gray-500 max-w-xs mx-auto">
                  Track stocks you&apos;re interested in — add any stock from its research page
                </p>
              </div>
              <Link
                href="/research"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-[#16130a] dark:border-gray-600 bg-[#16130a] dark:bg-gray-700 text-[#fff] text-sm font-mono font-bold hover:shadow-[3px_3px_0_#16130a] dark:hover:border-gray-500 transition-all mt-2"
              >
                <Plus className="h-4 w-4" />
                Discover Stocks
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const positive = (item.changePercent ?? 0) >= 0
                const isRemoving = removing === item.ticker
                return (
                  <div
                    key={item.id}
                    className={cn(
                      CARD,
                      'p-4 transition-all',
                      isRemoving && 'opacity-50 scale-[0.99] pointer-events-none'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <Link href={`/research/${item.ticker}`} className="font-display uppercase text-[#16130a] dark:text-white hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors">
                            {item.ticker}
                          </Link>
                          {item.companyName && (
                            <p className="text-xs text-[#16130a]/50 dark:text-gray-500 mt-0.5">{item.companyName}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-6">
                        <div className="text-right">
                          {item.price ? (
                            <>
                              <p className="font-mono font-bold text-[#16130a] dark:text-white flex items-center justify-end gap-1">
                                {formatCurrency(item.price)}
                                <InfoTooltip text="Current stock price. Updates when you refresh the page." />
                              </p>
                              <div className="flex items-center justify-end gap-1">
                                {positive
                                  ? <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                                  : <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                                }
                                <span className={cn('text-xs font-mono', gainLossColor(item.changePercent ?? 0))}>
                                  <span className="hidden sm:inline">{item.change != null ? (item.change >= 0 ? '+' : '') + item.change.toFixed(2) : ''}{' '}</span>({formatPercent(item.changePercent ?? 0)})
                                </span>
                                <InfoTooltip text="How much the stock has moved today compared to yesterday's closing price." />
                              </div>
                            </>
                          ) : <Skeleton className="h-8 w-20" />}
                        </div>

                        <div className="flex gap-1.5">
                          <Link
                            href={`/research/${item.ticker}`}
                            className="h-8 w-8 rounded-lg border-2 border-[#16130a]/20 dark:border-gray-700 flex items-center justify-center text-[#16130a]/50 dark:text-gray-400 hover:border-[#16130a] dark:hover:border-gray-500 hover:text-[#16130a] dark:hover:text-white transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            className="h-8 w-8 rounded-lg border-2 border-[#16130a]/20 dark:border-gray-700 flex items-center justify-center text-[#16130a]/50 dark:text-gray-400 hover:border-red-600 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-40"
                            onClick={() => removeFromWatchlist(item.ticker)}
                            disabled={isRemoving}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* News Tab */}
      {tab === 'news' && <WatchlistNews tickers={tickers} />}

      <p className="text-xs text-[#16130a]/40 dark:text-gray-500 text-center mt-6 pb-4 px-4">
        Prices are sourced from third-party market data providers and may be delayed. For informational purposes only. Not financial advice.
      </p>
    </div>
  )
}
