'use client'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function formatPrice(n: number | null) {
  if (n == null) return '—'
  return n >= 1000
    ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : n.toFixed(2)
}

const FAMOUS_DATES = [
  { label: 'Black Monday', date: '1987-10-19' },
  { label: 'Dotcom Crash', date: '2000-03-10' },
  { label: '9/11', date: '2001-09-17' },
  { label: 'Lehman Collapse', date: '2008-09-15' },
  { label: 'COVID Crash', date: '2020-03-16' },
  { label: 'Meme Stock Squeeze', date: '2021-01-27' },
  { label: 'FTX Collapse', date: '2022-11-09' },
  { label: 'Rate Hike Panic', date: '2022-06-13' },
]

interface IndexResult {
  label: string
  price: number | null
  change: number | null
  changePercent: number | null
  date: string | null
}

interface TimeMachineResult {
  indices: IndexResult[]
  brief: string
}

export default function TimeMachinePage() {
  const [selectedDate, setSelectedDate] = useState('')
  const [result, setResult] = useState<TimeMachineResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [traveledDate, setTraveledDate] = useState('')

  const travel = async (date: string) => {
    if (!date) return
    setLoading(true)
    setError('')
    setResult(null)
    setTraveledDate(date)
    try {
      const res = await fetch(`/api/time-machine?date=${date}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (e) {
      setError('Could not load data for this date. Try another date.')
    }
    setLoading(false)
  }

  const overallSentiment = result
    ? result.indices.filter(i => i.label !== 'VIX').reduce((sum, i) => sum + (i.changePercent ?? 0), 0)
    : 0

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="text-center space-y-3 pt-4">
        <div className="text-6xl">⏰</div>
        <h1 className="text-4xl font-bold text-white">Time Machine</h1>
        <p className="text-gray-400 text-sm">Travel back to any date and see what Mr. Guy was feeling about the markets.</p>
      </div>

      {/* Date picker */}
      <Card className="border-gray-800 bg-gray-900/60">
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-3 items-center">
            <input
              type="date"
              value={selectedDate}
              max={new Date(Date.now() - 86400000).toISOString().split('T')[0]}
              min="1970-01-02"
              onChange={e => setSelectedDate(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
            />
            <button
              onClick={() => travel(selectedDate)}
              disabled={!selectedDate || loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-colors"
            >
              {loading ? 'Traveling...' : '🚀 Go'}
            </button>
          </div>

          {/* Famous dates */}
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Famous market moments</p>
            <div className="flex flex-wrap gap-2">
              {FAMOUS_DATES.map(({ label, date }) => (
                <button
                  key={date}
                  onClick={() => { setSelectedDate(date); travel(date) }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white transition-all"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Card className="border-gray-800 bg-gray-900/60">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl animate-spin">⏳</span>
              <p className="text-white font-semibold">Spinning up the flux capacitor...</p>
            </div>
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-900 bg-red-950/40">
          <CardContent className="p-6">
            <p className="text-red-400 text-sm">🧑‍💼 {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Date banner */}
          <div className={cn(
            'rounded-2xl p-4 border text-center',
            overallSentiment >= 0
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          )}>
            <p className="text-lg font-bold">
              {overallSentiment >= 0 ? '📈' : '📉'} {result.indices[0]?.date ?? traveledDate}
            </p>
            <p className="text-sm opacity-70 mt-0.5">
              {overallSentiment >= 0 ? 'Markets were green — Mr. Guy was partying.' : 'Markets were red — Mr. Guy was not okay.'}
            </p>
          </div>

          {/* Index cards */}
          <Card className="border-gray-800 bg-gray-900/60">
            <CardContent className="p-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-4">Market Snapshot</p>
              {result.indices.map(idx => {
                const pos = (idx.changePercent ?? 0) >= 0
                return (
                  <div key={idx.label} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                    <span className="text-sm text-gray-400 font-medium">{idx.label}</span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{formatPrice(idx.price)}</p>
                      {idx.changePercent != null && (
                        <p className={cn('text-xs font-medium', pos ? 'text-green-400' : 'text-red-400')}>
                          {pos ? '+' : ''}{idx.changePercent.toFixed(2)}%
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Mr. Guy's take */}
          {result.brief && (
            <Card className="border-gray-800 bg-gray-900/60">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🧑‍💼</span>
                  <span className="text-sm font-semibold text-blue-400 uppercase tracking-wide">Mr. Guy&apos;s Take</span>
                </div>
                <p className="text-gray-200 leading-relaxed text-[15px]">{result.brief}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
