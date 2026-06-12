'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import {
  Search, Star, Calendar, Activity, TrendingUp, TrendingDown,
  Sparkles, ChevronRight, CheckCircle2, Crown, AlertTriangle,
  Loader2, Flame, Trophy, GraduationCap, BookA,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import OnboardingModal from '@/components/OnboardingModal'
import MarketCharacter from '@/components/MarketCharacter'
import MrGuyLogoSvg from '@/components/MrGuyLogoSvg'
import MrGuyHead from '@/components/MrGuyHead'
import { useMarketStatus } from '@/hooks/use-market-status'

const HolidayAtmosphere = dynamic(
  () => import('@/components/HolidayAtmosphere').then(m => ({ default: m.HolidayAtmosphere })),
  { ssr: false }
)

// ── helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return { word: 'Good morning' }
  if (h < 17) return { word: 'Good afternoon' }
  return { word: 'Good evening' }
}

function formatPrice(n: number | null) {
  if (n == null) return '—'
  return n >= 1000
    ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : n.toFixed(2)
}

// ── sub-components ────────────────────────────────────────────────────────────

function MarketStatusBadge({ status }: { status: string }) {
  const isHoliday = status.startsWith('Closed ·')
  const base = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-mono font-bold'
  if (status === 'Open') return (
    <span className={`${base} border-green-600 bg-green-500/10 text-green-400 shadow-[2px_2px_0_theme(colors.green.700)]`}>
      <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" /> Open
    </span>
  )
  if (status === 'Pre-Market') return (
    <span className={`${base} border-yellow-600 bg-yellow-500/10 text-yellow-400 shadow-[2px_2px_0_theme(colors.yellow.700)]`}>
      <span className="h-2 w-2 rounded-full bg-yellow-400" /> Pre-Market
    </span>
  )
  if (status === 'After Hours') return (
    <span className={`${base} border-blue-600 bg-blue-500/10 text-blue-400 shadow-[2px_2px_0_theme(colors.blue.800)]`}>
      <span className="h-2 w-2 rounded-full bg-blue-400" /> After Hours
    </span>
  )
  const label = isHoliday ? status.replace('Closed · ', '') : status
  return (
    <span className={`${base} border-[#16130a] dark:border-yellow-700 bg-[#ffd23f] dark:bg-yellow-900/30 text-[#16130a] dark:text-yellow-300 shadow-[2px_2px_0_#16130a] dark:shadow-none`}>
      <span className="h-2 w-2 rounded-full bg-[#16130a] dark:bg-yellow-400" /> {label}
    </span>
  )
}

function IndexCard({ label, price, change, changePercent }: {
  label: string; price: number | null; change: number | null; changePercent: number | null
}) {
  const pos = (changePercent ?? 0) >= 0
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#16130a]/10 dark:border-gray-800 last:border-0">
      <span className="text-sm font-mono font-semibold text-[#16130a]/60 dark:text-gray-400">{label}</span>
      <div className="text-right">
        <p className="text-sm font-bold text-[#16130a] dark:text-white">{formatPrice(price)}</p>
        {changePercent != null && (
          <p className={cn('text-xs font-semibold', pos ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400')}>
            {pos ? '+' : ''}{changePercent.toFixed(2)}%
          </p>
        )}
      </div>
    </div>
  )
}

// "Go Deeper" research layer — secondary tools for when a beginner graduates.
const QUICK_LINKS = [
  { href: '/research',  label: 'Research a Stock', icon: Search,     desc: 'Look up any company' },
  { href: '/markets',   label: 'Markets',          icon: Activity,   desc: 'Today’s overview' },
  { href: '/earnings',  label: 'Earnings',         icon: Calendar,   desc: 'Upcoming report dates' },
  { href: '/watchlist', label: 'Watchlist',        icon: Star,       desc: 'Stocks you’re tracking' },
  { href: '/dividends', label: 'Dividends',        icon: TrendingUp, desc: 'Who pays you to hold' },
]

const ADMIN_LINKS = [
  { href: '/generate-assets',  label: 'Export Assets',    icon: Sparkles, desc: 'Download Mr. Guy logos & icons' },
  { href: '/holiday-preview',  label: 'Holiday Preview',  icon: Sparkles, desc: 'Preview Mr. Guy holiday animations' },
]

// ── page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session, update: updateSession } = useSession()
  const isPreview = !!(session?.user as any)?.isDemo
  const isAdmin = session?.user?.email === 'waverave77@gmail.com'
  const market = useMarketStatus() // live, timezone-correct market status (not the cached brief)

  // Pro upgrade banner — shown when redirected back from Stripe with ?upgraded=1
  const [showVerifiedBanner, setShowVerifiedBanner] = useState(false)
  const [showUpgradedBanner, setShowUpgradedBanner] = useState(false)
  const [upgradeVerified, setUpgradeVerified] = useState<boolean | null>(null) // null=checking, true=confirmed, false=failed
  useEffect(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    // Activate the guided tour (GuidedTour component in layout reads from localStorage)
    if (params?.get('tour') === '1') {
      localStorage.setItem('zg_guided_tour_active', '1')
      localStorage.setItem('zg_guided_tour_step', '0')
      window.history.replaceState({}, '', '/dashboard')
    }
    if (params?.get('verified') === '1') {
      setShowVerifiedBanner(true)
      window.history.replaceState({}, '', '/dashboard')
      updateSession()
    }
    const isUpgrade = params?.get('upgraded') === '1'
    const sessionId = params?.get('session_id') ?? ''
    if (!isUpgrade) return

    setShowUpgradedBanner(true)
    window.history.replaceState({}, '', '/dashboard')

    const activate = async () => {
      // Primary path: verify directly with Stripe using the checkout session ID
      // This works even if the webhook hasn't fired yet
      if (sessionId) {
        try {
          const res = await fetch('/api/stripe/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          })
          const data = await res.json()
          if (res.ok && data.isPro) {
            setUpgradeVerified(true)
            updateSession()
            return
          }
        } catch {}
      }

      // Fallback: poll /api/user/pro in case webhook beat us to it
      let attempts = 0
      const poll = async () => {
        attempts++
        const res = await fetch('/api/user/pro').catch(() => null)
        const data = await res?.json().catch(() => null)
        if (data?.isPro) {
          setUpgradeVerified(true)
          updateSession()
          return
        }
        if (attempts < 5) setTimeout(poll, 3000)
        else setUpgradeVerified(false)
      }
      setTimeout(poll, 2000)
    }

    activate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Defer greeting + date to client to avoid hydration mismatch
  const [{ word: greeting }, setGreeting] = useState<{ word: string }>({ word: 'Good morning' })
  const [today, setToday] = useState('')
  useEffect(() => {
    setGreeting(getGreeting())
    setToday(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))
  }, [])

  // Prefer the username (the handle the user actually sets) over the legacy `name`.
  const displayName = (session?.user as any)?.username || session?.user?.name
  const firstName = displayName ? String(displayName).split(' ')[0] : null

  // Market brief
  const [brief, setBrief] = useState<{ text: string; status: string } | null>(null)
  const [briefLoading, setBriefLoading] = useState(true)

  // Watchlist
  const [watchlist, setWatchlist] = useState<{ ticker: string; price: number | null; changePercent: number | null }[]>([])
  const [watchLoading, setWatchLoading] = useState(true)

  // Indices
  const [indices, setIndices] = useState<{ label: string; price: number | null; change: number | null; changePercent: number | null }[]>([])
  const [indicesLoading, setIndicesLoading] = useState(true)

  // Fear & Greed
  const [fearGreed, setFearGreed] = useState<{ score: number; rating: string; vix: number | null; spChange: number | null } | null>(null)

  // Roast
  const [roast, setRoast] = useState<string | null>(null)
  const [roasting, setRoasting] = useState(false)

  const getRoast = async () => {
    if (!watchlist.length || roasting) return
    setRoasting(true)
    setRoast(null)
    const tickers = watchlist
      .map(w => `${w.ticker} ${w.changePercent != null ? (w.changePercent >= 0 ? '+' : '') + w.changePercent.toFixed(1) + '%' : ''}`)
      .join(', ')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `You are Mr. Guy, a sarcastic but loveable pixel-art financial mascot. Roast this watchlist in exactly 2-3 sentences. Be funny and a little brutal but keep it light-hearted. Watchlist: ${tickers}. If it's mostly green say something envious. If mostly red be sympathetic but roast them anyway.`,
          history: [],
          experience: typeof window !== 'undefined' ? (localStorage.getItem('zg_experience') ?? 'beginner') : 'beginner',
        }),
      })
      if (!res.ok || !res.body) { setRoast("I tried to roast your portfolio but even I felt bad about it."); setRoasting(false); return }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setRoast(fullText)
      }
    } catch {
      setRoast("I tried to roast your portfolio but even I felt bad about it.")
    }
    setRoasting(false)
  }


  // Fetch everything in parallel on mount
  useEffect(() => {
    // Market brief
    fetch('/api/market-brief')
      .then(r => r.json())
      .then(d => setBrief({ text: d.text, status: d.status }))
      .catch(() => setBrief({ text: '', status: 'Closed' }))
      .finally(() => setBriefLoading(false))

    // Indices — fetch once now, then auto-refresh every 60s during market hours
    const fetchIndices = () =>
      fetch('/api/market-indices')
        .then(r => r.json())
        .then(d => setIndices(d.indices ?? []))
        .catch(() => {})
        .finally(() => setIndicesLoading(false))

    fetchIndices()

    // Refresh every 60s while market is open (9:30am–4pm ET Mon–Fri)
    const indicesTimer = setInterval(() => {
      const now = new Date()
      const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
      const day = et.getDay()
      const mins = et.getHours() * 60 + et.getMinutes()
      const isOpen = day >= 1 && day <= 5 && mins >= 570 && mins < 960
      if (isOpen) fetchIndices()
    }, 60_000)

    // Fear & Greed index (VIX + S&P momentum composite)
    fetch('/api/fear-greed')
      .then(r => r.json())
      .then(d => setFearGreed({ score: d.score, rating: d.rating, vix: d.vix, spChange: d.spChange }))
      .catch(() => {})

    // Watchlist tickers, then prices
    fetch('/api/watchlist')
      .then(r => r.json())
      .then(async (d) => {
        const items: { ticker: string }[] = d.items ?? []
        if (!items.length) { setWatchlist([]); setWatchLoading(false); return }

        const quotes = await Promise.allSettled(
          items.slice(0, 8).map(({ ticker }) =>
            fetch(`/api/stock/${ticker}?type=quote`).then(r => r.json())
          )
        )
        const enriched = items.slice(0, 8).map((item, i) => {
          const res = quotes[i]
          const q = res.status === 'fulfilled' ? res.value?.quote : null
          return {
            ticker: item.ticker,
            price: q?.price ?? null,
            changePercent: q?.changePercent ?? null,
          }
        })
        setWatchlist(enriched)
        setWatchLoading(false)
      })
      .catch(() => setWatchLoading(false))

    return () => clearInterval(indicesTimer)
  }, [])

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10 relative z-20">
      <OnboardingModal />

      {/* ── Email verified banner ────────────────────────────────── */}
      {showVerifiedBanner && (
        <div className="relative flex items-center gap-3 bg-green-600/10 border border-green-500/30 text-white px-5 py-4 rounded-2xl">
          <CheckCircle2 className="h-6 w-6 text-green-400 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-base text-green-300">Email verified!</p>
            <p className="text-gray-400 text-sm">You now have full access to all free AI features.</p>
          </div>
          <button onClick={() => setShowVerifiedBanner(false)} className="text-gray-500 hover:text-white text-xl font-bold shrink-0">×</button>
        </div>
      )}

      {/* ── Pro upgrade success / failure banner ───────────────── */}
      {showUpgradedBanner && upgradeVerified === null && (
        <div className="relative flex items-center gap-3 bg-gradient-to-r from-blue-600/80 to-blue-500/80 text-[#fff] px-5 py-4 rounded-2xl shadow-lg">
          <Loader2 className="h-6 w-6 animate-spin shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-base">Activating Pro…</p>
            <p className="text-blue-100 text-sm">Payment received! Confirming your upgrade now…</p>
          </div>
        </div>
      )}
      {showUpgradedBanner && upgradeVerified === true && (
        <div className="relative flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 text-[#fff] px-5 py-4 rounded-2xl shadow-lg">
          <Crown className="h-6 w-6 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-base">Welcome to Pro!</p>
            <p className="text-blue-100 text-sm">You now have unlimited AI features. Enjoy the upgrade!</p>
          </div>
          <button
            onClick={() => setShowUpgradedBanner(false)}
            className="text-blue-200 hover:text-white text-xl font-bold leading-none shrink-0"
          >
            ×
          </button>
        </div>
      )}
      {showUpgradedBanner && upgradeVerified === false && (
        <div className="relative flex items-center gap-3 bg-red-600/10 border border-red-500/30 text-white px-5 py-4 rounded-2xl shadow-lg">
          <AlertTriangle className="h-6 w-6 text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-base text-red-300">Payment received, but Pro activation delayed</p>
            <p className="text-gray-400 text-sm">Your card was charged, but we couldn&apos;t confirm the upgrade yet. Please sign out and back in, or contact support. Your access will be granted — this is a sync issue.</p>
          </div>
          <button
            onClick={() => setShowUpgradedBanner(false)}
            className="text-gray-400 hover:text-white text-xl font-bold leading-none shrink-0"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Holiday atmosphere (background effects) ─────────── */}
      {market?.status === 'holiday' && (
        <HolidayAtmosphere holiday={market.label.replace('Closed · ', '')} />
      )}

      {/* ── Mr. Guy character ────────────────────────────────── */}
      <MarketCharacter
        changePercent={fearGreed?.spChange ?? indices[0]?.changePercent ?? 0}
        marketState={(() => {
          const s = market?.status
          if (s === 'weekend' || s === 'holiday') return 'closed'
          if (s !== 'open') return 'neutral'
          const spx = indices[0]?.changePercent ?? fearGreed?.spChange ?? 0
          if (spx >= 0.5)  return 'bull'
          if (spx <= -0.5) return 'bear'
          return 'neutral'
        })()}
        holidayPreview={market?.status === 'holiday'
          ? market.label.replace('Closed · ', '')
          : undefined}
      />

      {/* ── Hero greeting ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-4xl font-display text-[#16130a] dark:text-white leading-tight">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="font-mono text-sm text-[#16130a]/60 dark:text-gray-400 mt-1">{today}</p>
        </div>
        {market && (
          <div className="flex items-center gap-2">
            <MarketStatusBadge status={market.label} />
          </div>
        )}
      </div>

      {/* ── Jump back in — the fun, action-led hub ─────────────────── */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Today's lesson — primary */}
        <Link href="/learn" className="group rounded-3xl p-6 border-2 border-[#16130a] shadow-[5px_5px_0_#16130a] dark:shadow-none bg-[#2563eb] text-[#fff] flex flex-col min-h-[150px] transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center justify-center h-11 w-11 rounded-xl bg-[#ffd23f] border-2 border-[#16130a]"><GraduationCap className="h-7 w-7 text-[#16130a]" /></span>
            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-auto pt-6">
            <p className="font-display uppercase text-xl leading-tight">Today&apos;s lesson</p>
            <p className="font-mono text-xs mt-1.5 opacity-90">Bite-sized. Five minutes a day.</p>
          </div>
        </Link>
        {/* $100K Challenge — primary */}
        <Link href="/trading-simulator" className="group rounded-3xl p-6 border-2 border-[#16130a] shadow-[5px_5px_0_#16130a] dark:shadow-none bg-[#ffd23f] text-[#16130a] flex flex-col min-h-[150px] transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center justify-center h-11 w-11 rounded-xl bg-[#16130a] border-2 border-[#16130a]"><Trophy className="h-7 w-7 text-[#ffd23f]" /></span>
            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-auto pt-6">
            <p className="font-display uppercase text-xl leading-tight">$100K Challenge</p>
            <p className="font-mono text-xs mt-1.5 opacity-80">Trade real stocks with fake money.</p>
          </div>
        </Link>
      </div>
      {/* secondary launchers */}
      <div className="grid sm:grid-cols-2 gap-4 -mt-4">
        <Link href="/chat" className="group rounded-3xl p-5 border-2 border-[#16130a] shadow-[4px_4px_0_#16130a] dark:border-gray-700 dark:shadow-none bg-white dark:bg-gray-900 flex items-center gap-4 transition-transform hover:-translate-y-0.5">
          <span className="flex items-center justify-center h-11 w-11 rounded-xl bg-[#ff7a59] border-2 border-[#16130a] shrink-0"><MrGuyHead px={3} /></span>
          <div className="flex-1 min-w-0">
            <p className="font-display uppercase text-base text-[#16130a] dark:text-white">Ask Mr. Guy</p>
            <p className="font-mono text-xs text-[#16130a]/60 dark:text-gray-400">Ask anything about a stock or term.</p>
          </div>
          <ChevronRight className="h-5 w-5 text-[#16130a]/40 dark:text-gray-500 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>
        <Link href="/dictionary" className="group rounded-3xl p-5 border-2 border-[#16130a] shadow-[4px_4px_0_#16130a] dark:border-gray-700 dark:shadow-none bg-white dark:bg-gray-900 flex items-center gap-4 transition-transform hover:-translate-y-0.5">
          <span className="flex items-center justify-center h-11 w-11 rounded-xl bg-[#2f9bff] border-2 border-[#16130a] shrink-0"><BookA className="h-7 w-7 text-[#16130a]" /></span>
          <div className="flex-1 min-w-0">
            <p className="font-display uppercase text-base text-[#16130a] dark:text-white">Dictionary</p>
            <p className="font-mono text-xs text-[#16130a]/60 dark:text-gray-400">Look up any confusing word.</p>
          </div>
          <ChevronRight className="h-5 w-5 text-[#16130a]/40 dark:text-gray-500 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>
      </div>

      {/* ── AI Market Brief ───────────────────────────────────────── */}
      <div className="rounded-3xl border-2 border-[#16130a] shadow-[4px_4px_0_#16130a] dark:border-gray-700 dark:shadow-none bg-white dark:bg-gray-900 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 flex items-center justify-center shrink-0">
            <MrGuyLogoSvg px={2} />
          </div>
          <span className="font-display uppercase text-base text-[#16130a] dark:text-white">
            Mr. Guy Market Recap
          </span>
        </div>
        {briefLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        ) : brief?.text ? (
          <p className="text-[#16130a]/80 dark:text-gray-300 leading-relaxed text-[15px]">{brief.text}</p>
        ) : (
          <p className="text-[#16130a]/40 dark:text-gray-500 text-sm">Could not load market brief right now.</p>
        )}
      </div>

      {/* ── Watchlist + Indices ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

        {/* Watchlist */}
        <div data-char-widget className="rounded-3xl border-2 border-[#16130a] shadow-[4px_4px_0_#16130a] dark:border-gray-700 dark:shadow-none bg-white dark:bg-gray-900 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono font-bold text-xs text-[#16130a]/50 dark:text-gray-400 uppercase tracking-widest">My Watchlist</p>
            <div className="flex items-center gap-3">
              <button
                onClick={getRoast}
                disabled={roasting || watchlist.length === 0}
                className="text-xs text-orange-500 hover:text-orange-600 disabled:opacity-40 font-bold transition-colors flex items-center gap-1 font-mono"
              >
                {roasting ? '...' : <><Flame className="h-3.5 w-3.5" /> Roast</>}
              </button>
              <Link href="/watchlist" className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">View all</Link>
            </div>
          </div>
          {watchLoading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : watchlist.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-[#16130a]/40 dark:text-gray-500">No stocks on your watchlist yet.</p>
              <Link href="/research" className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block">
                Search and add some →
              </Link>
            </div>
          ) : (
            <div>
              {watchlist.map(({ ticker, price, changePercent }) => {
                const pos = (changePercent ?? 0) >= 0
                return (
                  <Link
                    key={ticker}
                    href={`/research/${ticker}`}
                    className="flex items-center justify-between py-3 border-b border-[#16130a]/10 dark:border-gray-800 last:border-0 hover:bg-[#16130a]/5 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {pos
                        ? <TrendingUp className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        : <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      }
                      <span className="text-sm font-bold text-[#16130a] dark:text-white">{ticker}</span>
                    </div>
                    <div className="text-right">
                      {price != null && (
                        <p className="text-sm font-semibold text-[#16130a] dark:text-white">${formatPrice(price)}</p>
                      )}
                      {changePercent != null && (
                        <p className={cn('text-xs font-semibold', pos ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400')}>
                          {pos ? '+' : ''}{changePercent.toFixed(2)}%
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
          {roast && (
            <div className="mt-4 pt-4 border-t border-[#16130a]/10 dark:border-gray-800">
              <div className="flex items-start gap-2">
                <div className="shrink-0 mt-0.5"><MrGuyLogoSvg px={2} /></div>
                <p className="text-sm text-orange-500 dark:text-orange-400 leading-relaxed italic">&ldquo;{roast}&rdquo;</p>
              </div>
            </div>
          )}
        </div>

        {/* Market Indices */}
        <div data-char-widget className="rounded-3xl border-2 border-[#16130a] shadow-[4px_4px_0_#16130a] dark:border-gray-700 dark:shadow-none bg-white dark:bg-gray-900 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono font-bold text-xs text-[#16130a]/50 dark:text-gray-400 uppercase tracking-widest">Market Indices</p>
            <Link href="/markets" className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Full view</Link>
          </div>
          <p className="font-mono text-[10px] text-[#16130a]/40 dark:text-gray-500 mb-3">Prices may be delayed up to 15 minutes.</p>
          {indicesLoading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            indices.map(idx => <IndexCard key={idx.label} {...idx} />)
          )}
        </div>
      </div>


      {/* ── Quick Links ───────────────────────────────────────────── */}
      <div>
        <p className="font-mono font-bold text-xs text-[#16130a]/40 dark:text-gray-500 uppercase tracking-widest mb-4">Quick Access</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...QUICK_LINKS, ...(isAdmin ? ADMIN_LINKS : [])].map(({ href, label, icon: Icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex items-start gap-3 p-4 rounded-2xl border-2 border-[#16130a] shadow-[3px_3px_0_#16130a] dark:border-gray-700 dark:shadow-none bg-white dark:bg-gray-900 hover:-translate-y-0.5 transition-transform group"
            >
              <div className="p-2 rounded-xl bg-[#16130a]/8 dark:bg-gray-700/60 shrink-0 group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/15 transition-colors">
                <Icon className="h-4 w-4 text-[#16130a]/60 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-sm text-[#16130a] dark:text-white leading-tight">{label}</p>
                <p className="font-mono text-[11px] text-[#16130a]/50 dark:text-gray-400 mt-1 leading-snug">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <p className="font-mono text-xs text-[#16130a]/40 dark:text-gray-500 text-center">
        For informational purposes only. Not financial advice.
      </p>
    </div>
  )
}
