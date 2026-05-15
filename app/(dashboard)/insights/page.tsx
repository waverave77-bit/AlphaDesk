'use client'
import { useEffect, useState } from 'react'
import { Users, TrendingUp, Target, RefreshCw } from 'lucide-react'

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: '🌱 Complete Beginner',
  some: '📈 Some Experience',
  experienced: '🏆 Experienced',
}

const GOAL_LABELS: Record<string, string> = {
  portfolio: '💼 Track my portfolio',
  learn: '📖 Learn investing basics',
  markets: '📰 Follow market news',
  research: '🔍 Research stocks',
}

interface Stats {
  total: number
  experienceCounts: Record<string, number>
  goalCounts: Record<string, number>
}

function Bar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300 font-medium">{label}</span>
        <span className="text-gray-400">{count} ({pct}%)</span>
      </div>
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function InsightsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/onboarding')
      const data = await res.json()
      setStats(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-600/15 border border-purple-600/20 flex items-center justify-center">
            <Users className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">User Insights</h1>
            <p className="text-gray-400 text-base mt-0.5">What users answered during onboarding</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="h-10 px-4 rounded-xl border border-gray-700 text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-900 rounded-2xl animate-pulse border border-gray-800" />)}
        </div>
      )}

      {stats && !loading && (
        <div className="space-y-5">
          {/* Total */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Users className="h-7 w-7 text-blue-400" />
            </div>
            <div>
              <p className="text-4xl font-extrabold text-white">{stats.total}</p>
              <p className="text-gray-400 text-sm mt-0.5">Total onboarding responses</p>
            </div>
          </div>

          {/* Experience breakdown */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <h2 className="text-lg font-bold text-white">Experience Level</h2>
            </div>
            {Object.entries(EXPERIENCE_LABELS).map(([id, label]) => (
              <Bar key={id} label={label} count={stats.experienceCounts[id] ?? 0} total={stats.total} color="bg-green-500" />
            ))}
          </div>

          {/* Goals breakdown */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">What Users Want</h2>
            </div>
            {Object.entries(GOAL_LABELS)
              .sort((a, b) => (stats.goalCounts[b[0]] ?? 0) - (stats.goalCounts[a[0]] ?? 0))
              .map(([id, label]) => (
                <Bar key={id} label={label} count={stats.goalCounts[id] ?? 0} total={stats.total} color="bg-blue-500" />
              ))}
            <p className="text-xs text-gray-600 pt-1">Goal % can exceed 100% since users can pick multiple</p>
          </div>
        </div>
      )}

      {stats?.total === 0 && !loading && (
        <div className="text-center py-16 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No responses yet, users will appear here after completing onboarding.</p>
        </div>
      )}
    </div>
  )
}
