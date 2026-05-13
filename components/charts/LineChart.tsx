'use client'
import { useState, useEffect } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const RANGES = ['1M', '3M', '1Y', '5Y'] as const
type Range = typeof RANGES[number]

const RANGE_MAP: Record<Range, string> = { '1M': '1m', '3M': '3m', '1Y': '1y', '5Y': '5y' }

interface Props { ticker: string; height?: number }

export default function LineChart({ ticker, height = 400 }: Props) {
  const [range, setRange] = useState<Range>('3M')
  const [data, setData] = useState<{ date: string; close: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/stock/${ticker}/history?range=${RANGE_MAP[range]}`)
      .then(r => r.json())
      .then(d => {
        const arr = (d.history || []).map((p: any) => ({
          date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          close: parseFloat(p.close.toFixed(2)),
        }))
        setData(arr)
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [ticker, range])

  const isUp = data.length >= 2 && data[data.length - 1].close >= data[0].close
  const color = isUp ? '#22c55e' : '#ef4444'
  const min = data.length ? Math.min(...data.map(d => d.close)) * 0.995 : 0
  const max = data.length ? Math.max(...data.map(d => d.close)) * 1.005 : 100

  return (
    <div style={{ height }}>
      {/* Range selector */}
      <div className="flex items-center gap-1 mb-3 px-1">
        {RANGES.map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors',
              range === r ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white')}>
            {r}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton className="w-full" style={{ height: height - 40 }} />
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={height - 48}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false}
              interval={Math.floor(data.length / 6)} />
            <YAxis domain={[min, max]} tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false}
              tickFormatter={v => `$${v.toFixed(0)}`} width={52} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
              labelStyle={{ color: '#9ca3af' }}
              formatter={(v: number) => [`$${v.toFixed(2)}`, 'Price']}
            />
            <Area type="monotone" dataKey="close" stroke={color} strokeWidth={2}
              fill={`url(#grad-${ticker})`} dot={false} activeDot={{ r: 4, fill: color }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
