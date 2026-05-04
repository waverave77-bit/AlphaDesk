'use client'
import { useState, useEffect } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const RANGES = ['1D', '1W', '1M', '3M', '1Y', '5Y'] as const
type Range = (typeof RANGES)[number]

const rangeMap: Record<Range, string> = {
  '1D': '1d', '1W': '1w', '1M': '1m', '3M': '3m', '1Y': '1y', '5Y': '5y',
}

interface DataPoint {
  date: string
  close: number
  open: number
  high: number
  low: number
  volume: number
}

interface StockChartProps {
  ticker: string
  currentPrice: number
  previousClose?: number | null
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as DataPoint
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 shadow-xl text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-semibold">Close: ${d.close?.toFixed(2)}</p>
      <p className="text-gray-400">Open: ${d.open?.toFixed(2)}</p>
      <p className="text-green-400">High: ${d.high?.toFixed(2)}</p>
      <p className="text-red-400">Low: ${d.low?.toFixed(2)}</p>
      <p className="text-gray-500">Vol: {(d.volume / 1e6).toFixed(2)}M</p>
    </div>
  )
}

export default function StockChart({ ticker, currentPrice, previousClose }: StockChartProps) {
  const [range, setRange] = useState<Range>('1M')
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/stock/${ticker}?type=historical&range=${rangeMap[range]}`)
      .then((r) => r.json())
      .then((d) => { setData(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [ticker, range])

  const firstClose = data[0]?.close ?? currentPrice
  const isPositive = data.length > 0 ? data[data.length - 1].close >= firstClose : true
  const color = isPositive ? '#22c55e' : '#ef4444'

  const formatXAxis = (dateStr: string) => {
    try {
      const d = parseISO(dateStr)
      if (range === '1D') return format(d, 'HH:mm')
      if (range === '1W' || range === '1M') return format(d, 'MMM d')
      if (range === '3M' || range === '1Y') return format(d, 'MMM d')
      return format(d, 'MMM yy')
    } catch { return '' }
  }

  const formattedData = data.map((d) => ({
    ...d,
    dateLabel: formatXAxis(d.date),
  }))

  const minVal = Math.min(...data.map((d) => d.low).filter(Boolean)) * 0.998
  const maxVal = Math.max(...data.map((d) => d.high).filter(Boolean)) * 1.002

  return (
    <div className="w-full">
      <div className="flex gap-1 mb-4">
        {RANGES.map((r) => (
          <Button
            key={r}
            size="sm"
            variant={range === r ? 'secondary' : 'ghost'}
            onClick={() => setRange(r)}
            className="text-xs h-7 px-2"
          >
            {r}
          </Button>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">No chart data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={formattedData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="dateLabel"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minVal, maxVal]}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            {previousClose && (
              <ReferenceLine y={previousClose} stroke="#6b7280" strokeDasharray="4 4" strokeOpacity={0.5} />
            )}
            <Area
              type="monotone"
              dataKey="close"
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${ticker})`}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: '#111827', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
