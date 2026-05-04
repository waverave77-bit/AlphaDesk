'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Star, StarOff, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import StockChart from '@/components/charts/StockChart'
import AnalystCard from '@/components/research/AnalystCard'
import AddHoldingDialog from '@/components/portfolio/AddHoldingDialog'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatLargeNumber, gainLossColor, cn } from '@/lib/utils'

interface StockQuote {
  ticker: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number | null
  peRatio: number | null
  week52High: number | null
  week52Low: number | null
  dayHigh: number | null
  dayLow: number | null
  openPrice: number | null
  previousClose: number | null
  companyName: string
  sector: string | null
  industry: string | null
  beta: number | null
  eps: number | null
  dividendYield: number | null
}

interface AnalystData {
  recommendation: string | null
  recommendationLabel: string
  numberOfAnalysts: number | null
  targetLow: number | null
  targetMedian: number | null
  targetHigh: number | null
  targetMean: number | null
  buyCount: number
  holdCount: number
  sellCount: number
  strongBuyCount: number
  strongSellCount: number
}

interface NewsItem {
  title: string
  link: string
  publisher: string
  providerPublishTime: number
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xs font-medium text-gray-200">{value ?? '—'}</span>
    </div>
  )
}

export default function StockDetailPage() {
  const { ticker } = useParams<{ ticker: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [analyst, setAnalyst] = useState<AnalystData | null>(null)
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [watchlisted, setWatchlisted] = useState(false)
  const [watchlistLoading, setWatchlistLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/stock/${ticker}`).then((r) => r.json()),
      fetch(`/api/watchlist`).then((r) => r.json()),
    ]).then(([stockData, watchData]) => {
      setQuote(stockData.quote || null)
      setAnalyst(stockData.analyst || null)
      setNews(stockData.news || [])
      const isWatched = (watchData.items || []).some((i: any) => i.ticker === ticker.toUpperCase())
      setWatchlisted(isWatched)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [ticker])

  const toggleWatchlist = async () => {
    setWatchlistLoading(true)
    try {
      const method = watchlisted ? 'DELETE' : 'POST'
      await fetch('/api/watchlist', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: ticker.toUpperCase() }),
      })
      setWatchlisted(!watchlisted)
      toast({
        title: watchlisted ? 'Removed from watchlist' : 'Added to watchlist',
        description: `${ticker.toUpperCase()} ${watchlisted ? 'removed from' : 'added to'} your watchlist`,
      })
    } catch {
      toast({ title: 'Error', variant: 'destructive' })
    } finally {
      setWatchlistLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg">Stock &quot;{ticker}&quot; not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  const pricePositive = quote.change >= 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{quote.ticker}</h1>
            {quote.sector && <Badge variant="outline" className="text-xs">{quote.sector}</Badge>}
          </div>
          <p className="text-sm text-gray-400">{quote.companyName}</p>
        </div>
      </div>

      {/* Price Hero */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-bold text-white">{formatCurrency(quote.price)}</p>
              <div className="flex items-center gap-2 mt-1">
                {pricePositive
                  ? <TrendingUp className="h-4 w-4 text-green-400" />
                  : <TrendingDown className="h-4 w-4 text-red-400" />
                }
                <span className={cn('text-lg font-semibold', gainLossColor(quote.change))}>
                  {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)
                </span>
                <span className="text-xs text-gray-500">Today</span>
              </div>
              {quote.industry && <p className="text-xs text-gray-500 mt-1">{quote.industry}</p>}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={toggleWatchlist} disabled={watchlistLoading}>
                {watchlisted
                  ? <><StarOff className="h-4 w-4 text-yellow-400" /> Remove Watchlist</>
                  : <><Star className="h-4 w-4" /> Add Watchlist</>
                }
              </Button>
              <AddHoldingDialog onAdded={() => {}} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-400">Price Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <StockChart ticker={quote.ticker} currentPrice={quote.price} previousClose={quote.previousClose} />
        </CardContent>
      </Card>

      {/* Analyst Card: Rating + Reason + Price Targets + News */}
      {analyst && (
        <AnalystCard
          analyst={analyst}
          currentPrice={quote.price}
          news={news}
          ticker={quote.ticker}
        />
      )}

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-gray-500 uppercase tracking-wider">Trading Info</CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <StatRow label="Previous Close" value={quote.previousClose ? formatCurrency(quote.previousClose) : '—'} />
            <StatRow label="Day High" value={quote.dayHigh ? formatCurrency(quote.dayHigh) : '—'} />
            <StatRow label="Day Low" value={quote.dayLow ? formatCurrency(quote.dayLow) : '—'} />
            <StatRow label="Volume" value={formatLargeNumber(quote.volume)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-gray-500 uppercase tracking-wider">Fundamentals</CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <StatRow label="Market Cap" value={quote.marketCap ? '$' + formatLargeNumber(quote.marketCap) : '—'} />
            <StatRow label="P/E Ratio" value={quote.peRatio ? quote.peRatio.toFixed(2) : '—'} />
            <StatRow label="EPS (TTM)" value={quote.eps ? formatCurrency(quote.eps) : '—'} />
            <StatRow label="Dividend Yield" value={quote.dividendYield ? (quote.dividendYield * 100).toFixed(2) + '%' : '—'} />
            <StatRow label="Beta" value={quote.beta ? quote.beta.toFixed(2) : '—'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-gray-500 uppercase tracking-wider">52-Week Range</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {quote.week52Low && quote.week52High && (
              <>
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>{formatCurrency(quote.week52Low)}</span>
                  <span>{formatCurrency(quote.week52High)}</span>
                </div>
                <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
                    style={{ width: `${((quote.price - quote.week52Low) / (quote.week52High - quote.week52Low)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>52W Low</span>
                  <span className="text-white font-medium">{formatCurrency(quote.price)}</span>
                  <span>52W High</span>
                </div>
              </>
            )}
            <StatRow label="Sector" value={quote.sector ?? '—'} />
            <StatRow label="Industry" value={quote.industry ?? '—'} />
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-gray-600 text-center pb-4">
        For informational purposes only. Not financial advice. Data sourced from Yahoo Finance.
      </p>
    </div>
  )
}
