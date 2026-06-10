'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Search, X, Trophy, ChevronRight, Shield, Sparkles, Zap, Plus, Pencil, RotateCcw } from 'lucide-react'
import { COMPANIES, THEMES } from '@/lib/sim-companies'
import { useMarketStatus } from '@/hooks/use-market-status'

const MrGuyMascot = dynamic(() => import('@/components/learn/MrGuyMascot'), { ssr: false })
const MrGuyHead = dynamic(() => import('@/components/MrGuyHead'), { ssr: false })
const SimIntro = dynamic(() => import('@/components/game/SimIntro'), { ssr: false })
const CompanyLogo = dynamic(() => import('@/components/game/CompanyLogo'), { ssr: false })
const MiniChart = dynamic(() => import('@/components/game/MiniChart'), { ssr: false })
// NOTE: WhatsHappening (market-pulse learning card) is kept in
// components/game/WhatsHappening.tsx but removed from the page for now.

const BUY_AMOUNTS = [100, 500, 1000, 5000]
const SELL_PCTS: [number, string][] = [[0.25, '25%'], [0.5, 'Half'], [0.75, '75%'], [1, 'All']]

// "Don't know what to buy?" — one question, each answer points to a category.
const HELP_OPTIONS = [
  { id: 'safe',     label: 'Slow & steady',  sub: 'Lower risk, calmer ride',     Icon: Shield,   theme: 'index',
    line: 'Index funds hold hundreds of companies at once, so no single one can sink you — the classic calm way to start.', picks: ['SPY', 'VOO', 'SCHD'] },
  { id: 'familiar', label: 'Brands I know',  sub: 'Household names I recognise',  Icon: Sparkles, theme: 'brands',
    line: 'Big, familiar companies you already use. Widely owned and steadier than tiny unknown stocks.', picks: ['DIS', 'NKE', 'WMT'] },
  { id: 'exciting', label: 'Exciting & fast', sub: 'Bigger swings, more thrill',  Icon: Zap,      theme: 'tech',
    line: 'Fast-growing tech names — more upside, but expect bigger ups and downs. A small amount is a smart way to start.', picks: ['AAPL', 'NVDA', 'AMD'] },
]
const accentOf = (id: string) => THEMES.find((t) => t.id === id)?.accent || '#3b82f6'

function gainCls(n: number) { return n >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' }
function gainTint(n: number) { return n >= 0 ? 'bg-green-500/10 border border-green-500/25' : 'bg-red-500/10 border border-red-500/25' }
async function priceOf(t: string): Promise<{ price: number; name: string } | null> {
  try { const d = await fetch(`/api/stock/${t}`).then((r) => r.json()); return d?.quote?.price ? { price: d.quote.price, name: d.quote.companyName || t } : null } catch { return null }
}

interface Holding { ticker: string; companyName: string; shares: number; avgCost: number; currentPrice: number; currentValue: number; gainLoss: number; gainLossPct: number }
interface LbEntry { rank: number; name: string; gainLoss: number; gainLossPct: number; isMe: boolean; isMrGuy?: boolean; isPro?: boolean }
interface CommunityTrade { ticker: string; shares: number; price: number; type: 'BUY' | 'SELL'; executedAt: string; userName: string; isPro: boolean; isMe: boolean }
type BuyTarget = { ticker: string; name: string; price: number; blurb?: string }

function StatTile({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <div className="bg-black/5 dark:bg-white/5 rounded-2xl px-2 py-3 text-center overflow-hidden">
      <p className={`text-base font-black ${cls} leading-tight whitespace-nowrap`}>{value}</p>
      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mt-1 truncate">{label}</p>
    </div>
  )
}

function MarketPill({ market }: { market: { status: string; label: string; dayName: string } }) {
  const tone: Record<string, { box: string; dot: string }> = {
    open:    { box: 'bg-green-500/10 border-green-500/30 text-green-400',   dot: 'bg-green-400' },
    pre:     { box: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400', dot: 'bg-yellow-400' },
    after:   { box: 'bg-blue-500/10 border-blue-500/30 text-blue-400',     dot: 'bg-blue-400' },
    closed:  { box: 'bg-gray-500/10 border-gray-600 text-gray-400',         dot: 'bg-gray-500' },
    weekend: { box: 'bg-gray-500/10 border-gray-600 text-gray-400',         dot: 'bg-gray-500' },
    holiday: { box: 'bg-purple-500/10 border-purple-500/30 text-purple-400', dot: 'bg-purple-400' },
  }
  const t = tone[market.status] ?? tone.closed
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-mono font-bold ${t.box}`} title={market.dayName}>
      <span className={`h-2 w-2 rounded-full ${t.dot} ${market.status === 'open' ? 'animate-pulse' : ''}`} />
      {market.status === 'open' ? 'Market open' : market.label === 'Closed' ? 'Market closed' : market.label}
    </span>
  )
}

function ClosedNote({ market, verb }: { market: { status: string; label: string } | null; verb: 'buy' | 'sell' }) {
  if (!market || market.status === 'open') return null
  const reason =
    market.status === 'weekend' ? 'Markets are closed for the weekend.'
    : market.status === 'holiday' ? `Markets are closed — ${market.label.replace('Closed · ', '')}.`
    : market.status === 'pre' ? 'Markets aren’t open yet (pre-market).'
    : market.status === 'after' ? 'Markets have closed for the day (after-hours).'
    : 'Markets are closed right now.'
  return (
    <div className="mb-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2.5">
      <p className="text-xs text-yellow-300 leading-relaxed">
        <span className="font-bold">{reason}</span>{' '}
        Your practice {verb} still goes through at the last price — a real broker would just queue it until the next open.
      </p>
    </div>
  )
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border-2 border-[#16130a] shadow-[4px_4px_0_#16130a] dark:border-gray-700 dark:shadow-none rounded-3xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-white">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

export default function GamePage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const market = useMarketStatus()
  const [portfolio, setPortfolio] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<LbEntry[]>([])
  const [communityTrades, setCommunityTrades] = useState<CommunityTrade[]>([])
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [portfolios, setPortfolios] = useState<{ id: string; name: string }[]>([])
  const [activePid, setActivePid] = useState<string | null>(null)
  const [canAddPortfolio, setCanAddPortfolio] = useState(false)

  const [buyTarget, setBuyTarget] = useState<BuyTarget | null>(null)
  const [buyAmount, setBuyAmount] = useState(500)
  const [buying, setBuying] = useState(false)
  const [selling, setSelling] = useState<string | null>(null)
  const [sellTarget, setSellTarget] = useState<Holding | null>(null)
  const [sellAmount, setSellAmount] = useState(0)
  const [helperOpen, setHelperOpen] = useState(false)
  const [helperChoice, setHelperChoice] = useState<string | null>(null)

  const [activeTheme, setActiveTheme] = useState('all')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ ticker: string; name: string }[]>([])

  const fetchPortfolio = async (pid?: string) => {
    const id = pid ?? activePid
    const d = await fetch('/api/virtual' + (id ? `?portfolioId=${id}` : '')).then((r) => r.json())
    if (d?.error) { setPortfolio(null); setLoading(false); return }
    setPortfolio(d)
    setPortfolios(d.portfolios || [])
    setActivePid(d.activePortfolioId ?? null)
    setCanAddPortfolio(!!d.canAddPortfolio)
    setLoading(false)
  }
  const fetchLeaderboard = async () => { try { const d = await fetch('/api/virtual/leaderboard?mode=alltime').then((r) => r.json()); setLeaderboard(d.board || []) } catch {} }
  const fetchCommunityTrades = async () => { try { const d = await fetch('/api/virtual/community-trades').then((r) => r.json()); setCommunityTrades(d.feed || []) } catch {} }

  const switchPortfolio = (id: string) => { if (id === activePid) return; setActivePid(id); fetchPortfolio(id) }
  const createPortfolio = async () => {
    try {
      const r = await fetch('/api/virtual/portfolio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create' }) })
      const d = await r.json()
      if (!r.ok) {
        toast(d.upgrade
          ? { title: 'A 2nd portfolio is a Pro perk', description: 'Upgrade to run two strategies side by side.' }
          : { title: 'Couldn’t create', description: d.error, variant: 'destructive' })
        return
      }
      toast({ title: 'New portfolio created', description: 'Fresh $100,000 to play with.' })
      fetchPortfolio(d.id)
    } catch {}
  }
  const renamePortfolio = async (id: string) => {
    const current = portfolios.find((p) => p.id === id)?.name || ''
    const name = typeof window !== 'undefined' ? window.prompt('Name this portfolio', current) : null
    if (!name || !name.trim()) return
    await fetch('/api/virtual/portfolio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'rename', portfolioId: id, name }) })
    fetchPortfolio(id)
  }
  const resetPortfolio = async (id: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Reset this portfolio to $100,000 and clear all holdings? This can’t be undone.')) return
    await fetch('/api/virtual/portfolio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reset', portfolioId: id }) })
    toast({ title: 'Portfolio reset', description: 'Back to a clean $100,000.' })
    fetchPortfolio(id)
  }

  // Load prices on demand (the catalog is ~100 names — never fetch all at once).
  const requested = useRef<Set<string>>(new Set())
  const loadPrice = useCallback((t: string) => {
    if (requested.current.has(t)) return
    requested.current.add(t)
    priceOf(t).then((p) => { if (p) setPrices((s) => ({ ...s, [t]: p.price })) })
  }, [])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') { setLoading(false); return }
    fetchPortfolio(); fetchLeaderboard(); fetchCommunityTrades()
  }, [status])
  // Preview = first 2 of each theme; the full list loads when its chip is active.
  useEffect(() => { THEMES.flatMap((t) => t.tickers.slice(0, 2)).forEach(loadPrice) }, [loadPrice])
  useEffect(() => { if (activeTheme !== 'all') THEMES.find((t) => t.id === activeTheme)?.tickers.forEach(loadPrice) }, [activeTheme, loadPrice])
  useEffect(() => { if (helperOpen) HELP_OPTIONS.flatMap((o) => o.picks).forEach(loadPrice) }, [helperOpen, loadPrice])
  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => { try { const d = await fetch(`/api/stock/search?q=${encodeURIComponent(query)}`).then((r) => r.json()); setResults((d.results || []).slice(0, 6)) } catch { setResults([]) } }, 350)
    return () => clearTimeout(t)
  }, [query])

  const openBuy = async (ticker: string, name?: string) => {
    setBuyAmount(500)
    const p = prices[ticker] ? { price: prices[ticker], name: name || ticker } : await priceOf(ticker)
    if (!p) { toast({ title: 'Couldn’t load price', description: 'Try again in a sec.', variant: 'destructive' }); return }
    const known = COMPANIES[ticker]
    setBuyTarget({ ticker, name: known?.name || name || p.name, price: p.price, blurb: known?.blurb }); setQuery('')
  }
  const confirmBuy = async () => {
    if (!buyTarget || buying) return
    setBuying(true)
    const shares = +(buyAmount / buyTarget.price).toFixed(4)
    try {
      const r = await fetch('/api/virtual/trade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticker: buyTarget.ticker, shares, type: 'BUY', portfolioId: activePid }) })
      const d = await r.json(); if (!r.ok) throw new Error(d.error)
      toast({ title: 'Boom — you’re an owner!', description: `You put ${formatCurrency(buyAmount)} into ${buyTarget.name}.` })
      setBuyTarget(null); await fetchPortfolio(); fetchLeaderboard(); fetchCommunityTrades()
    } catch (e: any) { toast({ title: 'Couldn’t buy', description: e.message, variant: 'destructive' }) }
    setBuying(false)
  }
  const openSell = (h: Holding) => { setSellTarget(h); setSellAmount(h.currentValue) }
  const confirmSell = async () => {
    if (!sellTarget || selling) return
    const full = sellAmount >= sellTarget.currentValue - 0.01
    // Sell exactly what's owned for "All"; otherwise convert $ → shares, clamped.
    const shares = full ? sellTarget.shares : Math.min(sellTarget.shares, +(sellAmount / sellTarget.currentPrice).toFixed(4))
    if (shares <= 0) { toast({ title: 'Pick an amount', description: 'Choose how much you want to sell.', variant: 'destructive' }); return }
    setSelling(sellTarget.ticker)
    try {
      const r = await fetch('/api/virtual/trade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticker: sellTarget.ticker, shares, type: 'SELL', portfolioId: activePid }) })
      const d = await r.json(); if (!r.ok) throw new Error(d.error)
      toast({ title: 'Sold!', description: full ? `You sold all your ${sellTarget.companyName || sellTarget.ticker}.` : `You sold ${formatCurrency(sellAmount)} of ${sellTarget.companyName || sellTarget.ticker}.` })
      setSellTarget(null); await fetchPortfolio(); fetchLeaderboard(); fetchCommunityTrades()
    } catch (e: any) { toast({ title: 'Couldn’t sell', description: e.message, variant: 'destructive' }) }
    setSelling(null)
  }

  const holdings: Holding[] = portfolio?.holdings ?? []
  const cash = portfolio?.cash ?? 0
  const pnl = portfolio?.totalGainLoss ?? 0
  const pnlPct = portfolio?.totalGainLossPct ?? 0
  const up = pnl >= 0
  const myRank = leaderboard.find((e) => e.isMe)?.rank
  const take = pnlPct === 0 ? 'Fresh start. Buy a company you actually believe in.'
    : pnlPct >= 2 ? 'You’re crushing it. Let it ride.'
    : up ? 'Nicely done — you’re in the green.'
    : 'Down a little? Totally normal. It’s a long game.'

  const companyCard = (ticker: string) => {
    const c = COMPANIES[ticker]
    if (!c) return null
    return (
      <button key={ticker} onClick={() => openBuy(ticker, c.name)} disabled={!prices[ticker]}
        style={{ background: `${c.color}14`, borderColor: `${c.color}40` }}
        className="text-left border rounded-2xl p-3.5 transition-all disabled:opacity-60 hover:-translate-y-0.5 active:translate-y-0 hover:brightness-110">
        <div className="flex items-center gap-2.5">
          <CompanyLogo ticker={ticker} size={40} />
          <div className="min-w-0"><p className="font-bold text-white truncate">{c.name}</p><p className="text-[11px] text-gray-500">{ticker}</p></div>
        </div>
        <p className="text-base font-bold text-gray-300 mt-3">{prices[ticker] ? formatCurrency(prices[ticker]) : '…'}</p>
      </button>
    )
  }
  // Compact pick used inside the helper — tapping it jumps straight to buying.
  const helperPickCard = (ticker: string) => {
    const c = COMPANIES[ticker]
    if (!c) return null
    return (
      <button key={ticker} onClick={() => { setHelperOpen(false); openBuy(ticker, c.name) }}
        style={{ background: `${c.color}14`, borderColor: `${c.color}40` }}
        className="w-full text-left border rounded-2xl p-3 flex items-center gap-2.5 transition-all hover:brightness-110">
        <CompanyLogo ticker={ticker} size={36} />
        <div className="min-w-0 flex-1"><p className="font-bold text-white truncate text-sm">{c.name}</p><p className="text-[11px] text-gray-500">{ticker}</p></div>
        <span className="text-sm font-bold text-gray-300 shrink-0">{prices[ticker] ? formatCurrency(prices[ticker]) : '…'}</span>
      </button>
    )
  }
  // Preview: each category shows 2 stocks + a colour-coded "See more" to its page.
  const buyPreview = (
    <div className="space-y-6">
      {THEMES.map((theme) => (
        <div key={theme.id}>
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="grid place-items-center h-7 w-7 rounded-lg shrink-0" style={{ background: `${theme.accent}1f` }}>
                <theme.Icon className="h-4 w-4" style={{ color: theme.accent }} />
              </span>
              <p className="font-black text-white truncate">{theme.title}</p>
            </div>
            <button onClick={() => setActiveTheme(theme.id)} className="shrink-0 flex items-center gap-0.5 text-xs font-bold hover:opacity-80" style={{ color: theme.accent }}>
              See more<ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">{theme.blurb}</p>
          <div className="grid grid-cols-2 gap-3">{theme.tickers.slice(0, 2).map(companyCard)}</div>
        </div>
      ))}
    </div>
  )
  // Full list for one category (shown inline when its chip is active).
  const catObj = THEMES.find((t) => t.id === activeTheme) || null
  const buyCategory = catObj && (
    <div>
      <div className="flex items-center gap-2.5 mb-1">
        <span className="grid place-items-center h-9 w-9 rounded-xl shrink-0" style={{ background: `${catObj.accent}1f` }}>
          <catObj.Icon className="h-5 w-5" style={{ color: catObj.accent }} />
        </span>
        <div className="min-w-0">
          <p className="font-black text-white truncate">{catObj.title}</p>
          <p className="text-xs text-gray-500">Tap any company — Mr. Guy explains it</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{catObj.blurb}</p>
      <div className="grid grid-cols-2 gap-3">{catObj.tickers.map(companyCard)}</div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-20">
      <SimIntro />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500 dark:text-yellow-400" /> $100K Challenge
        </h1>
        {market && <MarketPill market={market} />}
      </div>

      {!session && status !== 'loading' ? (
        <div className="bg-gray-900 border-2 border-[#16130a] shadow-[4px_4px_0_#16130a] dark:border-gray-700 dark:shadow-none rounded-3xl p-10 text-center max-w-xl mx-auto">
          <div className="flex justify-center mb-3"><MrGuyMascot px={3} mood="idle" /></div>
          <p className="text-white font-black text-xl">Get your $100,000 in fake money</p>
          <p className="text-gray-400 text-sm mt-1">Sign up free to invest risk-free and climb the leaderboard.</p>
          <div className="flex gap-3 justify-center mt-5">
            <Link href="/register" className="bg-blue-600 hover:bg-blue-500 text-[#fff] font-bold rounded-2xl px-6 py-3">Sign up free</Link>
            <Link href="/login" className="border border-gray-700 text-gray-200 font-bold rounded-2xl px-6 py-3">Sign in</Link>
          </div>
        </div>
      ) : loading ? (
        <div className="bg-gray-900 border-2 border-[#16130a] shadow-[4px_4px_0_#16130a] dark:border-gray-700 dark:shadow-none rounded-3xl p-10 text-center text-gray-500">Loading your money…</div>
      ) : (
        <>
          {/* ── Portfolio switcher ── */}
          {portfolios.length >= 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              {portfolios.map((p) => {
                const on = p.id === activePid
                return (
                  <div key={p.id} className={`flex items-center rounded-full border-2 ${on ? 'bg-[#2563eb] border-[#16130a] text-[#fff]' : 'border-gray-700 text-gray-300'}`}>
                    <button onClick={() => switchPortfolio(p.id)} className="font-mono font-bold text-sm pl-3.5 pr-2.5 py-1.5">{p.name}</button>
                    {on && (
                      <span className="flex items-center gap-0.5 pr-2">
                        <button onClick={() => renamePortfolio(p.id)} title="Rename" className="p-1 hover:opacity-70"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => resetPortfolio(p.id)} title="Reset to $100k" className="p-1 hover:opacity-70"><RotateCcw className="h-3.5 w-3.5" /></button>
                      </span>
                    )}
                  </div>
                )
              })}
              {portfolios.length < 2 && (
                <button onClick={createPortfolio} className="flex items-center gap-1.5 font-mono font-bold text-sm px-3.5 py-1.5 rounded-full border-2 border-dashed border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-400">
                  <Plus className="h-3.5 w-3.5" /> New portfolio
                  {!canAddPortfolio && <span className="text-[10px] uppercase bg-[#ffd23f] text-[#16130a] border border-[#16130a] rounded px-1 leading-none">Pro</span>}
                </button>
              )}
            </div>
          )}

          {/* ── Hero ── */}
          <div className="bg-gray-900 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent border-2 border-[#16130a] shadow-[4px_4px_0_#16130a] dark:border-gray-700 dark:shadow-none rounded-3xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="shrink-0 -mb-2 self-end"><MrGuyMascot px={4} mood={pnlPct >= 2 ? 'celebrate' : up ? 'happy' : 'sad'} /></div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">Your money</p>
                  <p className="text-4xl sm:text-5xl font-black text-white leading-none mt-1">{formatCurrency(portfolio?.totalValue ?? 100000)}</p>
                  <p className={`text-base font-bold ${gainCls(pnl)} mt-1.5`}>{up ? '▲' : '▼'} {up ? '+' : ''}{formatCurrency(pnl)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)</p>
                  <p className="text-sm text-gray-400 mt-1.5">{take}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2.5 lg:w-[440px] shrink-0">
                <StatTile label="Cash to spend" value={formatCurrency(cash)} cls="text-blue-600 dark:text-blue-400" />
                <StatTile label="Total return" value={`${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%`} cls={gainCls(pnl)} />
                <StatTile label="Your rank" value={myRank ? `#${myRank}` : '—'} cls="text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          {/* ── Two-column dashboard ── */}
          <div className="grid lg:grid-cols-5 gap-5 items-start">
            {/* Buy (main) */}
            <div className="lg:col-span-3">
              <Section title="Buy a stock">
                <p className="text-sm text-gray-500 -mt-2 mb-4">Not sure what to buy? Search, pick a category, or tap any company — Mr. Guy explains each one.</p>
                {/* Prominent search bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search any company or ticker…"
                    className="w-full pl-11 pr-4 h-12 rounded-2xl bg-gray-800/60 border-2 border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500" />
                </div>

                {query.length >= 2 ? (
                  <div className="space-y-1.5">
                    {results.length === 0 ? <p className="text-sm text-gray-500 text-center py-4">No matches — try a company name.</p> : results.map((r) => (
                      <button key={r.ticker} onClick={() => openBuy(r.ticker, r.name)} className="w-full text-left px-3 py-2.5 rounded-xl bg-gray-800/40 hover:bg-gray-800 border border-gray-700/50 flex items-center gap-3">
                        <CompanyLogo ticker={r.ticker} size={32} name={r.name} radius={10} />
                        <span className="text-white font-semibold truncate flex-1">{r.name}</span><span className="text-xs text-gray-500 shrink-0">{r.ticker}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Don't know what to buy? helper */}
                    <button onClick={() => { setHelperChoice(null); setHelperOpen(true) }}
                      className="w-full flex items-center gap-3 mb-4 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors text-left">
                      <div className="shrink-0 rounded-lg overflow-hidden"><MrGuyHead px={3} /></div>
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-white">Don’t know what to buy?</p>
                        <p className="text-xs text-gray-400">Answer one quick question — Mr. Guy points you somewhere.</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    </button>
                    {/* Category chips — colour-coded, persistent navigation */}
                    <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1">
                      <button onClick={() => setActiveTheme('all')} className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-bold border transition-colors ${activeTheme === 'all' ? 'bg-blue-600 border-blue-600 text-[#fff]' : 'border-gray-700 text-gray-300 hover:border-gray-500'}`}>All</button>
                      {THEMES.map((t) => {
                        const on = activeTheme === t.id
                        return (
                          <button key={t.id} onClick={() => setActiveTheme(t.id)}
                            style={on ? { background: t.accent, borderColor: t.accent } : undefined}
                            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold border transition-colors ${on ? 'text-[#fff]' : 'border-gray-700 text-gray-300 hover:border-gray-500'}`}>
                            <t.Icon className="h-3.5 w-3.5" style={on ? undefined : { color: t.accent }} /> {t.short}
                          </button>
                        )
                      })}
                    </div>
                    {activeTheme === 'all' ? buyPreview : buyCategory}
                  </>
                )}
              </Section>
            </div>

            {/* Own + Leaderboard (rail) */}
            <div className="lg:col-span-2 space-y-5">
              <Section title="What you own">
                {holdings.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">Nothing yet — tap a company to buy your first stock.</p>
                ) : (
                  <div className="space-y-3">
                    {holdings.map((h) => (
                      <div key={h.ticker} className={`${gainTint(h.gainLoss)} rounded-2xl p-4`}>
                        <div className="flex items-center gap-3">
                          <CompanyLogo ticker={h.ticker} size={48} radius={14} name={h.companyName} />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-white truncate text-base">{h.companyName || h.ticker}</p>
                            <p className="text-xs text-gray-500">{h.ticker} · {h.shares.toFixed(2)} shares</p>
                          </div>
                        </div>
                        <div className={`flex items-center justify-between mt-3 pt-3 border-t ${h.gainLoss >= 0 ? 'border-green-500/20' : 'border-red-500/20'}`}>
                          <div>
                            <span className="font-black text-white text-lg">{formatCurrency(h.currentValue)}</span>
                            <span className={`ml-2 text-sm font-bold ${gainCls(h.gainLoss)}`}>{h.gainLoss >= 0 ? '+' : ''}{h.gainLossPct.toFixed(1)}%</span>
                          </div>
                          <button onClick={() => openSell(h)} className="shrink-0 text-sm font-bold text-red-500 dark:text-red-400 border border-red-500/30 rounded-xl px-4 py-2 hover:bg-red-500/10">
                            Sell
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {leaderboard.length > 0 && (
                <Section title="Leaderboard" action={<span className="text-xs text-gray-500">by profit</span>}>
                  <div className="space-y-1.5">
                    {leaderboard.slice(0, 7).map((e) => (
                      <div key={e.rank} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${e.isMe ? 'bg-blue-500/10 border border-blue-500/30' : ''}`}>
                        <span className="w-5 text-center text-sm font-black text-gray-500">{e.rank}</span>
                        <span className={`flex items-center gap-1.5 flex-1 min-w-0 text-sm font-semibold ${e.isMe ? 'text-blue-600 dark:text-blue-400' : 'text-gray-200'}`}>
                          <span className="truncate">{e.name}{e.isMe && ' (you)'}</span>
                          {e.isPro && <span className="shrink-0 font-mono font-bold text-[9px] uppercase tracking-wide bg-[#ffd23f] text-[#16130a] border border-[#16130a] rounded px-1 py-px leading-none">Pro</span>}
                        </span>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-black ${gainCls(e.gainLoss)}`}>{e.gainLoss >= 0 ? '+' : '-'}{formatCurrency(Math.abs(e.gainLoss))}</p>
                          <p className="text-[10px] text-gray-500 -mt-0.5">{e.gainLossPct >= 0 ? '+' : ''}{e.gainLossPct.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </div>

          {/* ── Community Activity feed ── */}
          {communityTrades.length > 0 && (
            <Section title="What others are trading">
              <div className="space-y-2">
                {communityTrades.map((t, i) => {
                  const isBuy = t.type === 'BUY'
                  const companyName = COMPANIES[t.ticker]?.name || t.ticker
                  const timeAgo = (() => {
                    const diff = Date.now() - new Date(t.executedAt).getTime()
                    const mins = Math.floor(diff / 60_000)
                    if (mins < 2) return 'just now'
                    if (mins < 60) return `${mins}m ago`
                    const hrs = Math.floor(mins / 60)
                    if (hrs < 24) return `${hrs}h ago`
                    return `${Math.floor(hrs / 24)}d ago`
                  })()
                  return (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-800/40">
                      <span className={`shrink-0 text-xs font-black uppercase px-2 py-1 rounded-lg ${isBuy ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                        {isBuy ? 'BUY' : 'SELL'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-200 truncate">
                          <span className={t.isMe ? 'text-blue-400' : ''}>{t.isMe ? 'You' : t.userName}</span>
                          {t.isPro && !t.isMe && <span className="ml-1 font-mono font-bold text-[9px] uppercase tracking-wide bg-[#ffd23f] text-[#16130a] border border-[#16130a] rounded px-1 py-px leading-none">Pro</span>}
                          <span className="text-gray-400 font-normal"> {isBuy ? 'bought' : 'sold'} </span>
                          <span className="text-white">{companyName}</span>
                          <span className="text-gray-400 font-normal"> · {t.ticker}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(t.shares * t.price)} · {timeAgo}</p>
                      </div>
                      <CompanyLogo ticker={t.ticker} size={32} name={companyName} />
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          <p className="text-[11px] text-gray-600 text-center px-4">Virtual money only — not real investing. Prices may be delayed up to 15 minutes.</p>
        </>
      )}

      {/* ── Buy sheet ── */}
      {buyTarget && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => !buying && setBuyTarget(null)}>
          <div className="w-full max-w-sm bg-gray-900 border-2 border-[#16130a] shadow-[4px_4px_0_#16130a] dark:border-gray-700 dark:shadow-none rounded-3xl p-6 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <CompanyLogo ticker={buyTarget.ticker} size={44} name={buyTarget.name} />
                <div><p className="font-black text-white text-lg leading-tight">{buyTarget.name}</p><p className="text-xs text-gray-500">{buyTarget.ticker} · {formatCurrency(buyTarget.price)}</p></div>
              </div>
              <button onClick={() => !buying && setBuyTarget(null)} className="text-gray-500 hover:text-gray-300"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {buyTarget.blurb && (
                <div className="flex items-start gap-2.5 mb-4 bg-blue-500/10 rounded-2xl p-3">
                  <div className="shrink-0 rounded-lg overflow-hidden mt-0.5"><MrGuyHead px={3} /></div>
                  <p className="text-sm text-gray-300 leading-relaxed">{buyTarget.blurb}</p>
                </div>
              )}
              {/* Price chart */}
              <MiniChart ticker={buyTarget.ticker} />
              <ClosedNote market={market} verb="buy" />
              <p className="text-sm text-gray-400 mb-2">How much do you want to invest?</p>
              <div className="grid grid-cols-4 gap-2 mb-2.5">
                {BUY_AMOUNTS.map((a) => (
                  <button key={a} onClick={() => setBuyAmount(a)} disabled={a > cash}
                    className={`py-2.5 rounded-xl font-bold text-sm border-2 transition-all disabled:opacity-30 ${buyAmount === a ? 'border-blue-500 bg-blue-500/15 text-white' : 'border-gray-700 text-gray-300'}`}>
                    ${a >= 1000 ? `${a / 1000}k` : a}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded-xl px-3 mb-3 border-2 border-transparent focus-within:border-blue-500">
                <span className="text-gray-500 font-bold">$</span>
                <input type="number" inputMode="decimal" min={0} value={buyAmount || ''}
                  onChange={(e) => setBuyAmount(Math.max(0, Math.min(cash, parseFloat(e.target.value) || 0)))}
                  placeholder="custom amount"
                  className="flex-1 min-w-0 bg-transparent py-2.5 text-white font-bold focus:outline-none placeholder:font-normal placeholder:text-gray-500" />
              </div>
              <div className="bg-black/5 dark:bg-white/5 rounded-2xl px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-gray-500">You’ll get</span>
                <span className="font-bold text-white">{(buyAmount / buyTarget.price).toFixed(3)} shares</span>
              </div>
            </div>
            <div className="shrink-0 pt-4">
              <button onClick={confirmBuy} disabled={buying || buyAmount > cash || buyAmount <= 0}
                className="w-full bg-blue-600 hover:bg-blue-500 text-[#fff] font-black rounded-2xl py-3.5 flex items-center justify-center gap-2 disabled:opacity-50" style={{ boxShadow: '0 4px 0 #1d4ed8' }}>
                {buying ? <Loader2 className="h-5 w-5 animate-spin" /> : `Buy ${formatCurrency(buyAmount)} of ${buyTarget.name}`}
              </button>
              <p className="text-[11px] text-gray-600 text-center mt-3">Cash to spend: {formatCurrency(cash)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Sell sheet ── */}
      {sellTarget && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => !selling && setSellTarget(null)}>
          <div className="w-full max-w-sm bg-gray-900 border-2 border-[#16130a] shadow-[4px_4px_0_#16130a] dark:border-gray-700 dark:shadow-none rounded-3xl p-6 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <CompanyLogo ticker={sellTarget.ticker} size={44} name={sellTarget.companyName} />
                <div><p className="font-black text-white text-lg leading-tight">{sellTarget.companyName || sellTarget.ticker}</p><p className="text-xs text-gray-500">{sellTarget.ticker} · {formatCurrency(sellTarget.currentPrice)}</p></div>
              </div>
              <button onClick={() => !selling && setSellTarget(null)} className="text-gray-500 hover:text-gray-300"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="bg-black/5 dark:bg-white/5 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between text-sm">
                <span className="text-gray-500">You own</span>
                <span className="font-bold text-white">{sellTarget.shares.toFixed(3)} shares · {formatCurrency(sellTarget.currentValue)} <span className={gainCls(sellTarget.gainLoss)}>({sellTarget.gainLoss >= 0 ? '+' : ''}{sellTarget.gainLossPct.toFixed(1)}%)</span></span>
              </div>
              <ClosedNote market={market} verb="sell" />
              <p className="text-sm text-gray-400 mb-2">How much do you want to sell?</p>
              <div className="grid grid-cols-4 gap-2 mb-2.5">
                {SELL_PCTS.map(([pct, label]) => {
                  const amt = +(sellTarget.currentValue * pct).toFixed(2)
                  const on = Math.abs(sellAmount - amt) < 0.01
                  return (
                    <button key={label} onClick={() => setSellAmount(amt)}
                      className={`py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${on ? 'border-red-500 bg-red-500/15 text-white' : 'border-gray-700 text-gray-300'}`}>
                      {label}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded-xl px-3 mb-3 border-2 border-transparent focus-within:border-red-500">
                <span className="text-gray-500 font-bold">$</span>
                <input type="number" inputMode="decimal" min={0} value={sellAmount ? +sellAmount.toFixed(2) : ''}
                  onChange={(e) => setSellAmount(Math.max(0, Math.min(sellTarget.currentValue, parseFloat(e.target.value) || 0)))}
                  placeholder="custom amount"
                  className="flex-1 min-w-0 bg-transparent py-2.5 text-white font-bold focus:outline-none placeholder:font-normal placeholder:text-gray-500" />
              </div>
              <div className="bg-black/5 dark:bg-white/5 rounded-2xl px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-gray-500">You’ll sell</span>
                <span className="font-bold text-white">{Math.min(sellTarget.shares, sellAmount / sellTarget.currentPrice || 0).toFixed(3)} shares</span>
              </div>
            </div>
            <div className="shrink-0 pt-4">
              <button onClick={confirmSell} disabled={!!selling || sellAmount <= 0}
                className="w-full bg-red-600 hover:bg-red-500 text-[#fff] font-black rounded-2xl py-3.5 flex items-center justify-center gap-2 disabled:opacity-50" style={{ boxShadow: '0 4px 0 #b91c1c' }}>
                {selling ? <Loader2 className="h-5 w-5 animate-spin" /> : sellAmount >= sellTarget.currentValue - 0.01 ? `Sell all of ${sellTarget.companyName || sellTarget.ticker}` : `Sell ${formatCurrency(sellAmount)}`}
              </button>
              <p className="text-[11px] text-gray-600 text-center mt-3">The cash goes straight back to your buying power.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── "Don't know what to buy?" helper ── */}
      {helperOpen && (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setHelperOpen(false)}>
          <div className="w-full max-w-md bg-gray-900 border-2 border-[#16130a] shadow-[4px_4px_0_#16130a] dark:border-gray-700 dark:shadow-none rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0 rounded-lg overflow-hidden"><MrGuyHead px={3} /></div>
                <p className="font-black text-white text-lg leading-tight truncate">{helperChoice ? 'A good place to start' : 'Let’s find your style'}</p>
              </div>
              <button onClick={() => setHelperOpen(false)} className="text-gray-500 hover:text-gray-300 shrink-0"><X className="h-5 w-5" /></button>
            </div>
            {!helperChoice ? (
              <>
                <p className="text-sm text-gray-400 mb-4">Quick question — what sounds more like you? There’s no wrong answer.</p>
                <div className="space-y-2.5">
                  {HELP_OPTIONS.map((o) => (
                    <button key={o.id} onClick={() => setHelperChoice(o.id)}
                      className="w-full text-left flex items-center gap-3 p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-700/60 hover:border-gray-500 transition-colors">
                      <span className="grid place-items-center h-10 w-10 rounded-xl shrink-0" style={{ background: `${accentOf(o.theme)}1f` }}>
                        <o.Icon className="h-5 w-5" style={{ color: accentOf(o.theme) }} />
                      </span>
                      <div className="min-w-0 flex-1"><p className="font-bold text-white">{o.label}</p><p className="text-xs text-gray-500">{o.sub}</p></div>
                      <ChevronRight className="h-4 w-4 text-gray-500 shrink-0" />
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-600 text-center mt-4">A starting point for learning — not financial advice.</p>
              </>
            ) : (() => {
              const o = HELP_OPTIONS.find((x) => x.id === helperChoice)!
              const th = THEMES.find((t) => t.id === o.theme)!
              return (
                <>
                  <div className="rounded-2xl p-3.5 mb-4" style={{ background: `${th.accent}14` }}>
                    <p className="text-sm text-gray-300 leading-relaxed">{o.line}</p>
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">A few to look at</p>
                  <div className="space-y-2 mb-4">{o.picks.map(helperPickCard)}</div>
                  <button onClick={() => { setActiveTheme(o.theme); setHelperOpen(false) }}
                    className="w-full font-black rounded-2xl py-3 text-[#fff] flex items-center justify-center gap-1" style={{ background: th.accent }}>
                    Browse all {th.short} <ChevronRight className="h-4 w-4" />
                  </button>
                  <button onClick={() => setHelperChoice(null)} className="w-full text-sm font-bold text-gray-500 hover:text-gray-300 mt-2 py-1">← Pick a different vibe</button>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
