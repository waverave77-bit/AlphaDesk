'use client'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/ThemeProvider'
import { TrendingUp, TrendingDown, Trophy, Search, Check, RefreshCw } from 'lucide-react'

// ── Mr. Guy pixel head ────────────────────────────────────────────────────────
const N = null
const HEAD_PIXELS: Array<Array<string|null>> = [
  [N,    N,    '#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604',N      ],
  [N,    '#2b1604','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#2b1604','#2b1604'],
  ['#2b1604','#5c2e0a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#5c2e0a','#5c2e0a','#2b1604'],
  ['#2b1604','#5c2e0a','#5c2e0a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#5c2e0a','#5c2e0a','#5c2e0a','#2b1604'],
  ['#2b1604','#5c2e0a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#5c2e0a','#2b1604'],
  ['#2b1604','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#2b1604'],
  ['#2b1604','#111118','#111118','#1e3a8a','#1e3a8a','#f5c49a','#f5c49a','#1e3a8a','#1e3a8a','#111118','#111118','#2b1604'],
  ['#2b1604','#111118','#111118','#1e3a8a','#1e3a8a','#111118','#111118','#1e3a8a','#1e3a8a','#111118','#111118','#2b1604'],
  ['#2b1604','#111118','#111118','#111118','#111118','#f5c49a','#f5c49a','#111118','#111118','#111118','#111118','#2b1604'],
  ['#2b1604','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#2b1604'],
  [N,    '#f5c49a','#f5c49a','#f5c49a','#c47a50','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a',N      ],
  [N,    '#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a',N,    N      ],
  [N,    N,    '#f5c49a','#f0f0f0','#f0f0f0','#c01010','#c01010','#f0f0f0','#f0f0f0','#f5c49a',N,    N      ],
  ['#f0f0f0','#f0f0f0','#f0f0f0','#f0f0f0','#c01010','#c01010','#7a0000','#7a0000','#f0f0f0','#f0f0f0','#f0f0f0','#222236'],
]
const HEAD_COLS = 12, HEAD_ROWS = 14

function MrGuyHead({ px = 3, className }: { px?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    HEAD_PIXELS.forEach((row, r) => {
      row.forEach((color, col) => {
        if (!color) return
        ctx.fillStyle = color
        ctx.fillRect(col * px, r * px, px, px)
      })
    })
  }, [px])
  return <canvas ref={ref} width={HEAD_COLS * px} height={HEAD_ROWS * px} className={className} style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }} />
}

const STYLES = `
@keyframes mrg-idle  { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
@keyframes mrg-run {
  0%   { transform: translateX(-8px) rotate(-6deg) translateY(0px); }
  25%  { transform: translateX(0px) rotate(0deg) translateY(-5px); }
  50%  { transform: translateX(8px) rotate(6deg) translateY(0px); }
  75%  { transform: translateX(0px) rotate(0deg) translateY(-5px); }
  100% { transform: translateX(-8px) rotate(-6deg) translateY(0px); }
}
@keyframes briefcase-swing { 0%, 100% { transform: rotate(-15deg) translateY(2px); } 50% { transform: rotate(15deg) translateY(-2px); } }
@keyframes bubble-pop { 0% { opacity: 0; transform: scale(0.5) translateY(8px); } 70% { transform: scale(1.05) translateY(-2px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
@keyframes winner-glow { 0%, 100% { box-shadow: 0 0 0 rgba(234,179,8,0); } 50% { box-shadow: 0 0 24px rgba(234,179,8,0.4); } }
.mrg-idle    { animation: mrg-idle  2.4s ease-in-out infinite; }
.mrg-run     { animation: mrg-run 0.55s ease-in-out infinite; }
.briefcase   { animation: briefcase-swing 0.55s ease-in-out infinite; display: inline-block; }
.bubble-pop  { animation: bubble-pop 0.28s cubic-bezier(.34,1.56,.64,1) both; }
.winner-glow { animation: winner-glow 2s ease-in-out infinite; }
`

interface WeeklyPick {
  weekKey: string
  ticker: string
  companyName: string
  price: number
  changePercent: number
  direction: 'up' | 'down'
  targetPct: number
  reasoning: string
}

interface UserPick {
  weekKey: string
  ticker: string
  direction: 'up' | 'down'
  entryPrice: number
  companyName: string
  submittedAt: string
}

interface LivePrice {
  price: number
  changePercent: number
  companyName: string
}

function getWeekKey(): string {
  const now = new Date()
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - now.getDay())
  const y = sunday.getFullYear()
  const m = String(sunday.getMonth() + 1).padStart(2, '0')
  const d = String(sunday.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getWeekLabel(): string {
  const now = new Date()
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - now.getDay())
  const saturday = new Date(sunday)
  saturday.setDate(sunday.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(sunday)} – ${fmt(saturday)}`
}

export default function ChallengePage() {
  const { themeId } = useTheme()
  const isDark = themeId !== 'white'

  const [mrGuyPick, setMrGuyPick] = useState<WeeklyPick | null>(null)
  const [userPick, setUserPick] = useState<UserPick | null>(null)
  const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // User pick form
  const [userTicker, setUserTicker] = useState('')
  const [userDirection, setUserDirection] = useState<'up' | 'down'>('up')
  const [tickerError, setTickerError] = useState('')
  const [searchResults, setSearchResults] = useState<{ symbol: string; name: string }[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  // Past results from localStorage
  const [history, setHistory] = useState<{ weekKey: string; userPick: UserPick; mrPick: WeeklyPick; userWon: boolean | null; mrWon: boolean | null }[]>([])

  useEffect(() => {
    window.scrollTo(0, 0)
    loadData()
    loadHistory()
  }, [])

  // Auto-refresh live prices every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const tickers = [mrGuyPick?.ticker, userPick?.ticker].filter(Boolean) as string[]
      if (tickers.length) fetchLivePrices(tickers)
    }, 60_000)
    return () => clearInterval(interval)
  }, [mrGuyPick?.ticker, userPick?.ticker])

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/weekly-pick')
      const data = await res.json()

      // Lock in Mr. Guy's entry price locally so server cold-starts don't reset it
      const mrStored = localStorage.getItem('mrGuyWeeklyPick')
      if (mrStored) {
        const mrCached = JSON.parse(mrStored)
        if (mrCached.weekKey === data.weekKey) {
          // Use the locked-in entry price, not the current server price
          data.price = mrCached.entryPrice
        } else {
          // New week — store fresh entry price
          localStorage.setItem('mrGuyWeeklyPick', JSON.stringify({ weekKey: data.weekKey, entryPrice: data.price }))
        }
      } else {
        localStorage.setItem('mrGuyWeeklyPick', JSON.stringify({ weekKey: data.weekKey, entryPrice: data.price }))
      }

      setMrGuyPick(data)

      // Load existing user pick from localStorage
      const stored = localStorage.getItem('mrGuyUserPick')
      if (stored) {
        const pick: UserPick = JSON.parse(stored)
        if (pick.weekKey === getWeekKey()) {
          setUserPick(pick)
          setSubmitted(true)
          // Fetch live prices
          fetchLivePrices([data.ticker, pick.ticker])
          return
        }
      }
      fetchLivePrices([data.ticker])
    } catch {}
    setLoading(false)
  }

  async function fetchLivePrices(tickers: string[]) {
    setLoading(true)
    const unique = Array.from(new Set(tickers.filter(Boolean)))
    const results = await Promise.allSettled(
      unique.map(t => fetch(`/api/stock/${t}`).then(r => r.json()))
    )
    const prices: Record<string, LivePrice> = {}
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value?.quote) {
        prices[unique[i]] = {
          price: r.value.quote.price,
          changePercent: r.value.quote.changePercent,
          companyName: r.value.quote.companyName,
        }
      }
    })
    setLivePrices(prices)
    setLoading(false)
  }

  function loadHistory() {
    try {
      const stored = localStorage.getItem('mrGuyPickHistory')
      if (stored) setHistory(JSON.parse(stored))
    } catch {}
  }

  async function searchTicker(query: string) {
    if (query.length < 2) { setSearchResults([]); return }
    setSearchLoading(true)
    try {
      const res = await fetch(`/api/search-ticker?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setSearchResults(data.results ?? [])
    } catch {
      setSearchResults([])
    }
    setSearchLoading(false)
  }

  async function submitPick() {
    if (!userTicker.trim()) { setTickerError('Enter a ticker or company name'); return }
    if (!mrGuyPick) return
    setTickerError('')
    setSubmitting(true)

    const ticker = userTicker.trim().toUpperCase()
    try {
      const res = await fetch(`/api/stock/${ticker}`)
      const data = await res.json()
      if (!data?.quote?.price) {
        setTickerError(`Couldn't find "${ticker}" — check the ticker symbol`)
        setSubmitting(false)
        return
      }

      const pick: UserPick = {
        weekKey: getWeekKey(),
        ticker,
        direction: userDirection,
        // Use Friday's close as entry — same as Mr. Guy (market closed when picks are made)
        entryPrice: data.quote.previousClose ?? data.quote.price,
        companyName: data.quote.companyName ?? ticker,
        submittedAt: new Date().toISOString(),
      }
      localStorage.setItem('mrGuyUserPick', JSON.stringify(pick))
      setUserPick(pick)
      setSubmitted(true)
      fetchLivePrices([mrGuyPick.ticker, ticker])
    } catch {
      setTickerError('Something went wrong — try again')
    }
    setSubmitting(false)
  }

  function calcPnl(pick: UserPick | WeeklyPick, currentPrice: number): { pct: number; winning: boolean } | null {
    const entry = 'entryPrice' in pick ? pick.entryPrice : pick.price
    if (!entry || !currentPrice) return null
    const rawPct = ((currentPrice - entry) / entry) * 100
    const pct = pick.direction === 'up' ? rawPct : -rawPct
    return { pct, winning: pct > 0 }
  }

  const weekLabel = getWeekLabel()
  const weekKey = getWeekKey()

  const mrLive = mrGuyPick ? livePrices[mrGuyPick.ticker] : null
  const userLive = userPick ? livePrices[userPick.ticker] : null

  const mrPnl = mrGuyPick && mrLive ? calcPnl(mrGuyPick, mrLive.price) : null
  const userPnl = userPick && userLive ? calcPnl(userPick, userLive.price) : null

  return (
    <div className={cn('min-h-screen', isDark ? 'bg-gray-950' : 'bg-slate-50')}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <MrGuyHead px={5} className={cn('rounded-lg', loading ? 'mrg-think' : 'mrg-idle')} />
          <div>
            <h1 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>
              Pick of the Week
            </h1>
            <p className={cn('text-sm mt-0.5', isDark ? 'text-gray-400' : 'text-slate-500')}>
              You vs. Mr. Guy. One pick each. Whoever's right wins bragging rights.
            </p>
            <p className={cn('text-xs mt-1 font-medium', isDark ? 'text-orange-400' : 'text-orange-600')}>
              Week of {weekLabel}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="flex items-end gap-2">
              <MrGuyHead px={6} className="mrg-run" />
              <span className="text-3xl briefcase">💼</span>
            </div>
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-slate-500')}>Loading this week's picks...</p>
          </div>
        ) : (
          <>
            {/* Side-by-side picks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Mr. Guy's pick */}
              {mrGuyPick && (
                <div className={cn(
                  'rounded-2xl border p-5 space-y-3',
                  isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-slate-200'
                )}>
                  <div className="flex items-center gap-2">
                    <MrGuyHead px={3} />
                    <span className={cn('text-xs font-semibold', isDark ? 'text-orange-400' : 'text-orange-600')}>MR. GUY'S PICK</span>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className={cn('text-2xl font-black', isDark ? 'text-white' : 'text-slate-900')}>{mrGuyPick.ticker}</span>
                      <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-slate-500')}>{mrGuyPick.companyName}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        'flex items-center gap-1 text-sm font-bold px-2.5 py-0.5 rounded-full',
                        mrGuyPick.direction === 'up'
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-red-500/15 text-red-400'
                      )}>
                        {mrGuyPick.direction === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        {mrGuyPick.direction === 'up' ? 'Going UP' : 'Going DOWN'}
                      </span>
                      <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-slate-400')}>target ±{mrGuyPick.targetPct}%</span>
                    </div>
                  </div>

                  {/* Live price */}
                  {mrLive && (
                    <div className={cn('rounded-xl px-3 py-2 text-sm', isDark ? 'bg-gray-700/50' : 'bg-slate-50')}>
                      <span className={cn('font-semibold', isDark ? 'text-white' : 'text-slate-900')}>${mrLive.price?.toFixed(2)}</span>
                      <span className={cn('ml-2 text-xs', mrLive.changePercent >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {mrLive.changePercent >= 0 ? '+' : ''}{mrLive.changePercent?.toFixed(2)}% today
                      </span>
                    </div>
                  )}

                  {/* P&L */}
                  {mrPnl !== null && (
                    <div className={cn(
                      'rounded-xl px-3 py-2 text-center',
                      mrPnl.winning ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                    )}>
                      <span className={cn('text-lg font-black', mrPnl.winning ? 'text-green-400' : 'text-red-400')}>
                        {mrPnl.pct >= 0 ? '+' : ''}{mrPnl.pct.toFixed(2)}%
                      </span>
                      <span className={cn('text-xs ml-2', isDark ? 'text-gray-400' : 'text-slate-500')}>
                        since pick · {mrPnl.winning ? 'winning 🎯' : 'losing rn'}
                      </span>
                    </div>
                  )}

                  {/* Reasoning */}
                  <p className={cn('text-sm leading-relaxed italic', isDark ? 'text-gray-300' : 'text-slate-600')}>
                    "{mrGuyPick.reasoning}"
                  </p>
                </div>
              )}

              {/* User's pick */}
              <div className={cn(
                'rounded-2xl border p-5 space-y-3',
                isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-slate-200'
              )}>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">You</div>
                  <span className={cn('text-xs font-semibold', isDark ? 'text-blue-400' : 'text-blue-600')}>YOUR PICK</span>
                </div>

                {!submitted ? (
                  <div className="space-y-3">
                    <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-slate-500')}>
                      Make your pick for the week. Up or down?
                    </p>

                    {/* Popular stock grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { ticker: 'AAPL', name: 'Apple' },
                        { ticker: 'MSFT', name: 'Microsoft' },
                        { ticker: 'NVDA', name: 'Nvidia' },
                        { ticker: 'TSLA', name: 'Tesla' },
                        { ticker: 'AMZN', name: 'Amazon' },
                        { ticker: 'GOOGL', name: 'Google' },
                        { ticker: 'META', name: 'Meta' },
                        { ticker: 'JPM', name: 'JPMorgan' },
                        { ticker: 'SPY', name: 'S&P 500 ETF' },
                      ].map(s => (
                        <button
                          key={s.ticker}
                          onClick={() => { setUserTicker(s.ticker); setTickerError('') }}
                          className={cn(
                            'flex flex-col items-center py-2.5 px-2 rounded-xl border text-center transition-all',
                            userTicker === s.ticker
                              ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                              : isDark
                                ? 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700/60'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                          )}
                        >
                          <span className="text-xs font-bold">{s.ticker}</span>
                          <span className={cn('text-[10px] mt-0.5', isDark ? 'text-gray-500' : 'text-slate-400')}>{s.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* Custom ticker input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={userTicker}
                        onChange={e => {
                          setUserTicker(e.target.value)
                          setTickerError('')
                          searchTicker(e.target.value)
                        }}
                        placeholder="Or type any ticker / company name…"
                        className={cn(
                          'w-full px-3 py-2 rounded-xl border text-sm',
                          isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400',
                          tickerError && 'border-red-500'
                        )}
                      />
                      {tickerError && <p className="text-red-400 text-xs mt-1">{tickerError}</p>}
                      {searchResults.length > 0 && (
                        <div className={cn(
                          'absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-lg z-10 overflow-hidden',
                          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
                        )}>
                          {searchResults.map(r => (
                            <button
                              key={r.symbol}
                              onClick={() => { setUserTicker(r.symbol); setSearchResults([]) }}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                                isDark ? 'hover:bg-gray-700' : 'hover:bg-slate-50'
                              )}
                            >
                              <span className={cn('text-xs font-mono font-bold w-12 shrink-0', isDark ? 'text-orange-400' : 'text-orange-600')}>{r.symbol}</span>
                              <span className={cn('text-xs truncate', isDark ? 'text-gray-300' : 'text-slate-600')}>{r.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Direction toggle */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setUserDirection('up')}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-sm font-semibold transition-all',
                          userDirection === 'up'
                            ? 'bg-green-500/20 border-green-500/40 text-green-400'
                            : isDark ? 'border-gray-700 text-gray-400 hover:border-gray-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        )}
                      >
                        <TrendingUp className="h-4 w-4" /> Going UP
                      </button>
                      <button
                        onClick={() => setUserDirection('down')}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-sm font-semibold transition-all',
                          userDirection === 'down'
                            ? 'bg-red-500/20 border-red-500/40 text-red-400'
                            : isDark ? 'border-gray-700 text-gray-400 hover:border-gray-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        )}
                      >
                        <TrendingDown className="h-4 w-4" /> Going DOWN
                      </button>
                    </div>

                    <button
                      onClick={submitPick}
                      disabled={submitting}
                      className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Locking in...' : 'Lock In My Pick'}
                    </button>
                  </div>
                ) : userPick ? (
                  <div className="space-y-3 bubble-pop">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className={cn('text-2xl font-black', isDark ? 'text-white' : 'text-slate-900')}>{userPick.ticker}</span>
                        <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-slate-500')}>{userPick.companyName}</span>
                      </div>
                      <div className="mt-1">
                        <span className={cn(
                          'flex items-center gap-1 w-fit text-sm font-bold px-2.5 py-0.5 rounded-full',
                          userPick.direction === 'up'
                            ? 'bg-green-500/15 text-green-400'
                            : 'bg-red-500/15 text-red-400'
                        )}>
                          {userPick.direction === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                          {userPick.direction === 'up' ? 'Going UP' : 'Going DOWN'}
                        </span>
                      </div>
                    </div>

                    {/* Live price */}
                    {userLive && (
                      <div className={cn('rounded-xl px-3 py-2 text-sm', isDark ? 'bg-gray-700/50' : 'bg-slate-50')}>
                        <span className={cn('font-semibold', isDark ? 'text-white' : 'text-slate-900')}>${userLive.price?.toFixed(2)}</span>
                        <span className={cn('ml-2 text-xs', userLive.changePercent >= 0 ? 'text-green-400' : 'text-red-400')}>
                          {userLive.changePercent >= 0 ? '+' : ''}{userLive.changePercent?.toFixed(2)}% today
                        </span>
                      </div>
                    )}

                    {/* P&L */}
                    {userPnl !== null && (
                      <div className={cn(
                        'rounded-xl px-3 py-2 text-center',
                        userPnl.winning ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                      )}>
                        <span className={cn('text-lg font-black', userPnl.winning ? 'text-green-400' : 'text-red-400')}>
                          {userPnl.pct >= 0 ? '+' : ''}{userPnl.pct.toFixed(2)}%
                        </span>
                        <span className={cn('text-xs ml-2', isDark ? 'text-gray-400' : 'text-slate-500')}>
                          since pick · {userPnl.winning ? 'winning 🎯' : 'losing rn'}
                        </span>
                      </div>
                    )}

                    <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-slate-400')}>
                      Locked in at ${userPick.entryPrice?.toFixed(2)} · {new Date(userPick.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Scoreboard — who's winning this week */}
            {submitted && userPnl !== null && mrPnl !== null && (
              <div className={cn(
                'rounded-2xl border p-5 bubble-pop',
                isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-slate-200'
              )}>
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <span className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>This Week's Scoreboard</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Mr. Guy', pnl: mrPnl, head: true },
                    { label: 'You', pnl: userPnl, head: false },
                  ].map(({ label, pnl, head }) => (
                    <div key={label} className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl',
                      pnl.winning ? 'bg-green-500/10 border border-green-500/20' : isDark ? 'bg-gray-700/40' : 'bg-slate-50'
                    )}>
                      {head ? <MrGuyHead px={4} /> : (
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">You</div>
                      )}
                      <span className={cn('text-xs font-medium', isDark ? 'text-gray-300' : 'text-slate-600')}>{label}</span>
                      <span className={cn('text-xl font-black', pnl.winning ? 'text-green-400' : 'text-red-400')}>
                        {pnl.pct >= 0 ? '+' : ''}{pnl.pct.toFixed(2)}%
                      </span>
                      {pnl.winning && <span className="text-xs text-yellow-400 font-semibold">WINNING</span>}
                    </div>
                  ))}
                </div>

                {userPnl.winning && !mrPnl.winning && (
                  <p className={cn('text-center text-sm mt-4 font-medium', isDark ? 'text-green-300' : 'text-green-600')}>
                    You're beating Mr. Guy this week. Enjoy it while it lasts.
                  </p>
                )}
                {mrPnl.winning && !userPnl.winning && (
                  <p className={cn('text-center text-sm mt-4 font-medium', isDark ? 'text-orange-300' : 'text-orange-600')}>
                    Mr. Guy is currently winning. He will not be humble about this.
                  </p>
                )}
                {userPnl.winning && mrPnl.winning && (
                  <p className={cn('text-center text-sm mt-4 font-medium', isDark ? 'text-blue-300' : 'text-blue-600')}>
                    Both picks are green this week. Market making everyone look smart for once.
                  </p>
                )}
              </div>
            )}

            {/* How it works */}
            <div className={cn(
              'rounded-2xl border p-5',
              isDark ? 'bg-gray-800/40 border-gray-700/60' : 'bg-white border-slate-200'
            )}>
              <h3 className={cn('text-sm font-semibold mb-3', isDark ? 'text-white' : 'text-slate-900')}>How it works</h3>
              <div className="space-y-2">
                {[
                  'Every Monday, Mr. Guy picks a stock and a direction.',
                  'You pick any stock and call it up or down for the week.',
                  'Check back Friday to see who was right.',
                  'Your pick resets each week. New week, new chance.',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="shrink-0 h-5 w-5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <p className={cn('text-sm', isDark ? 'text-gray-300' : 'text-slate-600')}>{step}</p>
                  </div>
                ))}
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  )
}
