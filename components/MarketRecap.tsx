'use client'
import { useEffect, useState } from 'react'
import { Sparkles, RefreshCw, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function MarketRecap() {
  const [recap, setRecap] = useState<string | null>(null)
  const [fearGreed, setFearGreed] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (force = false) => {
    if (force) setRefreshing(true)
    try {
      const res = await fetch('/api/market-recap' + (force ? '?refresh=1' : ''), { cache: 'no-store' })
      const d = await res.json()
      setRecap(d.recap)
      setFearGreed(d.fearGreed)
    } catch {
      setRecap('Market recap unavailable right now.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 to-purple-600/5 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Daily Market Recap</p>
            <p className="text-xs text-gray-500">AI-generated · Updates hourly</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {fearGreed && (
            <div className="flex items-center gap-1.5 bg-gray-800/60 rounded-lg px-2.5 py-1">
              <TrendingUp className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-300 font-medium">F&G: {fearGreed}</span>
            </div>
          )}
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="h-7 w-7 rounded-lg hover:bg-gray-800 flex items-center justify-center transition-colors"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 text-gray-500', refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-4 bg-gray-800 rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-800 rounded animate-pulse w-4/5" />
          <div className="h-4 bg-gray-800 rounded animate-pulse w-3/5" />
        </div>
      ) : (
        <p className="text-sm text-gray-300 leading-relaxed">{recap}</p>
      )}
    </div>
  )
}
