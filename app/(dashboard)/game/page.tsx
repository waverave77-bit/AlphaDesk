'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  TrendingUp, TrendingDown, Trophy, Search, ArrowUpRight, ArrowDownRight,
  Clock, DollarSign, RefreshCw, X, Lock, Share2, Flame, LineChart,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import StockChart from '@/components/charts/StockChart'
import dynamic from 'next/dynamic'

// Lazy-load heavy game components
const TickerWall = dynamic(() => import('@/components/game/TickerWall'), { ssr: false })
const BeatMrGuy = dynamic(() => import('@/components/game/BeatMrGuy'), { ssr: false })
const AchievementBadges = dynamic(() => import('@/components/game/AchievementBadges'), { ssr: false })
const VsMarketCard = dynamic(() => import('@/components/game/VsMarketCard'), { ssr: false })

interface Holding { ticker: string; companyName: string; shares: number; avgCost: number; currentPrice: number; currentValue: number; gainLoss: number; gainLossPct: number }
interface Trade { id: string; ticker: string; shares: number; price: number; type: string; executedAt: string }
interface LeaderEntry { rank: number; name: string; totalValue: number; gainLoss: number; gainLossPct: number; isMe: boolean; isMrGuy?: boolean }
interface MrGuyPick { ticker: string; currentPrice: number; currentValue: number; gainLoss: number }

// Mr. Guy's season portfolio — 5 equal-weight positions, $20k each
const MR_GUY_PICKS = [
  { ticker: 'NVDA', shares: 22.86, costBasis: 875 },
  { ticker: 'AAPL', shares: 105.82, costBasis: 189 },
  { ticker: 'META', shares: 37.95, costBasis: 527 },
  { ticker: 'BRK-B', shares: 54.05, costBasis: 370 },
  { ticker: 'SPY', shares: 36.56, costBasis: 547 },
]
const MR_GUY_START = 100_000

const TABS = ['Portfolio', 'Trade', 'Leaderboard', 'History'] as const
type Tab = typeof TABS[number]

function gainColor(n: number) { return n >= 0 ? 'text-green-500' : 'text-red-500' }
function gainBg(n: number) { return n >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20' }

export default function GamePage() {
  const { data: session, status: sessionStatus } = useSession()
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('Portfolio')
  const [portfolio, setPortfolio] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [lbLoading, setLbLoading] = useState(false)
  const [expandedLbRow, setExpandedLbRow] = useState<string | null>(null)
  const [roast, setRoast] = useState<string | null>(null)
  const [roastLoading, setRoastLoading] = useState(false)

  // Portfolio history for mini chart
  const [historyPoints, setHistoryPoints] = useState<{ date: string; value: number }[]>([])

  // Mr. Guy's portfolio P&L (fetched for leaderboard injection)
  const [mrGuyPct, setMrGuyPct] = useState<number | null>(null)
  const [mrGuyValue, setMrGuyValue] = useState<number>(100000)
  const [mrGuyPickResults, setMrGuyPickResults] = useState<MrGuyPick[]>([])

  // Trade form
  const [tradeTicker, setTradeTicker] = useState('')
  const [tradeShares, setTradeShares] = useState('')
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY')
  const [tradeLoading, setTradeLoading] = useState(false)
  const [preview, setPreview] = useState<{ price: number; total: number; companyName: string } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ ticker: string; name: string }[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const fetchPortfolio = async () => {
    setLoading(true)
    const r = await fetch('/api/virtual')
    const d = await r.json()
    setPortfolio(d?.error ? null : d)
    setLoading(false)
  }

  const fetchLeaderboard = async () => {
    setLbLoading(true)
    const r = await fetch('/api/virtual/leaderboard')
    const d = await r.json()
    setLeaderboard(d.board || [])
    setLbLoading(false)
  }

  const fetchHistory = async () => {
    try {
      const r = await fetch('/api/virtual/history')
      const d = await r.json()
      setHistoryPoints(d.points || [])
    } catch { }
  }

  // Wait for session to resolve before fetching — avoids NaN for guests
  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (sessionStatus === 'unauthenticated') { setLoading(false); return }
    fetchPortfolio()
    fetchHistory()
  }, [sessionStatus])

  // Fetch Mr. Guy's live prices for leaderboard injection
  useEffect(() => {
    const fetchMrGuyPrices = async () => {
      const results = await Promise.allSettled(
        MR_GUY_PICKS.map(p => fetch(`/api/stock/${p.ticker}`).then(r => r.json()))
      )
      let totalValue = 0
      const enriched: MrGuyPick[] = MR_GUY_PICKS.map((p, i) => {
        const res = results[i]
        const price = res.status === 'fulfilled' && res.value?.quote?.price
          ? res.value.quote.price
          : p.costBasis
        const currentValue = price * p.shares
        totalValue += currentValue
        return { ticker: p.ticker, currentPrice: price, currentValue, gainLoss: currentValue - p.costBasis * p.shares }
      })
      setMrGuyPickResults(enriched)
      setMrGuyValue(totalValue)
      setMrGuyPct(((totalValue - MR_GUY_START) / MR_GUY_START) * 100)
    }
    fetchMrGuyPrices()
  }, [])

  useEffect(() => { if (tab === 'Leaderboard') fetchLeaderboard() }, [tab])

  // Search debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const r = await fetch(`/api/stock/search?q=${encodeURIComponent(searchQuery)}`)
        const d = await r.json()
        setSearchResults((d.results || []).slice(0, 6))
      } catch { setSearchResults([]) }
      setSearchLoading(false)
    }, 350)
    return () => clearTimeout(t)
  }, [searchQuery])

  const selectStock = (ticker: string, name: string) => {
    setTradeTicker(ticker)
    setSearchQuery('')
    setSearchResults([])
    setShowSearch(false)
  }

  // Live price preview
  useEffect(() => {
    if (!tradeTicker || tradeTicker.length < 1) { setPreview(null); return }
    const t = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const r = await fetch(`/api/stock/${tradeTicker.toUpperCase()}`)
        const d = await r.json()
        if (d?.quote?.price) {
          setPreview({ price: d.quote.price, total: d.quote.price * (parseFloat(tradeShares) || 1), companyName: d.quote.companyName })
        } else setPreview(null)
      } catch { setPreview(null) }
      setPreviewLoading(false)
    }, 600)
    return () => clearTimeout(t)
  }, [tradeTicker])

  useEffect(() => {
    if (preview) setPreview(p => p ? { ...p, total: p.price * (parseFloat(tradeShares) || 1) } : null)
  }, [tradeShares])

  const executeTrade = async () => {
    if (!tradeTicker || !tradeShares) return
    setTradeLoading(true)
    try {
      const r = await fetch('/api/virtual/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: tradeTicker.toUpperCase(), shares: parseFloat(tradeShares), type: tradeType }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast({ title: `${tradeType} executed!`, description: `${tradeShares} shares of ${tradeTicker.toUpperCase()} @ ${formatCurrency(d.price)}` })
      setTradeTicker(''); setTradeShares(''); setPreview(null)
      await fetchPortfolio()
      await fetchHistory()
      setTab('Portfolio')
    } catch (e: any) {
      toast({ title: 'Trade failed', description: e.message, variant: 'destructive' })
    }
    setTradeLoading(false)
  }

  const getRoasted = async () => {
    if (!portfolio?.holdings?.length) return
    setRoastLoading(true)
    setRoast(null)
    try {
      const r = await fetch('/api/virtual/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holdings: portfolio.holdings,
          totalGainLoss: portfolio.totalGainLoss,
          totalGainLossPct: portfolio.totalGainLossPct,
        }),
      })
      const d = await r.json()
      setRoast(d.roast ?? 'Mr. Guy has nothing to say. That might be worse.')
    } catch {
      setRoast('Mr. Guy tried to roast you but something went wrong. Try again.')
    }
    setRoastLoading(false)
  }

  const shareRank = (entry: LeaderEntry) => {
    const text = `I'm ranked #${entry.rank} on Mr. Guy Invests $100K Challenge with ${entry.gainLossPct >= 0 ? '+' : ''}${entry.gainLossPct.toFixed(2)}% return! 🏆 mrguyinvests.com`
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: 'Copied to clipboard!', description: 'Share your rank with friends.' })
    }).catch(() => {
      toast({ title: 'Could not copy', description: text, variant: 'destructive' })
    })
  }

  const daysLeft = portfolio?.resetAt ? Math.max(0, Math.ceil((new Date(portfolio.resetAt).getTime() - Date.now()) / 86400000)) : 30

  // Simple SVG sparkline for portfolio history
  const renderSparkline = () => {
    if (historyPoints.length < 2) {
      return (
        <div className="flex items-center justify-center h-full text-center px-4">
          <div>
            <LineChart className="h-8 w-8 text-gray-700 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Chart will appear as you trade and your value changes over time</p>
          </div>
        </div>
      )
    }
    const values = historyPoints.map(p => p.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const W = 300, H = 60
    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1)) * W
      const y = H - ((v - min) / range) * H
      return `${x},${y}`
    }).join(' ')
    const isUp = values[values.length - 1] >= values[0]
    const color = isUp ? '#22c55e' : '#ef4444'
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <div className="space-y-5">
      {/* Ticker Wall Hero */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-3">
          <Trophy className="h-6 w-6 text-yellow-400" />
          $100K Challenge
        </h1>
        <TickerWall />
        <p className="text-xs text-gray-600 mt-1 text-center">Live market data · 27 tickers</p>
      </div>

      {/* Stats bar — always visible; guests see locked placeholders */}
      {loading && session ? <Skeleton className="h-24 w-full" /> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: 'Portfolio Value',
              value: session && portfolio ? formatCurrency(portfolio.totalValue) : '$100,000.00',
              sub: session && portfolio ? `${portfolio.totalGainLossPct >= 0 ? '+' : ''}${portfolio.totalGainLossPct?.toFixed(2)}%` : 'Your starting balance',
              color: session && portfolio ? gainColor(portfolio.totalGainLoss) : 'text-gray-400',
            },
            {
              label: 'Cash Available',
              value: session && portfolio ? formatCurrency(portfolio.cash) : '——',
              sub: session && portfolio ? `${((portfolio.cash / 100000) * 100).toFixed(1)}% of capital` : 'Sign up to trade',
              color: session && portfolio ? 'text-blue-400' : 'text-gray-600',
            },
            {
              label: 'Total P&L',
              value: session && portfolio ? `${portfolio.totalGainLoss >= 0 ? '+' : ''}${formatCurrency(portfolio.totalGainLoss)}` : '——',
              sub: session && portfolio ? 'vs $100,000 start' : 'Sign up to track',
              color: session && portfolio ? gainColor(portfolio.totalGainLoss) : 'text-gray-600',
            },
            {
              label: 'Season Resets',
              value: session && portfolio ? `${daysLeft} days` : `${daysLeft} days`,
              sub: session && portfolio ? `Season ${portfolio.season}` : 'Current season',
              color: 'text-yellow-400',
            },
          ].map(({ label, value, sub, color }) => (
            <Card key={label} className={cn(!session && label !== 'Season Resets' && label !== 'Portfolio Value' ? 'opacity-60' : '')}>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={cn('text-lg font-bold', color)}>{value}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Portfolio sparkline + vs market (only for logged-in users with portfolio) */}
      {session && portfolio && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Mini portfolio chart */}
          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-semibold text-gray-400 flex items-center gap-2">
                <LineChart className="h-3.5 w-3.5" /> Portfolio Value Over Time
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="h-16">
                {renderSparkline()}
              </div>
              {historyPoints.length >= 2 && (
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>{historyPoints[0].date}</span>
                  <span>{historyPoints[historyPoints.length - 1].date}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* vs S&P 500 */}
          <VsMarketCard userGainLossPct={portfolio.totalGainLossPct ?? null} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              tab === t ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300')}>
            {t}
          </button>
        ))}
      </div>

      {/* Portfolio Tab */}
      {tab === 'Portfolio' && (
        <div className="space-y-4">
          {!session ? (
            <Card>
              <CardContent className="p-10 text-center">
                <DollarSign className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                <p className="text-white font-semibold">Sign up to get your $100,000</p>
                <p className="text-gray-500 text-sm mt-1">Create a free account to start trading and appear on the leaderboard.</p>
                <div className="flex gap-3 justify-center mt-4">
                  <Button asChild className="bg-blue-600 hover:bg-blue-700"><Link href="/register">Sign Up Free</Link></Button>
                  <Button asChild variant="outline"><Link href="/login">Sign In</Link></Button>
                </div>
              </CardContent>
            </Card>
          ) : loading ? <Skeleton className="h-48 w-full" /> : !portfolio?.holdings?.length ? (
            <Card>
              <CardContent className="p-10 text-center">
                <DollarSign className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400">No positions yet</p>
                <p className="text-gray-600 text-sm mt-1">Go to Trade tab to buy your first stock</p>
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => setTab('Trade')}>Start Trading</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {portfolio.holdings.map((h: Holding) => (
                <Card key={h.ticker} className={cn('border', gainBg(h.gainLoss))}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{h.ticker}</span>
                          <span className="text-xs text-gray-400">{h.companyName}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{h.shares} shares · avg cost {formatCurrency(h.avgCost)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{formatCurrency(h.currentValue)}</p>
                        <p className={cn('text-sm font-medium', gainColor(h.gainLoss))}>
                          {h.gainLoss >= 0 ? '+' : ''}{formatCurrency(h.gainLoss)} ({h.gainLossPct >= 0 ? '+' : ''}{h.gainLossPct.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setTradeTicker(h.ticker); setTradeType('BUY'); setTab('Trade') }}>Buy More</Button>
                      <Button size="sm" variant="outline" className="text-xs h-7 text-red-400 border-red-500/30" onClick={() => { setTradeTicker(h.ticker); setTradeType('SELL'); setTab('Trade') }}>Sell</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={fetchPortfolio}>
                  <RefreshCw className="h-3 w-3 mr-2" /> Refresh Prices
                </Button>
                <Button
                  variant="outline" size="sm"
                  className="text-orange-400 border-orange-500/30 hover:bg-orange-500/10"
                  onClick={getRoasted}
                  disabled={roastLoading}
                >
                  <Flame className="h-3 w-3 mr-1.5" />
                  {roastLoading ? 'Roasting...' : 'Get Roasted'}
                </Button>
              </div>

              {/* Roast result */}
              {roast && (
                <Card className="border-orange-500/20 bg-orange-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-semibold text-orange-400">Mr. Guy's Verdict</span>
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{roast}</p>
                    <button onClick={() => setRoast(null)} className="text-xs text-gray-600 hover:text-gray-400 mt-3 transition-colors">Dismiss</button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Trade Tab */}
      {tab === 'Trade' && !session && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="h-14 w-14 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
              <Lock className="h-7 w-7 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Sign up to start trading</h3>
              <p className="text-gray-400 text-sm mt-1">Create a free account to trade with your $100,000 in virtual cash and join the leaderboard.</p>
            </div>
            <div className="flex gap-3">
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/register">Sign Up Free</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
            <p className="text-xs text-gray-600">Free forever · No credit card needed</p>
          </CardContent>
        </Card>
      )}

      {tab === 'Trade' && session && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: trade form */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm text-gray-400">Execute Trade</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* BUY / SELL toggle */}
                <div className="flex rounded-lg overflow-hidden border border-gray-700">
                  <button onClick={() => setTradeType('BUY')} className={cn('flex-1 py-2 text-sm font-semibold transition-colors', tradeType === 'BUY' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-800')}>BUY</button>
                  <button onClick={() => setTradeType('SELL')} className={cn('flex-1 py-2 text-sm font-semibold transition-colors', tradeType === 'SELL' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800')}>SELL</button>
                </div>

                {/* Search by name or ticker */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Search by company name or ticker</label>
                  <div className="relative" ref={searchRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setShowSearch(true) }}
                      onFocus={() => setShowSearch(true)}
                      placeholder="e.g. Apple or AAPL"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    {searchLoading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 animate-pulse">...</span>}
                    {showSearch && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                        {searchResults.map(r => (
                          <button key={r.ticker} onClick={() => selectStock(r.ticker, r.name)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 transition-colors text-left">
                            <span className="text-xs font-bold text-blue-400 w-16 shrink-0">{r.ticker}</span>
                            <span className="text-sm text-gray-300 truncate">{r.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected ticker display */}
                {tradeTicker && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 flex items-center justify-between">
                      <span className="text-blue-400 font-bold text-sm">{tradeTicker}</span>
                      {preview && <span className="text-xs text-gray-400">{preview.companyName}</span>}
                    </div>
                    <button onClick={() => { setTradeTicker(''); setPreview(null) }} className="text-gray-500 hover:text-gray-300 p-1">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Or type ticker directly */}
                {!tradeTicker && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Or type ticker directly</label>
                    <input
                      value={tradeTicker}
                      onChange={e => setTradeTicker(e.target.value.toUpperCase())}
                      placeholder="e.g. MSFT"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Live price */}
                {previewLoading && <p className="text-xs text-gray-500 animate-pulse">Fetching live price...</p>}
                {preview && !previewLoading && (
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
                    <p className="text-blue-400 text-xl font-bold">{formatCurrency(preview.price)} <span className="text-xs text-gray-500">per share</span></p>
                  </div>
                )}

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Number of Shares</label>
                  <input
                    value={tradeShares}
                    onChange={e => setTradeShares(e.target.value)}
                    type="number" min="0.01" step="0.01" placeholder="e.g. 10"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {preview && tradeShares && (
                  <div className="p-3 rounded-lg bg-gray-800 border border-gray-700 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Estimated Total</span>
                      <span className="text-white font-bold">{formatCurrency(preview.price * parseFloat(tradeShares))}</span>
                    </div>
                    {tradeType === 'BUY' && portfolio && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Cash after trade</span>
                        <span className={portfolio.cash - (preview.price * parseFloat(tradeShares)) < 0 ? 'text-red-400' : 'text-green-400'}>
                          {formatCurrency(portfolio.cash - (preview.price * parseFloat(tradeShares)))}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <Button onClick={executeTrade} disabled={tradeLoading || !tradeTicker || !tradeShares}
                  className={cn('w-full font-semibold', tradeType === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700')}>
                  {tradeLoading ? 'Processing...' : `${tradeType} ${tradeShares || '0'} shares${preview ? ` · ${formatCurrency(preview.price * (parseFloat(tradeShares) || 0))}` : ''}`}
                </Button>
                <p className="text-xs text-gray-600 text-center">Real-time prices · Virtual money only</p>
              </CardContent>
            </Card>

            {/* Right: chart */}
            {tradeTicker ? (
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">{tradeTicker}, Price Chart</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <StockChart ticker={tradeTicker} currentPrice={preview?.price ?? 0} />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 flex flex-col items-center justify-center h-full text-center">
                  <TrendingUp className="h-12 w-12 text-gray-700 mb-3" />
                  <p className="text-gray-500 text-sm">Search for a stock to see its chart</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {tab === 'Leaderboard' && (
        <div className="space-y-2">
          {lbLoading ? <Skeleton className="h-48 w-full" /> : (() => {
            // Inject Mr. Guy as a synthetic entry, sorted by totalValue
            const mrGuyEntry: LeaderEntry = {
              rank: 0,
              name: 'Mr. Guy',
              totalValue: mrGuyValue,
              gainLoss: mrGuyValue - MR_GUY_START,
              gainLossPct: mrGuyPct ?? 0,
              isMe: false,
              isMrGuy: true,
            }
            const combined = [...leaderboard, mrGuyEntry]
              .sort((a, b) => b.totalValue - a.totalValue)
              .map((e, i) => ({ ...e, rank: i + 1 }))

            return (
              <>
                <div className="flex justify-between text-xs text-gray-500 px-4 py-2">
                  <span>Player</span>
                  <span>Portfolio Value</span>
                </div>
                {combined.map((p) => {
                  const rowKey = p.isMrGuy ? 'mr-guy' : `${p.rank}-${p.name}`
                  const isExpanded = expandedLbRow === rowKey
                  return (
                    <Card key={rowKey} className={cn('border transition-colors',
                      p.isMe ? 'border-blue-500/40 bg-blue-500/5'
                      : p.isMrGuy ? 'border-purple-500/30 bg-purple-950/10'
                      : '')}>
                      <CardContent className="p-4">
                        <button
                          className="w-full text-left"
                          onClick={() => setExpandedLbRow(isExpanded ? null : rowKey)}
                        >
                          <div className="flex items-center gap-3">
                            <span className={cn('text-lg font-bold w-8 text-center',
                              p.rank === 1 ? 'text-yellow-400' : p.rank === 2 ? 'text-gray-300' : p.rank === 3 ? 'text-orange-400' : 'text-gray-600')}>
                              #{p.rank}
                            </span>
                            <div className="flex-1">
                              <p className="font-medium text-white flex items-center gap-2">
                                {p.isMrGuy ? (
                                  <><span>🤖 Mr. Guy</span><span className="text-xs text-purple-400">AI player</span></>
                                ) : (
                                  <>{p.name} {p.isMe && <span className="text-xs text-blue-400">(you)</span>}</>
                                )}
                              </p>
                              <p className={cn('text-xs', p.gainLoss >= 0 ? 'text-green-500' : 'text-red-500')}>
                                {p.gainLoss >= 0 ? '+' : ''}{formatCurrency(p.gainLoss)} ({p.gainLossPct >= 0 ? '+' : ''}{p.gainLossPct.toFixed(2)}%)
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-white">{formatCurrency(p.totalValue)}</p>
                              {!p.isMrGuy && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); shareRank(p) }}
                                  title="Share your rank"
                                  className="p-1.5 rounded-md text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Expanded: Mr. Guy's picks */}
                        {isExpanded && p.isMrGuy && mrGuyPickResults.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-purple-500/20 space-y-1.5">
                            <p className="text-xs text-purple-300 font-semibold uppercase tracking-wide mb-2">Mr. Guy&apos;s Season Portfolio</p>
                            {mrGuyPickResults.map(pick => (
                              <div key={pick.ticker} className="flex items-center justify-between text-xs py-1 border-b border-gray-800/50 last:border-0">
                                <span className="font-bold text-white w-16">{pick.ticker}</span>
                                <span className="text-gray-400">{formatCurrency(pick.currentPrice)}</span>
                                <span className={pick.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}>
                                  {pick.gainLoss >= 0 ? '+' : ''}{formatCurrency(pick.gainLoss)}
                                </span>
                              </div>
                            ))}
                            <div className="flex justify-between text-xs pt-1 font-semibold">
                              <span className="text-gray-400">Total Value</span>
                              <span className={mrGuyPct !== null && mrGuyPct >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {formatCurrency(mrGuyValue)}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </>
            )
          })()}
        </div>
      )}

      {/* History Tab */}
      {tab === 'History' && (
        <div className="space-y-2">
          {loading ? <Skeleton className="h-48 w-full" /> : !portfolio?.trades?.length ? (
            <Card><CardContent className="p-8 text-center"><p className="text-gray-400">No trades yet</p></CardContent></Card>
          ) : (
            portfolio.trades.map((t: Trade) => (
              <Card key={t.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn('h-8 w-8 rounded-full flex items-center justify-center shrink-0', t.type === 'BUY' ? 'bg-green-500/20' : 'bg-red-500/20')}>
                    {t.type === 'BUY' ? <ArrowUpRight className="h-4 w-4 text-green-400" /> : <ArrowDownRight className="h-4 w-4 text-red-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{t.type} {t.shares} shares of {t.ticker}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{new Date(t.executedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">{formatCurrency(t.price * t.shares)}</p>
                    <p className="text-xs text-gray-500">@ {formatCurrency(t.price)}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Beat Mr. Guy + Achievements — shown below tabs for authenticated users */}
      {session && portfolio && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BeatMrGuy userGainLossPct={portfolio.totalGainLossPct ?? null} />
            <AchievementBadges portfolio={portfolio} />
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center mt-6 pb-4 px-4">
        The $100K Challenge is a simulated game using virtual money only. No real funds are involved. Simulated trading performance does not reflect or predict real-world investment results. For educational and entertainment purposes only. Not financial advice.
      </p>
    </div>
  )
}
