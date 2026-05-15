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
      <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', fontSize: '12px', maxWidth: '260px', color: '#f9fafb' }}>
        {/* Price section */}
        <div style={{ padding: '12px' }}>
          <p style={{ color: '#9ca3af', marginBottom: '8px', fontWeight: 500 }}>{label}</p>
          <p style={{ color: '#ffffff', fontWeight: 700, fontSize: '13px' }}>Close: ${d.close?.toFixed(2)}</p>
          <div style={{ marginTop: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px' }}>
            <p style={{ color: '#9ca3af' }}>Open: <span style={{ color: '#e5e7eb' }}>${d.open?.toFixed(2)}</span></p>
            <p style={{ color: '#9ca3af' }}>Vol: <span style={{ color: '#e5e7eb' }}>{(d.volume / 1e6).toFixed(1)}M</span></p>
            <p style={{ color: '#4ade80' }}>High: <span style={{ color: '#86efac' }}>${d.high?.toFixed(2)}</span></p>
            <p style={{ color: '#f87171' }}>Low: <span style={{ color: '#fca5a5' }}>${d.low?.toFixed(2)}</span></p>
          </div>
        </div>

        {/* Spike badge */}
        {isSpike && (
          <div style={{
            margin: '0 12px 8px',
            padding: '6px 10px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: spikePercent! > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${spikePercent! > 0 ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}>
            <span style={{ fontSize: '14px' }}>{spikePercent! > 0 ? '⚡' : '⚠️'}</span>
            <span style={{ fontWeight: 700, color: spikePercent! > 0 ? '#4ade80' : '#f87171' }}>
              {spikePercent! > 0 ? '+' : ''}{spikePercent!.toFixed(1)}% move
            </span>
          </div>
        )}

        {/* Related news */}
        {relatedNews.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(55,65,81,0.6)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ color: '#6b7280', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Related News</p>
            {relatedNews.map((item, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <p style={{ color: '#e5e7eb', fontSize: '11px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</p>
                <p style={{ color: '#6b7280', fontSize: '10px' }}>{item.publisher}</p>
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
