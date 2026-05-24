'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { GuestLock } from '@/components/GuestGate'
import ProLimitBanner from '@/components/ProLimitBanner'
import { ArrowLeft, Star, StarOff, TrendingUp, TrendingDown, Brain, ExternalLink, Newspaper } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import StockChart from '@/components/charts/StockChart'
import AnalystCard from '@/components/research/AnalystCard'
import RedditSentiment from '@/components/research/RedditSentiment'
import OptionsPanel from '@/components/research/OptionsPanel'
import SecFilings from '@/components/research/SecFilings'
import AddHoldingDialog from '@/components/portfolio/AddHoldingDialog'
import AIAnalysisPanel from '@/components/portfolio/AIAnalysisPanel'
import InfoTooltip from '@/components/InfoTooltip'
import LastUpdated from '@/components/LastUpdated'
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

interface EarningsPoint {
  date: string
  eps: number
}

interface NewsItem {
  title: string
  link: string
  publisher: string
  providerPublishTime: number
}

const TOOLTIPS: Record<string, string> = {
  'Market Cap': 'The total value of a company, share price × number of shares. Think of it as the company\'s price tag.',
  'P/E Ratio': 'Price-to-Earnings. How much investors pay per $1 of profit. A lower number can mean cheaper, but context matters.',
  'EPS (TTM)': 'How much profit the company made per share over the past year. Positive = making money.',
  'Dividend Yield': 'The percentage of the share price you receive as cash payments each year. Like getting rent from a property you own.',
  'Beta': 'How much this stock moves compared to the overall market. Above 1 means it moves more than average.',
  'Volume': 'How many shares were traded today. High volume = lots of interest. Low volume = quieter day.',
  '52-Week Range': 'The lowest and highest price the stock has hit over the past year.',
  'Previous Close': 'What the stock price was at the end of yesterday\'s trading session.',
  'Day High': 'The highest price the stock reached today.',
  'Day Low': 'The lowest price the stock hit today.',
}

// Stock-specific news section
function PersonalizedNewsSection({ ticker, stockNews }: { ticker: string; stockNews: { title: string; link: string; publisher: string; providerPublishTime: number }[] }) {
  function timeAgo(ts: number) {
    const diff = Math.floor(Date.now() / 1000 - ts)
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  if (stockNews.length === 0) return null

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-4 font-medium flex items-center gap-2">
          <Newspaper className="h-3.5 w-3.5" />
          Latest News · {ticker}
        </p>
        <div className="space-y-3">
          {stockNews.slice(0, 8).map((item, i) => (
            <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="flex gap-3 group">
              <div className="flex-shrink-0 w-1 rounded-full bg-gray-700 group-hover:bg-blue-500 transition-colors mt-1" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-200 group-hover:text-blue-400 transition-colors leading-snug">{item.title}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {item.publisher}{item.providerPublishTime ? ` · ${timeAgo(item.providerPublishTime)}` : ''}
                </p>
              </div>
              <ExternalLink className="h-3 w-3 text-gray-700 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Dividend info card — shown below analyst section for dividend-paying stocks
function DividendInfoCard({ ticker, price, dividendYield }: { ticker: string; price: number; dividendYield: number }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/dividends/ticker?symbol=${ticker}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [ticker])

  const annualDiv = data?.dividendRate ?? data?.trailingDividendRate
    ?? ((data?.dividendYield ?? data?.trailingDividendYield ?? dividendYield) * price)
  const quarterlyDiv = annualDiv > 0 ? annualDiv / 4 : null
  const yieldPct = (dividendYield * 100).toFixed(2)
  const payoutPct = data?.payoutRatio != null ? (data.payoutRatio * 100).toFixed(0) : null
  const fiveYrAvg = data?.fiveYearAvgYield != null ? data.fiveYearAvgYield.toFixed(2) : null

  if (loading) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs text-gray-500 uppercase tracking-wider">Dividend Info</CardTitle>
          {data?.isAristocrat && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-medium">
              👑 Dividend Aristocrat · 25+ yrs
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Top row: big yield + amounts */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{yieldPct}%</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Annual Yield</p>
          </div>
          <div className="bg-gray-800/40 rounded-xl p-3 text-center">
            <p className="text-lg font-semibold text-gray-200">{annualDiv > 0 ? `$${annualDiv.toFixed(2)}` : '—'}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Per Share / Year</p>
          </div>
          <div className="bg-gray-800/40 rounded-xl p-3 text-center">
            <p className="text-lg font-semibold text-gray-200">{quarterlyDiv ? `$${quarterlyDiv.toFixed(2)}` : '—'}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Per Share / Qtr</p>
          </div>
        </div>

        {/* Bottom row: dates + payout ratio */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Ex-Dividend Date</p>
            <p className="text-sm font-medium text-gray-200">{data?.exDividendDate ?? '—'}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">Must own before this date</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Payment Date</p>
            <p className="text-sm font-medium text-gray-200">{data?.paymentDate ?? '—'}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">Cash hits your account</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Payout Ratio</p>
            <p className="text-sm font-medium text-gray-200">{payoutPct ? `${payoutPct}%` : '—'}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">% of earnings paid out</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">5-Yr Avg Yield</p>
            <p className="text-sm font-medium text-gray-200">{fiveYrAvg ? `${fiveYrAvg}%` : '—'}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">Historical average</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  const tooltip = TOOLTIPS[label]
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <span className="flex items-center gap-1 text-xs text-gray-400">
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </span>
      <span className="text-xs font-medium text-gray-200">{value ?? '—'}</span>
    </div>
  )
}

export default function StockDetailPage() {
  const { ticker } = useParams<{ ticker: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()

  // Guests get 1 free research — track in localStorage
  const [guestBlocked, setGuestBlocked] = useState(false)
  useEffect(() => {
    if (status === 'loading') return
    if (session) return // logged in, no limit
    const key = 'mrg_guest_research_count'
    const count = parseInt(localStorage.getItem(key) || '0', 10)
    if (count >= 2) {
      setGuestBlocked(true)
    } else {
      localStorage.setItem(key, String(count + 1))
    }
  }, [session, status, ticker])

  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [analyst, setAnalyst] = useState<AnalystData | null>(null)
  const [earningsHistory, setEarningsHistory] = useState<EarningsPoint[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [limitReached, setLimitReached] = useState(false)
  const [watchlisted, setWatchlisted] = useState(false)
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    setLoading(true)
    setLimitReached(false)
    Promise.all([
      fetch(`/api/stock/${ticker}`).then(async (r) => {
        if (r.status === 429) { setLimitReached(true); return {} }
        return r.json()
      }),
      fetch(`/api/watchlist`).then((r) => r.json()),
    ]).then(([stockData, watchData]) => {
      setQuote(stockData.quote || null)
      setAnalyst(stockData.analyst || null)
      setEarningsHistory(stockData.earningsHistory || [])
      setNews(stockData.news || [])
      const isWatched = (watchData.items || []).some((i: any) => i.ticker === ticker.toUpperCase())
      setWatchlisted(isWatched)
    }).catch(console.error)
      .finally(() => { setLoading(false); setLastUpdated(new Date()) })
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

  if (guestBlocked) return <GuestLock feature="stock research" />

  if (limitReached) {
    return (
      <div className="space-y-4 py-8 max-w-xl mx-auto">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <ProLimitBanner feature="research" />
      </div>
    )
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

  const aiData = {
    ticker: quote.ticker,
    companyName: quote.companyName,
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    marketCap: quote.marketCap,
    peRatio: quote.peRatio,
    eps: quote.eps,
    beta: quote.beta,
    dividendYield: quote.dividendYield,
    week52High: quote.week52High,
    week52Low: quote.week52Low,
    sector: quote.sector,
    industry: quote.industry,
    recentNews: news.slice(0, 3).map(n => n.title),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-white">{quote.ticker}</h1>
            {quote.sector && <Badge variant="outline" className="text-xs">{quote.sector}</Badge>}
          </div>
          <p className="text-sm text-gray-400 truncate">{quote.companyName}</p>
        </div>
      </div>

      {/* Price Hero */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-white">{formatCurrency(quote.price)}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {pricePositive
                  ? <TrendingUp className="h-4 w-4 text-green-400 shrink-0" />
                  : <TrendingDown className="h-4 w-4 text-red-400 shrink-0" />
                }
                <span className={cn('text-sm sm:text-lg font-semibold', gainLossColor(quote.change))}>
                  {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)
                </span>
                <span className="text-xs text-gray-500">Today</span>
              </div>
              {quote.industry && <p className="text-xs text-gray-500 mt-1">{quote.industry}</p>}
              <LastUpdated time={lastUpdated} />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAI(!showAI)}
                className={showAI ? 'border-blue-600/40 text-blue-400' : ''}
              >
                <Brain className="h-4 w-4 text-blue-400" />
                <span className="hidden sm:inline">AI Analysis</span>
                <span className="sm:hidden">AI</span>
              </Button>
              <Button variant="outline" size="sm" onClick={toggleWatchlist} disabled={watchlistLoading}>
                {watchlisted
                  ? <><StarOff className="h-4 w-4 text-yellow-400" /><span className="hidden sm:inline">Remove</span></>
                  : <><Star className="h-4 w-4" /><span className="hidden sm:inline">Watchlist</span></>
                }
              </Button>
              <AddHoldingDialog onAdded={() => {}} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Panel */}
      {showAI && (
        <AIAnalysisPanel type="stock" data={aiData} label={`${quote.ticker}, ${quote.companyName}`} />
      )}

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-400">Price Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <StockChart
            ticker={quote.ticker}
            currentPrice={quote.price}
            previousClose={quote.previousClose}
            analystTarget={analyst?.targetMean ?? null}
            earningsHistory={earningsHistory}
            currentEps={quote.eps ?? null}
            sector={quote.sector ?? null}
          />
        </CardContent>
      </Card>

      {/* Analyst Card: Rating + Reason + Price Targets */}
      {analyst && (
        <AnalystCard
          analyst={analyst}
          currentPrice={quote.price}
          news={news}
          ticker={quote.ticker}
        />
      )}

      {/* Personalized News Feed — this stock first, then watchlist */}
      <PersonalizedNewsSection ticker={quote.ticker} stockNews={news} />

      {/* Dividend Info Card — shown for dividend-paying stocks */}
      {quote.dividendYield && quote.dividendYield > 0 && (
        <DividendInfoCard ticker={quote.ticker} price={quote.price} dividendYield={quote.dividendYield} />
      )}

      {/* Reddit Sentiment + Options — hidden for now, components preserved */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RedditSentiment ticker={quote.ticker} />
        <OptionsPanel ticker={quote.ticker} />
      </div> */}

      {/* SEC Filings — hidden for now, component preserved at components/research/SecFilings.tsx */}
      {/* <SecFilings ticker={quote.ticker} /> */}

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
            <CardTitle className="text-xs text-gray-500 uppercase tracking-wider">Key Numbers</CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <StatRow label="Market Cap" value={quote.marketCap ? '$' + formatLargeNumber(quote.marketCap) : '—'} />
            <StatRow label="P/E Ratio" value={quote.peRatio ? quote.peRatio.toFixed(2) : '—'} />
            <StatRow label="EPS (TTM)" value={quote.eps ? formatCurrency(quote.eps) : '—'} />
            <StatRow label="Beta" value={quote.beta ? quote.beta.toFixed(2) : '—'} />
            <div className="mt-3 pt-3 border-t border-gray-800/50">
              <p className="text-[10px] text-gray-600 leading-relaxed">
                <span className="text-gray-500">These numbers help you understand the stock's financial profile. Not financial advice.</span>
              </p>
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-1.5 text-xs text-gray-500 uppercase tracking-wider">
              52-Week Range
              <InfoTooltip text="The lowest and highest price this stock has hit in the last 52 weeks. Shows how much it can swing." />
            </CardTitle>
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
        For informational purposes only. Not financial advice. Data sourced from third-party market data providers and public regulatory filings.
      </p>
    </div>
  )
}
