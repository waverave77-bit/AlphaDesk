'use client'
import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { cn } from '@/lib/utils'

type Range = '1w' | '1m' | '1y'
interface Point { date: string; value: number }

function formatDate(dateStr: string, range: Range) {
  const d = new Date(dateStr + 'T12:00:00')
  if (range === '1w') return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  if (range === '1y') return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatCurrency(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const CustomTooltip = ({ active, payload, label, range }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="text-slate-400 mb-1">{formatDate(label, range)}</p>
      <p className="font-bold text-slate-900 text-sm">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export default function PortfolioPerformanceChart() {
  const [range, setRange] = useState<Range>('1m')
  const [points, setPoints] = useState<Point[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/portfolio/performance?range=${range}`)
      .then(r => r.json())
      .then(d => { setPoints(d.points ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [range])

  const firstValue = points[0]?.value ?? 0
  const lastValue = points[points.length - 1]?.value ?? 0
  const change = lastValue - firstValue
  const changePct = firstValue ? (change / firstValue) * 100 : 0
  const isUp = change >= 0
  const lineColor = isUp ? '#3b82f6' : '#ef4444'

  const tickInterval = range === '1w' ? 'preserveStartEnd'
    : Math.max(1, Math.floor(points.length / (range === '1m' ? 6 : 8)))

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Performance</p>
          {!loading && points.length > 0 && (
            <p className={cn('text-sm font-semibold mt-0.5', isUp ? 'text-green-600' : 'text-red-500')}>
              {isUp ? '+' : ''}{formatCurrency(change)} ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
            </p>
          )}
        </div>
        <div className="flex gap-1.5">
          {(['1w', '1m', '1y'] as Range[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                range === r
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              )}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area — light theme */}
      <div className="h-52 bg-white rounded-b-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : points.length < 2 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-sm">Add more holdings to see your chart</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 6, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={d => formatDate(d, range)}
                interval={tickInterval as any}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={v => formatCurrency(v)}
                width={62}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip range={range} />} />
              {firstValue > 0 && (
                <ReferenceLine y={firstValue} stroke="#e2e8f0" strokeDasharray="4 4" />
              )}
              <Area
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2}
                fill="url(#perfGrad)"
                dot={false}
                activeDot={{ r: 4, fill: lineColor, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
