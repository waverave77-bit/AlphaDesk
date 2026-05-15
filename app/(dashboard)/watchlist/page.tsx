'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Star, Trash2, Plus, RefreshCw, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'
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

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItemWithQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const { toast } = useToast()

  const fetchWatchlist = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/watchlist')
      const data = await res.json()
      const rawItems: WatchlistItem[] = data.items || []

      // Enrich with live quotes
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
    setRefreshing(true)
    await fetchWatchlist()
    setRefreshing(false)
  }

  useEffect(() => { fetchWatchlist() }, [fetchWatchlist])

  const removeFromWatchlist = async (ticker: string) => {
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
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">Watchlist <InfoTooltip text="A personal list of stocks you want to watch. Add any stock to track its price without actually buying it." /></h1>
          <p className="text-sm text-gray-400 mt-0.5">Track stocks you&apos;re interested in</p>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated time={lastUpdated} className="text-slate-400" />
          <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Star className="h-12 w-12 text-gray-700 mb-3" />
            <p className="text-gray-400 font-medium">Your watchlist is empty</p>
            <p className="text-sm text-gray-600 mt-1">Search for stocks and click &quot;Add Watchlist&quot; on any stock page</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/research">
                <Plus className="h-4 w-4" />
                Discover Stocks
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const positive = (item.changePercent ?? 0) >= 0
            return (
              <Card key={item.id} className="hover:border-gray-700 transition-colors">
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

                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
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
                                {item.change ? (item.change >= 0 ? '+' : '') + item.change.toFixed(2) : ''}
                                {' '}({formatPercent(item.changePercent ?? 0)})
                              </span>
                              <InfoTooltip text="How much the stock has moved today compared to yesterday's closing price." />
                            </div>
                          </>
                        ) : <Skeleton className="h-8 w-20" />}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/research/${item.ticker}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-red-400 hover:bg-red-400/10"
                          onClick={() => removeFromWatchlist(item.ticker)}
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
    </div>
  )
}
