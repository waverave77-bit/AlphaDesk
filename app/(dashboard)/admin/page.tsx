'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/hooks/useAdmin'
import {
  Shield, Users, ToggleLeft, ToggleRight, RefreshCw,
  TrendingUp, Target, DollarSign, Zap, Brain, Crown,
  UserPlus, Activity, BarChart3,
} from 'lucide-react'

// ─── Feature flags ────────────────────────────────────────────────────────────

const FLAG_META: Record<string, { label: string; desc: string }> = {
  market_recap:    { label: 'Market Recap Card',    desc: 'Daily AI-generated market summary on the dashboard' },
  floating_chat:   { label: 'Floating Chat Button', desc: 'AI chat bubble fixed to bottom-right of every page' },
  ai_chat_nav:     { label: 'AI Chat Nav Link',     desc: '"✨ AI Chat" item in the top navigation bar' },
  smart_money_nav: { label: 'Smart Money Nav Link', desc: 'Smart Money / Insiders page in the top navigation' },
  game_nav:        { label: '$100K Challenge Nav',  desc: 'The virtual trading game link in the nav' },
}

// ─── Onboarding labels ────────────────────────────────────────────────────────

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: '🌱 Beginner',
  some: '📈 Some Experience',
  experienced: '🏆 Experienced',
}
const GOAL_LABELS: Record<string, string> = {
  portfolio: '💼 Track portfolio',
  learn: '📖 Learn basics',
  markets: '📰 Follow news',
  research: '🔍 Research stocks',
}

const FEATURE_LABELS: Record<string, string> = {
  'chat': '💬 Mr. Guy Chat',
  'ai-analysis': '🤖 AI Analysis',
  'bull-vs-bear': '🥊 Bull vs Bear',
  'report-card': '📋 Report Card',
  'spike-summary': '📈 Spike Summary',
  'reality-check': '🔍 Reality Check',
  'am-i-dumb': '🤔 Am I Dumb',
  'bs-checker': '🚨 BS Checker',
  'translator': '📖 Translator',
  'general': '⚡ General',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Bar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400">{count} · {pct}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className={`bg-gray-900 border rounded-2xl p-5 ${color}`}>
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-400">
        {icon}{label}
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Metrics {
  users: { total: number; free: number; pro: number; newToday: number; newThisWeek: number; newThisMonth: number; conversionRate: string }
  revenue: { mrr: string; arr: string; proCount: number }
  ai: { totalToday: number; byFeature: { feature: string; count: number }[] }
  recentUsers: { email: string; username: string | null; isPro: boolean; createdAt: string }[]
}

interface OnboardingStats {
  total: number
  experienceCounts: Record<string, number>
  goalCounts: Record<string, number>
}

export default function AdminPage() {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const router = useRouter()

  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [toggling, setToggling] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [onboarding, setOnboarding] = useState<OnboardingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    if (!adminLoading && !isAdmin) router.replace('/dashboard')
  }, [isAdmin, adminLoading])

  const loadData = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/flags').then(r => r.json()),
      fetch('/api/admin/metrics').then(r => r.json()),
      fetch('/api/onboarding').then(r => r.json()),
    ]).then(([f, m, o]) => {
      setFlags(f)
      setMetrics(m)
      setOnboarding(o)
      setLastRefresh(new Date())
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const toggle = async (key: string) => {
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

  if (adminLoading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="h-6 w-6 text-gray-500 animate-spin" />
    </div>
  )
  if (!isAdmin) return null

  const maxAI = metrics?.ai.byFeature[0]?.count ?? 1

  return (
    <div className="space-y-7 max-w-5xl">

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
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Key Metrics ── */}
      {metrics && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label="Total Users"
              value={metrics.users.total}
              sub={`${metrics.users.free} free · ${metrics.users.pro} pro`}
              color="border-gray-800"
            />
            <StatCard
              icon={<DollarSign className="h-4 w-4" />}
              label="MRR"
              value={`$${metrics.revenue.mrr}`}
              sub={`$${metrics.revenue.arr} ARR`}
              color="border-green-500/20"
            />
            <StatCard
              icon={<Crown className="h-4 w-4 text-yellow-400" />}
              label="Pro Users"
              value={metrics.users.pro}
              sub={`${metrics.users.conversionRate}% conversion`}
              color="border-yellow-500/20"
            />
            <StatCard
              icon={<Activity className="h-4 w-4 text-blue-400" />}
              label="AI Calls Today"
              value={metrics.ai.totalToday}
              sub="across all features"
              color="border-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon={<UserPlus className="h-4 w-4 text-emerald-400" />}
              label="New Today"
              value={metrics.users.newToday}
              color="border-gray-800"
            />
            <StatCard
              icon={<UserPlus className="h-4 w-4 text-emerald-400" />}
              label="New This Week"
              value={metrics.users.newThisWeek}
              color="border-gray-800"
            />
            <StatCard
              icon={<UserPlus className="h-4 w-4 text-emerald-400" />}
              label="New This Month"
              value={metrics.users.newThisMonth}
              color="border-gray-800"
            />
          </div>

          {/* ── AI Usage Today ── */}
          {metrics.ai.byFeature.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-400" />
                AI Usage Today
                <span className="text-sm font-normal text-gray-500 ml-1">({metrics.ai.totalToday} total calls)</span>
              </h2>
              <div className="space-y-3">
                {metrics.ai.byFeature.map(({ feature, count }) => (
                  <Bar
                    key={feature}
                    label={FEATURE_LABELS[feature] ?? feature}
                    count={count}
                    total={maxAI}
                    color="bg-blue-500"
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Recent Signups ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-400" />
              Recent Signups
            </h2>
            <div className="space-y-2">
              {metrics.recentUsers.map((u, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-800/50 border border-gray-700/40">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                      {(u.username?.[0] ?? u.email[0]).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{u.username ?? '—'}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {u.isPro && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                        PRO
                      </span>
                    )}
                    <span className="text-xs text-gray-600">{formatDate(u.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Feature Flags ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ToggleRight className="h-5 w-5 text-blue-400" /> Feature Flags
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
                <button onClick={() => toggle(key)} disabled={toggling === key} className="shrink-0 transition-colors">
                  {enabled
                    ? <ToggleRight className="h-8 w-8 text-blue-500 hover:text-blue-400" />
                    : <ToggleLeft className="h-8 w-8 text-gray-600 hover:text-gray-400" />
                  }
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Onboarding Stats ── */}
      {onboarding && onboarding.total > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-400" /> Onboarding Responses
            <span className="text-sm font-normal text-gray-500 ml-1">({onboarding.total} total)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-400 flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> Experience Level</p>
              {Object.entries(EXPERIENCE_LABELS).map(([id, label]) => (
                <Bar key={id} label={label} count={onboarding.experienceCounts[id] ?? 0} total={onboarding.total} color="bg-green-500" />
              ))}
            </div>
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-400 flex items-center gap-1.5"><Target className="h-4 w-4" /> Goals</p>
              {Object.entries(GOAL_LABELS)
                .sort((a, b) => (onboarding.goalCounts[b[0]] ?? 0) - (onboarding.goalCounts[a[0]] ?? 0))
                .map(([id, label]) => (
                  <Bar key={id} label={label} count={onboarding.goalCounts[id] ?? 0} total={onboarding.total} color="bg-blue-500" />
                ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
