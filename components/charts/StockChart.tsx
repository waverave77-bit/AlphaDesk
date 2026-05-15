'use client'
import { useState, useEffect, useMemo } from 'react'
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

interface ChartNewsItem {
  title: string
  link: string
  publisher: string
  providerPublishTime: number // unix seconds
}

interface StockChartProps {
  ticker: string
  currentPrice: number
  previousClose?: number | null
}

// Spike = day with >2% price change from previous close
function computeSpikes(data: DataPoint[]): Map<string, number> {
  const map = new Map<string, number>()
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1].close
    const curr = data[i].close
    if (prev > 0) {
      const pct = (curr - prev) / prev
      if (Math.abs(pct) >= 0.02) map.set(data[i].date, pct * 100)
    }
  }
  return map
}

// Find news items published within ±2 days of a given date string (YYYY-MM-DD)
function findNewsForDate(date: string, news: ChartNewsItem[]): ChartNewsItem[] {
  const target = new Date(date).getTime()
  return news
    .filter((item) => {
      const diff = Math.abs(target - item.providerPublishTime * 1000)
      return diff <= 2 * 24 * 60 * 60 * 1000
    })
    .slice(0, 2)
}

export default function StockChart({ ticker, currentPrice, previousClose }: StockChartProps) {
  const [range, setRange] = useState<Range>('1M')
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [newsItems, setNewsItems] = useState<ChartNewsItem[]>([])

  // Fetch chart data
  useEffect(() => {
    setLoading(true)
    fetch(`/api/stock/${ticker}?type=historical&range=${rangeMap[range]}`)
      .then((r) => r.json())
      .then((d) => { setData(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [ticker, range])

  // Fetch news once per ticker (used for spike correlation)
  useEffect(() => {
    fetch(`/api/news/${ticker}?count=30`)
      .then((r) => r.json())
      .then((d) => setNewsItems(d.news || []))
      .catch(() => {})
  }, [ticker])

  const spikeMap = useMemo(() => computeSpikes(data), [data])

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

  // Custom tooltip — defined inside component to close over spikeMap + newsItems
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0]?.payload as DataPoint & { dateLabel: string }

    const spikePercent = spikeMap.get(d.date)
    const isSpike = spikePercent !== undefined
    const relatedNews = isSpike ? findNewsForDate(d.date, newsItems) : []

    return (
      <div className="rounded-xl border border-gray-700 bg-gray-900/95 shadow-2xl text-xs backdrop-blur-sm max-w-[260px]">
        {/* Price section */}
        <div className="p-3">
          <p className="text-gray-400 mb-2 font-medium">{label}</p>
          <p className="text-white font-bold text-sm">Close: ${d.close?.toFixed(2)}</p>
          <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5">
            <p className="text-gray-400">Open: <span className="text-gray-300">${d.open?.toFixed(2)}</span></p>
            <p className="text-gray-400">Vol: <span className="text-gray-300">{(d.volume / 1e6).toFixed(1)}M</span></p>
            <p className="text-green-400">High: <span className="text-green-300">${d.high?.toFixed(2)}</span></p>
            <p className="text-red-400">Low: <span className="text-red-300">${d.low?.toFixed(2)}</span></p>
          </div>
        </div>

        {/* Spike badge */}
        {isSpike && (
          <div className={`mx-3 mb-2 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 ${
            spikePercent! > 0
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            <span className="text-base leading-none">{spikePercent! > 0 ? '⚡' : '⚠️'}</span>
            <span className={`font-bold text-xs ${spikePercent! > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {spikePercent! > 0 ? '+' : ''}{spikePercent!.toFixed(1)}% move
            </span>
          </div>
        )}

        {/* Related news */}
        {relatedNews.length > 0 && (
          <div className="border-t border-gray-700/60 px-3 py-2.5 space-y-2">
            <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">Related News</p>
            {relatedNews.map((item, i) => (
              <div key={i} className="space-y-0.5">
                <p className="text-gray-200 leading-snug text-[11px] line-clamp-2">{item.title}</p>
                <p className="text-gray-500 text-[10px]">{item.publisher}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Custom dot renderer — only renders a visible dot on spike points
  const renderDot = (dotProps: any) => {
    const { cx, cy, payload } = dotProps
    const spikePercent = spikeMap.get(payload.date)
    if (spikePercent === undefined) return <g key={`dot-${payload.date}`} />

    const isPositiveSpike = spikePercent > 0
    const fill = isPositiveSpike ? '#22c55e' : '#ef4444'
    const ring = isPositiveSpike ? '#16a34a' : '#dc2626'

    return (
      <g key={`spike-${payload.date}`}>
        {/* Outer glow ring */}
        <circle cx={cx} cy={cy} r={8} fill={fill} fillOpacity={0.15} />
        {/* Main dot */}
        <circle cx={cx} cy={cy} r={4.5} fill={fill} stroke="#0f172a" strokeWidth={1.5} />
        {/* Inner highlight */}
        <circle cx={cx} cy={cy} r={2} fill={ring} />
      </g>
    )
  }

  return (
    <div className="w-full">
      {/* Range buttons */}
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

      {/* Spike legend — only show if there are spikes */}
      {spikeMap.size > 0 && (
        <div className="flex items-center gap-1.5 mb-3">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500 opacity-80" />
          <span className="text-xs text-gray-500">Significant price moves (≥2%) — hover for details</span>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">No chart data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={formattedData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              dot={renderDot}
              activeDot={{ r: 5, fill: color, stroke: '#111827', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
