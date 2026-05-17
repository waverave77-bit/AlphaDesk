'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Search, Star, Calendar, FlaskConical, Globe,
  Activity, Building2, Users, BookOpen, TrendingUp,
  TrendingDown, Sparkles, RefreshCw,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import OnboardingModal from '@/components/OnboardingModal'

// ── helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return { word: 'Good morning', emoji: '☀️' }
  if (h < 17) return { word: 'Good afternoon', emoji: '👋' }
  return { word: 'Good evening', emoji: '🌙' }
}

function formatPrice(n: number | null) {
  if (n == null) return '—'
  return n >= 1000
    ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : n.toFixed(2)
}

// ── sub-components ────────────────────────────────────────────────────────────

function MarketStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; dot: string; text: string }> = {
    'Open':        { bg: 'bg-green-500/10 border-green-500/20',  dot: 'bg-green-400', text: 'text-green-400' },
    'Pre-Market':  { bg: 'bg-yellow-500/10 border-yellow-500/20', dot: 'bg-yellow-400', text: 'text-yellow-400' },
    'After Hours': { bg: 'bg-blue-500/10 border-blue-500/20',    dot: 'bg-blue-400',   text: 'text-blue-400' },
    'Weekend':     { bg: 'bg-gray-500/10 border-gray-600',       dot: 'bg-gray-500',   text: 'text-gray-400' },
    'Closed':      { bg: 'bg-gray-500/10 border-gray-600',       dot: 'bg-gray-500',   text: 'text-gray-400' },
  }
  const c = cfg[status] ?? cfg['Closed']
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', c.bg, c.text)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
      {status}
    </span>
  )
}

function IndexCard({ label, price, change, changePercent }: {
  label: string; price: number | null; change: number | null; changePercent: number | null
}) {
  const pos = (changePercent ?? 0) >= 0
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
      <span className="text-sm text-gray-400 font-medium">{label}</span>
      <div className="text-right">
        <p className="text-sm font-semibold text-white">{formatPrice(price)}</p>
        {changePercent != null && (
          <p className={cn('text-xs font-medium', pos ? 'text-green-400' : 'text-red-400')}>
            {pos ? '+' : ''}{changePercent.toFixed(2)}%
          </p>
        )}
      </div>
    </div>
  )
}

const QUICK_LINKS = [
  { href: '/research',   label: 'Research',     icon: Search,    desc: 'Deep-dive any stock' },
  { href: '/watchlist',  label: 'Watchlist',    icon: Star,      desc: 'Stocks you\'re tracking' },
  { href: '/earnings',   label: 'Earnings',     icon: Calendar,  desc: 'Upcoming earnings dates' },
  { href: '/hedgefunds', label: 'Hedge Funds',  icon: Building2, desc: 'Where big money is going' },
  { href: '/insiders',   label: 'Smart Money',  icon: Users,     desc: 'Insider & congress trades' },
  { href: '/macro',      label: 'Macro',        icon: Globe,     desc: 'Big-picture economics' },
  { href: '/markets',    label: 'Markets',      icon: Activity,  desc: 'Market overview' },
  { href: '/quant',      label: 'Quant',        icon: FlaskConical, desc: 'Screen stocks systematically' },
  { href: '/learn',      label: 'Dictionary',   icon: BookOpen,  desc: 'Plain-English finance terms' },
]

// ── page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession()
  const { word: greeting, emoji } = getGreeting()

  // First name only, capitalised
  const firstName = session?.user?.name
    ? session.user.name.split(' ')[0]
    : null

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  // Market brief
  const [brief, setBrief] = useState<{ text: string; status: string } | null>(null)
  const [briefLoading, setBriefLoading] = useState(true)

  // Watchlist
  const [watchlist, setWatchlist] = useState<{ ticker: string; price: number | null; changePercent: number | null }[]>([])
  const [watchLoading, setWatchLoading] = useState(true)

  // Indices
  const [indices, setIndices] = useState<{ label: string; price: number | null; change: number | null; changePercent: number | null }[]>([])
  const [indicesLoading, setIndicesLoading] = useState(true)

  // Fetch everything in parallel on mount
  useEffect(() => {
    // Market brief
    fetch('/api/market-brief')
      .then(r => r.json())
      .then(d => setBrief({ text: d.text, status: d.status }))
      .catch(() => setBrief({ text: '', status: 'Closed' }))
      .finally(() => setBriefLoading(false))

    // Indices
    fetch('/api/market-indices')
      .then(r => r.json())
      .then(d => setIndices(d.indices ?? []))
      .catch(() => {})
      .finally(() => setIndicesLoading(false))

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
  }, [])

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <OnboardingModal />

      {/* ── Hero greeting ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            {greeting}{firstName ? `, ${firstName}` : ''} {emoji}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">{today}</p>
        </div>
        {brief && <MarketStatusBadge status={brief.status} />}
      </div>

      {/* ── AI Market Brief ───────────────────────────────────────── */}
      <Card className="border-gray-800 bg-gray-900/60">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-semibold text-blue-400 uppercase tracking-wide">
              {brief?.status === 'Weekend' ? 'Weekend Brief' : "Today's Market Brief"}
            </span>
          </div>
          {briefLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          ) : brief?.text ? (
            <p className="text-gray-200 leading-relaxed text-[15px]">{brief.text}</p>
          ) : (
            <p className="text-gray-500 text-sm">Could not load market brief right now.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Watchlist + Indices ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Watchlist */}
        <Card className="border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">My Watchlist</p>
              <Link href="/watchlist" className="text-xs text-blue-400 hover:underline">View all</Link>
            </div>
            {watchLoading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : watchlist.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-gray-500 text-sm">No stocks on your watchlist yet.</p>
                <Link href="/research" className="text-blue-400 text-sm hover:underline mt-1 inline-block">
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
                      className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0 hover:bg-gray-800/40 -mx-2 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {pos
                          ? <TrendingUp className="h-3.5 w-3.5 text-green-400 shrink-0" />
                          : <TrendingDown className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        }
                        <span className="text-sm font-bold text-white">{ticker}</span>
                      </div>
                      <div className="text-right">
                        {price != null && (
                          <p className="text-sm font-semibold text-white">${formatPrice(price)}</p>
                        )}
                        {changePercent != null && (
                          <p className={cn('text-xs font-medium', pos ? 'text-green-400' : 'text-red-400')}>
                            {pos ? '+' : ''}{changePercent.toFixed(2)}%
                          </p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Market Indices */}
        <Card className="border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Market Indices</p>
              <Link href="/markets" className="text-xs text-blue-400 hover:underline">Full view</Link>
            </div>
            {indicesLoading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              indices.map(idx => <IndexCard key={idx.label} {...idx} />)
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Quick Links ───────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Access</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {QUICK_LINKS.map(({ href, label, icon: Icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex items-start gap-3 p-4 rounded-xl border border-gray-800 bg-gray-900/40 hover:bg-gray-800/60 hover:border-gray-700 transition-all group"
            >
              <div className="p-2 rounded-lg bg-gray-800 group-hover:bg-gray-700 transition-colors shrink-0">
                <Icon className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-700 text-center">
        For informational purposes only. Not financial advice.
      </p>
    </div>
  )
}
