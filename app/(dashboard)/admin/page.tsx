'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/hooks/useAdmin'
import { Shield, Users, ToggleLeft, ToggleRight, RefreshCw, TrendingUp, Target } from 'lucide-react'

const FLAG_META: Record<string, { label: string; desc: string }> = {
  market_recap:    { label: 'Market Recap Card',   desc: 'Daily AI-generated market summary on the dashboard' },
  floating_chat:   { label: 'Floating Chat Button', desc: 'The AI chat bubble fixed to the bottom-right of every page' },
  ai_chat_nav:     { label: 'AI Chat Nav Link',     desc: '"✨ AI Chat" item in the top navigation bar' },
  smart_money_nav: { label: 'Smart Money Nav Link', desc: 'Smart Money / Insiders page in the top navigation' },
  game_nav:        { label: '$100K Challenge Nav',  desc: 'The virtual trading game link in the nav' },
}

interface Stats {
  total: number
  experienceCounts: Record<string, number>
  goalCounts: Record<string, number>
}

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

function Bar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400">{count} · {pct}%</span>
      </div>
      <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const router = useRouter()

  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [toggling, setToggling] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (!adminLoading && !isAdmin) router.replace('/dashboard')
  }, [isAdmin, adminLoading])

  useEffect(() => {
    fetch('/api/admin/flags').then(r => r.json()).then(setFlags)
    fetch('/api/onboarding').then(r => r.json()).then(setStats).finally(() => setStatsLoading(false))
  }, [])

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

  return (
    <div className="space-y-7 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-red-600/15 border border-red-600/20 flex items-center justify-center">
          <Shield className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 text-base mt-0.5">Only visible to waverave77@gmail.com</p>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ToggleRight className="h-5 w-5 text-blue-400" /> Feature Flags
        </h2>
        <p className="text-sm text-gray-500">Toggle features on/off for all users instantly. Changes take effect on next page load.</p>
        <div className="space-y-3 pt-1">
          {Object.entries(FLAG_META).map(([key, meta]) => {
            const enabled = flags[key] ?? true
            return (
              <div key={key} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
                <div>
                  <p className="text-white font-semibold text-sm">{meta.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{meta.desc}</p>
                </div>
                <button
                  onClick={() => toggle(key)}
                  disabled={toggling === key}
                  className="shrink-0 transition-colors"
                >
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

      {/* Onboarding Stats */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-400" /> Onboarding Responses
          {stats && <span className="text-sm font-normal text-gray-500 ml-1">({stats.total} total)</span>}
        </h2>

        {statsLoading && <div className="h-32 bg-gray-800 rounded-xl animate-pulse" />}

        {stats && !statsLoading && stats.total === 0 && (
          <p className="text-gray-500 text-sm">No responses yet.</p>
        )}

        {stats && !statsLoading && stats.total > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-400 flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> Experience Level</p>
              {Object.entries(EXPERIENCE_LABELS).map(([id, label]) => (
                <Bar key={id} label={label} count={stats.experienceCounts[id] ?? 0} total={stats.total} color="bg-green-500" />
              ))}
            </div>
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-400 flex items-center gap-1.5"><Target className="h-4 w-4" /> Goals (multi-select)</p>
              {Object.entries(GOAL_LABELS)
                .sort((a, b) => (stats.goalCounts[b[0]] ?? 0) - (stats.goalCounts[a[0]] ?? 0))
                .map(([id, label]) => (
                  <Bar key={id} label={label} count={stats.goalCounts[id] ?? 0} total={stats.total} color="bg-blue-500" />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
