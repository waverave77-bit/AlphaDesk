'use client'
import { useState, useEffect } from 'react'

const RANGES: [string, string][] = [['1w', '1W'], ['1m', '1M'], ['1y', '1Y']]

/** A simple beginner line chart for one stock — clean line, green/red, range toggle. */
export default function MiniChart({ ticker }: { ticker: string }) {
  const [range, setRange] = useState('1m')
  const [pts, setPts] = useState<number[] | null>(null)

  useEffect(() => {
    let cancel = false
    setPts(null)
    fetch(`/api/stock/${ticker}?type=historical&range=${range}`)
      .then((r) => r.json())
      .then((d) => { if (!cancel) setPts(((d.data || []) as any[]).map((x) => x.close).filter((n: number) => n > 0)) })
      .catch(() => { if (!cancel) setPts([]) })
    return () => { cancel = true }
  }, [ticker, range])

  const up = pts && pts.length >= 2 ? pts[pts.length - 1] >= pts[0] : true
  const color = up ? '#22c55e' : '#ef4444'
  const pct = pts && pts.length >= 2 ? ((pts[pts.length - 1] - pts[0]) / pts[0]) * 100 : null

  const W = 300, H = 70
  let line = '', area = ''
  if (pts && pts.length >= 2) {
    const min = Math.min(...pts), max = Math.max(...pts), rng = max - min || 1
    const xy = pts.map((v, i) => [(i / (pts.length - 1)) * W, H - 4 - ((v - min) / rng) * (H - 8)])
    line = xy.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
    area = `0,${H} ` + line + ` ${W},${H}`
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-500">Price · last {range === '1w' ? 'week' : range === '1m' ? 'month' : 'year'}</span>
        {pct !== null && <span className={`text-xs font-bold ${up ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{pct >= 0 ? '+' : ''}{pct.toFixed(1)}%</span>}
      </div>
      <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-2">
        <div className="h-[70px]">
          {pts === null ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-500">Loading chart…</div>
          ) : pts.length < 2 ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-500">Chart unavailable</div>
          ) : (
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`g-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={area} fill={`url(#g-${ticker})`} />
              <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      <div className="flex gap-1.5 mt-2">
        {RANGES.map(([id, label]) => (
          <button key={id} onClick={() => setRange(id)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${range === id ? 'bg-blue-600 text-[#fff]' : 'bg-gray-800/60 text-gray-400 hover:text-gray-200'}`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
