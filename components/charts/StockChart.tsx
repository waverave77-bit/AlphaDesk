'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
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
  providerPublishTime: number
}

interface StockChartProps {
  ticker: string
  currentPrice: number
  previousClose?: number | null
}

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

function findNewsForDate(date: string, news: ChartNewsItem[]): ChartNewsItem[] {
  const target = new Date(date).getTime()
  return news
    .filter((item) => Math.abs(target - item.providerPublishTime * 1000) <= 2 * 86400000)
    .slice(0, 2)
}

export default function StockChart({ ticker, currentPrice, previousClose }: StockChartProps) {
  const [range, setRange] = useState<Range>('1M')
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [newsItems, setNewsItems] = useState<ChartNewsItem[]>([])

  // spike date → AI summary ('loading' | '' | actual text)
  const [spikeSummaries, setSpikeSummaries] = useState<Record<string, string>>({})
  const lastFetchedSpike = useRef<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/stock/${ticker}?type=historical&range=${rangeMap[range]}`)
      .then((r) => r.json())
      .then((d) => { setData(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [ticker, range])

  useEffect(() => {
    fetch(`/api/news/${ticker}?count=30`)
      .then((r) => r.json())
      .then((d) => setNewsItems(d.news || []))
      .catch(() => {})
  }, [ticker])

  const spikeMap = useMemo(() => computeSpikes(data), [data])

  // Fetch AI summary for a spike date (cached — only fetches once per date)
  const fetchSummary = (date: string, pct: number) => {
    if (spikeSummaries[date] !== undefined) return
    setSpikeSummaries(prev => ({ ...prev, [date]: 'loading' }))
    fetch(`/api/spike-summary?ticker=${ticker}&date=${date}&pct=${pct.toFixed(1)}`)
      .then(r => r.json())
      .then(d => setSpikeSummaries(prev => ({ ...prev, [date]: d.summary || '' })))
      .catch(() => setSpikeSummaries(prev => ({ ...prev, [date]: '' })))
  }

  const firstClose = data[0]?.close ?? currentPrice
  const isPositive = data.length > 0 ? data[data.length - 1].close >= firstClose : true
  const color = isPositive ? '#22c55e' : '#ef4444'

  const formatXAxis = (dateStr: string) => {
    try {
      const d = parseISO(dateStr)
      if (range === '1D') return format(d, 'HH:mm')
      if (range === '1W' || range === '1M') return format(d, 'MMM d')
      return format(d, 'MMM yy')
    } catch { return '' }
  }

  const formattedData = data.map((d) => ({ ...d, dateLabel: formatXAxis(d.date) }))
  const minVal = Math.min(...data.map((d) => d.low).filter(Boolean)) * 0.998
  const maxVal = Math.max(...data.map((d) => d.high).filter(Boolean)) * 1.002

  // Tooltip — inline styles so theme can't override text colors
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0]?.payload as DataPoint

    const spikePercent = spikeMap.get(d.date)
    const isSpike = spikePercent !== undefined
    const summary = isSpike ? (spikeSummaries[d.date] ?? null) : null
    const relatedNews = isSpike ? findNewsForDate(d.date, newsItems) : []

    // Trigger summary fetch when tooltip appears on a spike
    if (isSpike && d.date !== lastFetchedSpike.current) {
      lastFetchedSpike.current = d.date
      setTimeout(() => fetchSummary(d.date, spikePercent!), 0)
    }

    return (
      <div style={{
        background: '#111827',
        border: '1px solid #374151',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        fontSize: '12px',
        maxWidth: '280px',
        color: '#f9fafb',
        pointerEvents: 'none',
      }}>
        {/* Price data */}
        <div style={{ padding: '12px 14px 10px' }}>
          <p style={{ color: '#9ca3af', marginBottom: '8px', fontWeight: 500 }}>{label}</p>
          <p style={{ color: '#ffffff', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
            Close: ${d.close?.toFixed(2)}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px' }}>
            <p style={{ color: '#9ca3af' }}>Open: <span style={{ color: '#e5e7eb' }}>${d.open?.toFixed(2)}</span></p>
            <p style={{ color: '#9ca3af' }}>Vol: <span style={{ color: '#e5e7eb' }}>{(d.volume / 1e6).toFixed(1)}M</span></p>
            <p style={{ color: '#4ade80' }}>High: <span style={{ color: '#86efac' }}>${d.high?.toFixed(2)}</span></p>
            <p style={{ color: '#f87171' }}>Low: <span style={{ color: '#fca5a5' }}>${d.low?.toFixed(2)}</span></p>
          </div>
        </div>

        {/* Spike section */}
        {isSpike && (
          <div style={{ borderTop: '1px solid #1f2937', padding: '10px 14px 12px' }}>

            {/* % badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '6px',
              marginBottom: '10px',
              background: spikePercent! > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${spikePercent! > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
              <span style={{ fontSize: '13px' }}>{spikePercent! > 0 ? '↑' : '↓'}</span>
              <span style={{ fontWeight: 700, fontSize: '12px', color: spikePercent! > 0 ? '#4ade80' : '#f87171' }}>
                {spikePercent! > 0 ? '+' : ''}{spikePercent!.toFixed(1)}% move
              </span>
            </div>

            {/* AI summary */}
            {summary === 'loading' && (
              <p style={{ color: '#6b7280', fontSize: '11px', fontStyle: 'italic' }}>
                Analyzing what happened...
              </p>
            )}
            {summary && summary !== 'loading' && (
              <p style={{ color: '#d1d5db', fontSize: '11.5px', lineHeight: '1.6' }}>
                {summary}
              </p>
            )}

            {/* Fallback news headlines if no summary yet */}
            {!summary && relatedNews.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {relatedNews.map((item, i) => (
                  <div key={i}>
                    <p style={{ color: '#d1d5db', fontSize: '11px', lineHeight: '1.4' }}>{item.title}</p>
                    <p style={{ color: '#6b7280', fontSize: '10px', marginTop: '2px' }}>{item.publisher}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderDot = (dotProps: any) => {
    const { cx, cy, payload } = dotProps
    const spikePercent = spikeMap.get(payload.date)
    if (spikePercent === undefined) return <g key={`dot-${payload.date}`} />

    const fill = spikePercent > 0 ? '#22c55e' : '#ef4444'
    const ring = spikePercent > 0 ? '#16a34a' : '#dc2626'

    return (
      <g key={`spike-${payload.date}`}>
        <circle cx={cx} cy={cy} r={8} fill={fill} fillOpacity={0.15} />
        <circle cx={cx} cy={cy} r={4.5} fill={fill} stroke="#0f172a" strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={2} fill={ring} />
      </g>
    )
  }

  return (
    <div className="w-full">
      {/* Range buttons */}
      <div className="flex gap-1 mb-4">
        {RANGES.map((r) => (
          <Button key={r} size="sm" variant={range === r ? 'secondary' : 'ghost'}
            onClick={() => setRange(r)} className="text-xs h-7 px-2">
            {r}
          </Button>
        ))}
      </div>

      {spikeMap.size > 0 && (
        <div className="flex items-center gap-1.5 mb-3">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500 opacity-80" />
          <span className="text-xs text-gray-500">Significant moves (≥2%) — hover a dot for AI summary</span>
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
            <XAxis dataKey="dateLabel" tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis domain={[minVal, maxVal]} tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => `$${v.toFixed(0)}`} width={60} />
            <Tooltip content={CustomTooltip} />
            {previousClose && (
              <ReferenceLine y={previousClose} stroke="#6b7280" strokeDasharray="4 4" strokeOpacity={0.5} />
            )}
            <Area type="monotone" dataKey="close" stroke={color} strokeWidth={2}
              fill={`url(#gradient-${ticker})`} dot={renderDot}
              activeDot={{ r: 5, fill: color, stroke: '#111827', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
