'use client'
import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'

const RANGES: [string, string][] = [['1w', '1W'], ['1m', '1M'], ['1y', '1Y']]
type Pt = { date: string; close: number }

function fmtDate(iso: string, long = false) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', long ? { month: 'short', year: '2-digit' } : { month: 'short', day: 'numeric' })
}
function fmtPrice(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(n < 10 ? 2 : 0)}`
}

/** Beginner line chart for one stock — clean line, green/red, labeled axes, range toggle. */
export default function MiniChart({ ticker }: { ticker: string }) {
  const [range, setRange] = useState('1m')
  const [data, setData] = useState<Pt[] | null>(null)

  useEffect(() => {
    let cancel = false
    setData(null)
    fetch(`/api/stock/${ticker}?type=historical&range=${range}`)
      .then((r) => r.json())
      .then((d) => { if (!cancel) setData(((d.data || []) as any[]).filter((x) => x.close > 0).map((x) => ({ date: x.date, close: x.close }))) })
      .catch(() => { if (!cancel) setData([]) })
    return () => { cancel = true }
  }, [ticker, range])

  const closes = data?.map((p) => p.close) ?? []
  const ok = data && closes.length >= 2
  const up = ok ? closes[closes.length - 1] >= closes[0] : true
  const color = up ? '#22c55e' : '#ef4444'
  const pct = ok ? ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100 : null
  const min = ok ? Math.min(...closes) : 0
  const max = ok ? Math.max(...closes) : 0

  const W = 300, H = 70
  let line = '', area = ''
  if (ok) {
    const rng = max - min || 1
    const xy = closes.map((v, i) => [(i / (closes.length - 1)) * W, H - 4 - ((v - min) / rng) * (H - 8)])
    line = xy.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
    area = `0,${H} ` + line + ` ${W},${H}`
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-500">Price · last {range === '1w' ? 'week' : range === '1m' ? 'month' : 'year'}</span>
        {pct !== null && <span className={`text-xs font-bold ${up ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{pct >= 0 ? '+' : ''}{pct.toFixed(1)}%</span>}
      </div>
      <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-2.5">
        {data === null ? (
          <div className="h-[88px] flex items-center justify-center text-xs text-gray-500">Loading chart…</div>
        ) : !ok ? (
          <div className="h-[88px] flex items-center justify-center text-xs text-gray-500">Chart unavailable</div>
        ) : (
          <div className="flex gap-2">
            {/* Y axis (price) */}
            <div className="flex flex-col justify-between items-end text-[10px] font-semibold text-gray-500 py-0.5 w-10 shrink-0">
              <span>{fmtPrice(max)}</span>
              <span>{fmtPrice((max + min) / 2)}</span>
              <span>{fmtPrice(min)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 70 }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`g-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* faint gridlines */}
                <line x1="0" y1="4" x2={W} y2="4" stroke="currentColor" strokeWidth="0.5" className="text-gray-300 dark:text-gray-700" />
                <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="currentColor" strokeWidth="0.5" className="text-gray-300 dark:text-gray-700" />
                <line x1="0" y1={H - 4} x2={W} y2={H - 4} stroke="currentColor" strokeWidth="0.5" className="text-gray-300 dark:text-gray-700" />
                <polygon points={area} fill={`url(#g-${ticker})`} />
                <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {/* X axis (dates) */}
              <div className="flex justify-between text-[10px] font-semibold text-gray-500 mt-1">
                <span>{fmtDate(data![0].date, range === '1y')}</span>
                <span>{fmtDate(data![data!.length - 1].date, range === '1y')}</span>
              </div>
            </div>
          </div>
        )}
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
