'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/hooks/useAdmin'
import {
  Users, DollarSign, Crown, Activity, UserPlus, Brain,
  BarChart3, Globe, TrendingUp, Target, RefreshCw, Wifi,
  GraduationCap, Zap, Shield, ToggleLeft, ToggleRight,
} from 'lucide-react'

// ─── Feature flag metadata ─────────────────────────────────────────────────────

const FLAG_META: Record<string, { label: string; desc: string }> = {
  market_recap:    { label: 'Market Recap Card',    desc: 'Daily AI-generated market summary on the dashboard' },
  floating_chat:   { label: 'Floating Chat Button', desc: 'AI chat bubble fixed to bottom-right of every page' },
  ai_chat_nav:     { label: 'AI Chat Nav Link',     desc: '"✨ AI Chat" item in the top navigation bar' },
  smart_money_nav: { label: 'Smart Money Nav Link', desc: 'Smart Money / Insiders page in the top navigation' },
  game_nav:        { label: '$100K Challenge Nav',  desc: 'The virtual trading game link in the nav' },
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': '🏠 Dashboard',
  '/research': '🔍 Research',
  '/research/[ticker]': '📊 Stock Page',
  '/chat': '💬 Mr. Guy Chat',
  '/hedgefunds': '🏦 Hedge Funds',
  '/insiders': '👤 Insiders',
  '/markets': '📈 Markets',
  '/earnings': '📅 Earnings',
  '/briefing': '📰 Briefing',
  '/bull-vs-bear': '🥊 Bull vs Bear',
  '/report-card': '📋 Report Card',
  '/translator': '📖 Finance Translator',
  '/watchlist': '⭐ Watchlist',
  '/game': '🎮 $100K Challenge',
  '/learn': '📚 Learn',
  '/roast': '🔥 Roast',
  '/hot-take': '🌶️ Hot Take',
  '/spike-summary': '🚀 Spike Summary',
  '/alerts': '🔔 Alerts',
  '/dividends': '💰 Dividends',
  '/quant': '🤖 Quant',
  '/generate-assets': '✨ Generate Assets',
  '/reality-check': '🔍 Reality Check',
  '/upgrade': '⚡ Upgrade',
}

const FEATURE_LABELS: Record<string, string> = {
  'chat': '💬 Mr. Guy Chat',
  'bull-vs-bear': '🥊 Bull vs Bear',
  'report-card': '📋 Report Card',
  'spike-summary': '🚀 Spike Summary',
  'reality-check': '🔍 Reality Check',
  'translator': '📖 Finance Translator',
  'ai-analysis': '🤖 AI Analysis',
  'general': '⚡ General',
  'market-brief': '📰 Market Brief',
  'hot-take': '🌶️ Hot Take',
  'roast': '🔥 Roast',
  'briefing': '📅 Briefing',
}

const GOAL_LABELS: Record<string, string> = {
  portfolio: '💼 Try AI tools',
  learn: '📖 Learn basics',
  markets: '📰 Follow news',
  research: '🔍 Research stocks',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Bar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300 truncate pr-2">{label}</span>
        <span className="text-gray-500 shrink-0">{count.toLocaleString()} · {pct}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; accent?: string
}) {
  return (
    <div className={`bg-gray-900 border rounded-2xl p-5 ${accent ?? 'border-gray-800'}`}>
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-400">{icon}{label}</div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => {
        const pct = Math.max((d.count / max) * 100, d.count > 0 ? 8 : 2)
        const isToday = i === data.length - 1
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className={`w-full rounded-sm transition-all ${isToday ? 'bg-blue-500' : 'bg-gray-700 group-hover:bg-gray-500'}`}
              style={{ height: `${pct}%` }}
            />
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {d.date.slice(5)}: {d.count}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  liveNow: number
  users: {
    total: number; pro: number; free: number
    newToday: number; newThisWeek: number; newThisMonth: number
    conversionRate: string; mrr: string; arr: string
  }
  experienceLevels: { beginner: number; some: number; experienced: number }
  topPagesToday: { page: string; count: number }[]
  aiToday: { feature: string; count: number }[]
  aiAllTime: { feature: string; count: number }[]
  signupsByDay: { date: string; count: number }[]
  goalCounts: Record<string, number>
  onboardingTotal: number
  recentUsers: { email: string; username: string | null; isPro: boolean; experienceLevel: string; createdAt: string; lastActiveAt: string | null }[]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [toggling, setToggling] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  useEffect(() => {
    if (!adminLoading && !isAdmin) router.replace('/dashboard')
  }, [isAdmin, adminLoading])

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/analytics').then(r => r.json()),
      fetch('/api/admin/flags').then(r => r.json()),
    ])
      .then(([analytics, flagData]) => {
        setData(analytics)
        setFlags(flagData)
        setLastRefresh(new Date())
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh live count every 30s
  useEffect(() => {
    const id = setInterval(() => {
      fetch('/api/admin/analytics')
        .then(r => r.json())
        .then(d => { setData(d); setLastRefresh(new Date()) })
        .catch(() => {})
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  const toggleFlag = async (key: string) => {
    const newVal = !flags[key]
    setToggling(key)
    setFlags(prev => ({ ...prev, [key]: newVal }))
    await fetch('/api/admin/flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, enabled: newVal }),
    })
    setToggling(null)
  }

  if (adminLoading) return <div className="flex items-center justify-center h-64"><RefreshCw className="h-6 w-6 text-gray-500 animate-spin" /></div>
  if (!isAdmin) return null

  const totalExp = (data?.experienceLevels.beginner ?? 0) + (data?.experienceLevels.some ?? 0) + (data?.experienceLevels.experienced ?? 0)
  const maxAIToday = data?.aiToday[0]?.count ?? 1
  const maxAIAll = data?.aiAllTime[0]?.count ?? 1
  const maxPage = data?.topPagesToday[0]?.count ?? 1
  const maxGoal = Math.max(...Object.values(data?.goalCounts ?? {}), 1)

  return (
    <div className="space-y-7 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-red-600/15 border border-red-600/20 flex items-center justify-center">
            <Shield className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Last updated: {lastRefresh.toLocaleTimeString()}</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {data && (
        <>
          {/* ── Row 1: Live + User Stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Live Now */}
            <div className="col-span-2 lg:col-span-1 bg-gray-900 border border-green-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-400">
                <Wifi className="h-4 w-4 text-green-400" />
                Live Now
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                </span>
                <p className="text-3xl font-bold text-white">{data.liveNow}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">active in last 5 min</p>
            </div>

            <StatCard icon={<Users className="h-4 w-4" />} label="Total Users" value={data.users.total} sub={`${data.users.free} free · ${data.users.pro} pro`} />
            <StatCard icon={<Crown className="h-4 w-4 text-yellow-400" />} label="Pro Subscribers" value={data.users.pro} sub={`${data.users.conversionRate}% conversion`} accent="border-yellow-500/20" />
            <StatCard icon={<DollarSign className="h-4 w-4 text-green-400" />} label="MRR" value={`$${data.users.mrr}`} sub={`$${data.users.arr} ARR`} accent="border-green-500/20" />
            <StatCard icon={<Activity className="h-4 w-4 text-blue-400" />} label="AI Calls Today" value={data.aiToday.reduce((s, f) => s + f.count, 0)} sub="across all features" accent="border-blue-500/20" />
          </div>

          {/* ── Row 2: Signup Trend + New Users ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-400" />
                Signups — Last 14 Days
              </h2>
              <MiniBarChart data={data.signupsByDay} />
              <div className="flex gap-1 overflow-hidden">
                {data.signupsByDay.map((d, i) => (
                  <p key={i} className={`flex-1 text-center text-[9px] truncate ${i === data.signupsByDay.length - 1 ? 'text-blue-400' : 'text-gray-700'}`}>
                    {d.date.slice(8)}
                  </p>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 content-start">
              <StatCard icon={<UserPlus className="h-4 w-4 text-emerald-400" />} label="New Today" value={data.users.newToday} />
              <StatCard icon={<UserPlus className="h-4 w-4 text-emerald-400" />} label="New This Week" value={data.users.newThisWeek} />
              <StatCard icon={<UserPlus className="h-4 w-4 text-emerald-400" />} label="New This Month" value={data.users.newThisMonth} />
            </div>
          </div>

          {/* ── Row 3: Experience Levels + Onboarding Goals ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-400" />
                Skill Level
                <span className="text-sm font-normal text-gray-500 ml-1">({totalExp} users)</span>
              </h2>
              <div className="space-y-4">
                {[
                  { key: 'beginner',    label: '🌱 Complete Beginner', color: 'bg-green-500' },
                  { key: 'some',        label: '📈 Some Experience',   color: 'bg-blue-500' },
                  { key: 'experienced', label: '🏆 Experienced',       color: 'bg-purple-500' },
                ].map(({ key, label, color }) => (
                  <Bar key={key} label={label} count={data.experienceLevels[key as keyof typeof data.experienceLevels]} max={totalExp} color={color} />
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-400" />
                Why Users Signed Up
                <span className="text-sm font-normal text-gray-500 ml-1">({data.onboardingTotal} responses)</span>
              </h2>
              <div className="space-y-4">
                {Object.entries(GOAL_LABELS)
                  .sort((a, b) => (data.goalCounts[b[0]] ?? 0) - (data.goalCounts[a[0]] ?? 0))
                  .map(([id, label]) => (
                    <Bar key={id} label={label} count={data.goalCounts[id] ?? 0} max={maxGoal} color="bg-orange-500" />
                  ))}
              </div>
            </div>
          </div>

          {/* ── Row 4: Most Visited Pages ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-cyan-400" />
              Most Visited Pages Today
              {data.topPagesToday.length === 0 && <span className="text-sm font-normal text-gray-600 ml-2">— no data yet today</span>}
            </h2>
            {data.topPagesToday.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                {data.topPagesToday.map(({ page, count }) => (
                  <Bar key={page} label={PAGE_LABELS[page] ?? page} count={count} max={maxPage} color="bg-cyan-500" />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Page tracking just started — data will appear as users navigate the site.</p>
            )}
          </div>

          {/* ── Row 5: AI Feature Usage ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-400" />
                AI Tool Usage Today
                <span className="text-sm font-normal text-gray-500 ml-1">({data.aiToday.reduce((s, f) => s + f.count, 0)} calls)</span>
              </h2>
              {data.aiToday.length > 0 ? (
                <div className="space-y-3">
                  {data.aiToday.map(({ feature, count }) => (
                    <Bar key={feature} label={FEATURE_LABELS[feature] ?? feature} count={count} max={maxAIToday} color="bg-blue-500" />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No AI calls recorded yet today.</p>
              )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                AI Tool Usage All Time
                <span className="text-sm font-normal text-gray-500 ml-1">({data.aiAllTime.reduce((s, f) => s + f.count, 0).toLocaleString()} total)</span>
              </h2>
              {data.aiAllTime.length > 0 ? (
                <div className="space-y-3">
                  {data.aiAllTime.map(({ feature, count }) => (
                    <Bar key={feature} label={FEATURE_LABELS[feature] ?? feature} count={count} max={maxAIAll} color="bg-yellow-500" />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No AI calls recorded yet.</p>
              )}
            </div>
          </div>

          {/* ── Row 6: Recent Signups ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-400" />
              Recent Signups
            </h2>
            <div className="space-y-2">
              {data.recentUsers.map((u, i) => {
                const isLive = u.lastActiveAt && (Date.now() - new Date(u.lastActiveAt).getTime()) < 5 * 60 * 1000
                const expEmoji = u.experienceLevel === 'experienced' ? '🏆' : u.experienceLevel === 'some' ? '📈' : '🌱'
                return (
                  <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-800/50 border border-gray-700/40">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                          {(u.username?.[0] ?? u.email[0]).toUpperCase()}
                        </div>
                        {isLive && (
                          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-gray-900" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{u.username ?? '—'}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{expEmoji}</span>
                      {u.isPro && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">PRO</span>
                      )}
                      <span className="text-xs text-gray-600">
                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Feature Flags ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ToggleRight className="h-5 w-5 text-blue-400" />
          Feature Flags
        </h2>
        <p className="text-sm text-gray-500">Toggle features on/off for all users instantly.</p>
        <div className="space-y-3 pt-1">
          {Object.entries(FLAG_META).map(([key, meta]) => {
            const enabled = flags[key] ?? true
            return (
              <div key={key} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
                <div>
                  <p className="text-white font-semibold text-sm">{meta.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{meta.desc}</p>
                </div>
                <button onClick={() => toggleFlag(key)} disabled={toggling === key} className="shrink-0 transition-colors">
                  {enabled
                    ? <ToggleRight className="h-8 w-8 text-blue-500 hover:text-blue-400" />
                    : <ToggleLeft  className="h-8 w-8 text-gray-600 hover:text-gray-400" />
                  }
                </button>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
