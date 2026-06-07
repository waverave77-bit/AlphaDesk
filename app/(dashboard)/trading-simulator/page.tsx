'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Search, X, Trophy } from 'lucide-react'
import { COMPANIES, THEMES, ALL_SIM_TICKERS } from '@/lib/sim-companies'

const MrGuyMascot = dynamic(() => import('@/components/learn/MrGuyMascot'), { ssr: false })
const MrGuyHead = dynamic(() => import('@/components/MrGuyHead'), { ssr: false })
const SimIntro = dynamic(() => import('@/components/game/SimIntro'), { ssr: false })
// NOTE: WhatsHappening (market-pulse learning card) is kept in
// components/game/WhatsHappening.tsx but removed from the page for now.

const BUY_AMOUNTS = [100, 500, 1000, 5000]
const BADGE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#f59e0b', '#ec4899', '#0ea5e9', '#6366f1']

function badgeColor(t: string) { let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return BADGE_COLORS[h % BADGE_COLORS.length] }
function gainCls(n: number) { return n >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' }
async function priceOf(t: string): Promise<{ price: number; name: string } | null> {
  try { const d = await fetch(`/api/stock/${t}`).then((r) => r.json()); return d?.quote?.price ? { price: d.quote.price, name: d.quote.companyName || t } : null } catch { return null }
}

interface Holding { ticker: string; companyName: string; shares: number; avgCost: number; currentPrice: number; currentValue: number; gainLoss: number; gainLossPct: number }
interface LbEntry { rank: number; name: string; gainLossPct: number; isMe: boolean; isMrGuy?: boolean }
type BuyTarget = { ticker: string; name: string; price: number; blurb?: string }

function StatTile({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <div className="bg-black/5 dark:bg-white/5 rounded-2xl px-2 py-3 text-center overflow-hidden">
      <p className={`text-base font-black ${cls} leading-tight whitespace-nowrap`}>{value}</p>
      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mt-1 truncate">{label}</p>
    </div>
  )
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5">
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
  const [portfolio, setPortfolio] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<LbEntry[]>([])
  const [prices, setPrices] = useState<Record<string, number>>({})

  const [buyTarget, setBuyTarget] = useState<BuyTarget | null>(null)
  const [buyAmount, setBuyAmount] = useState(500)
  const [buying, setBuying] = useState(false)
  const [selling, setSelling] = useState<string | null>(null)

  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ ticker: string; name: string }[]>([])

  const fetchPortfolio = async () => { const d = await fetch('/api/virtual').then((r) => r.json()); setPortfolio(d?.error ? null : d); setLoading(false) }
  const fetchLeaderboard = async () => { try { const d = await fetch('/api/virtual/leaderboard?mode=alltime').then((r) => r.json()); setLeaderboard(d.board || []) } catch {} }

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') { setLoading(false); return }
    fetchPortfolio(); fetchLeaderboard()
  }, [status])
  useEffect(() => { ALL_SIM_TICKERS.forEach((ticker) => priceOf(ticker).then((p) => { if (p) setPrices((s) => ({ ...s, [ticker]: p.price })) })) }, [])
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
    setBuyTarget({ ticker, name: known?.name || name || p.name, price: p.price, blurb: known?.blurb }); setShowSearch(false); setQuery('')
  }
  const confirmBuy = async () => {
    if (!buyTarget || buying) return
    setBuying(true)
    const shares = +(buyAmount / buyTarget.price).toFixed(4)
    try {
      const r = await fetch('/api/virtual/trade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticker: buyTarget.ticker, shares, type: 'BUY' }) })
      const d = await r.json(); if (!r.ok) throw new Error(d.error)
      toast({ title: 'Boom — you’re an owner!', description: `You put ${formatCurrency(buyAmount)} into ${buyTarget.name}.` })
      setBuyTarget(null); await fetchPortfolio(); fetchLeaderboard()
    } catch (e: any) { toast({ title: 'Couldn’t buy', description: e.message, variant: 'destructive' }) }
    setBuying(false)
  }
  const sellAll = async (h: Holding) => {
    if (selling) return
    setSelling(h.ticker)
    try {
      const r = await fetch('/api/virtual/trade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticker: h.ticker, shares: h.shares, type: 'SELL' }) })
      const d = await r.json(); if (!r.ok) throw new Error(d.error)
      toast({ title: 'Sold!', description: `You sold all your ${h.companyName || h.ticker}.` })
      await fetchPortfolio(); fetchLeaderboard()
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
        className="text-left bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 hover:border-blue-500/50 rounded-2xl p-3.5 transition-all disabled:opacity-60 hover:-translate-y-0.5 active:translate-y-0">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center text-[#fff] font-black shrink-0" style={{ background: c.color }}>{c.name[0]}</div>
          <div className="min-w-0"><p className="font-bold text-white truncate">{c.name}</p><p className="text-[11px] text-gray-500">{ticker}</p></div>
        </div>
        <p className="text-base font-bold text-gray-300 mt-3">{prices[ticker] ? formatCurrency(prices[ticker]) : '…'}</p>
      </button>
    )
  }
  const buyGrid = (
    <div className="space-y-5">
      {THEMES.map((theme) => (
        <div key={theme.id}>
          <p className="font-black text-white">{theme.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 mb-3 leading-relaxed">{theme.blurb}</p>
          <div className="grid grid-cols-2 gap-3">{theme.tickers.map(companyCard)}</div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-20">
      <SimIntro />
      <h1 className="text-2xl font-black text-white flex items-center gap-2">
        <Trophy className="h-6 w-6 text-yellow-500 dark:text-yellow-400" /> $100K Challenge
      </h1>

      {!session && status !== 'loading' ? (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-10 text-center max-w-xl mx-auto">
          <div className="flex justify-center mb-3"><MrGuyMascot px={3} mood="idle" /></div>
          <p className="text-white font-black text-xl">Get your $100,000 in fake money</p>
          <p className="text-gray-400 text-sm mt-1">Sign up free to invest risk-free and climb the leaderboard.</p>
          <div className="flex gap-3 justify-center mt-5">
            <Link href="/register" className="bg-blue-600 hover:bg-blue-500 text-[#fff] font-bold rounded-2xl px-6 py-3">Sign up free</Link>
            <Link href="/login" className="border border-gray-700 text-gray-200 font-bold rounded-2xl px-6 py-3">Sign in</Link>
          </div>
        </div>
      ) : loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-10 text-center text-gray-500">Loading your money…</div>
      ) : (
        <>
          {/* ── Hero ── */}
          <div className="bg-gray-900 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent border border-gray-800 rounded-3xl p-6">
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
              <Section title="Buy a stock" action={<button onClick={() => setShowSearch((s) => !s)} className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1"><Search className="h-3.5 w-3.5" /> Search all</button>}>
                <p className="text-sm text-gray-500 -mt-2 mb-4">Not sure what to buy? Browse by what you know — tap any company and Mr. Guy explains it.</p>
                {showSearch && (
                  <div className="mb-4">
                    <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search any company or ticker…"
                      className="w-full px-4 h-11 rounded-2xl bg-gray-800/60 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500" />
                    {results.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {results.map((r) => (
                          <button key={r.ticker} onClick={() => openBuy(r.ticker, r.name)} className="w-full text-left px-4 py-2.5 rounded-xl bg-gray-800/40 hover:bg-gray-800 border border-gray-700/50 flex items-center justify-between">
                            <span className="text-white font-semibold truncate">{r.name}</span><span className="text-xs text-gray-500 shrink-0 ml-2">{r.ticker}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {buyGrid}
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
                      <div key={h.ticker} className="bg-black/5 dark:bg-white/5 rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-[#fff] font-black text-lg shrink-0" style={{ background: badgeColor(h.ticker) }}>{(h.companyName || h.ticker)[0]}</div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-white truncate text-base">{h.companyName || h.ticker}</p>
                            <p className="text-xs text-gray-500">{h.ticker} · {h.shares.toFixed(2)} shares</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                          <div>
                            <span className="font-black text-white text-lg">{formatCurrency(h.currentValue)}</span>
                            <span className={`ml-2 text-sm font-bold ${gainCls(h.gainLoss)}`}>{h.gainLoss >= 0 ? '+' : ''}{h.gainLossPct.toFixed(1)}%</span>
                          </div>
                          <button onClick={() => sellAll(h)} disabled={!!selling} className="shrink-0 text-sm font-bold text-red-500 dark:text-red-400 border border-red-500/30 rounded-xl px-4 py-2 hover:bg-red-500/10 disabled:opacity-50">
                            {selling === h.ticker ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sell'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {leaderboard.length > 0 && (
                <Section title="Leaderboard" action={<span className="text-xs text-gray-500">by return</span>}>
                  <div className="space-y-1.5">
                    {leaderboard.slice(0, 7).map((e) => (
                      <div key={e.rank} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${e.isMe ? 'bg-blue-500/10 border border-blue-500/30' : ''}`}>
                        <span className="w-5 text-center text-sm font-black text-gray-500">{e.rank}</span>
                        <span className={`flex-1 truncate text-sm font-semibold ${e.isMe ? 'text-blue-600 dark:text-blue-400' : 'text-gray-200'}`}>{e.name}{e.isMe && ' (you)'}</span>
                        <span className={`text-sm font-black ${gainCls(e.gainLossPct)}`}>{e.gainLossPct >= 0 ? '+' : ''}{e.gainLossPct.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </div>

          <p className="text-[11px] text-gray-600 text-center px-4">Virtual money only — not real investing. Prices may be delayed up to 15 minutes.</p>
        </>
      )}

      {/* ── Buy sheet ── */}
      {buyTarget && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => !buying && setBuyTarget(null)}>
          <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center text-[#fff] font-black" style={{ background: badgeColor(buyTarget.ticker) }}>{buyTarget.name[0]}</div>
                <div><p className="font-black text-white text-lg leading-tight">{buyTarget.name}</p><p className="text-xs text-gray-500">{buyTarget.ticker} · {formatCurrency(buyTarget.price)}</p></div>
              </div>
              <button onClick={() => !buying && setBuyTarget(null)} className="text-gray-500 hover:text-gray-300"><X className="h-5 w-5" /></button>
            </div>
            {buyTarget.blurb && (
              <div className="flex items-start gap-2.5 mb-4 bg-blue-500/10 rounded-2xl p-3">
                <div className="shrink-0 rounded-lg overflow-hidden mt-0.5"><MrGuyHead px={3} /></div>
                <p className="text-sm text-gray-300 leading-relaxed">{buyTarget.blurb}</p>
              </div>
            )}
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
            <div className="bg-black/5 dark:bg-white/5 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between text-sm">
              <span className="text-gray-500">You’ll get</span>
              <span className="font-bold text-white">{(buyAmount / buyTarget.price).toFixed(3)} shares</span>
            </div>
            <button onClick={confirmBuy} disabled={buying || buyAmount > cash || buyAmount <= 0}
              className="w-full bg-blue-600 hover:bg-blue-500 text-[#fff] font-black rounded-2xl py-3.5 flex items-center justify-center gap-2 disabled:opacity-50" style={{ boxShadow: '0 4px 0 #1d4ed8' }}>
              {buying ? <Loader2 className="h-5 w-5 animate-spin" /> : `Buy ${formatCurrency(buyAmount)} of ${buyTarget.name}`}
            </button>
            <p className="text-[11px] text-gray-600 text-center mt-3">Cash to spend: {formatCurrency(cash)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
