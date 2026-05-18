'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { SECTOR_NORMAL_PE, DEFAULT_NORMAL_PE } from '@/lib/yahoo-finance'
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

interface EarningsPoint {
  date: string
  eps: number
}

interface StockChartProps {
  ticker: string
  currentPrice: number
  previousClose?: number | null
  analystTarget?: number | null
  earningsHistory?: EarningsPoint[]
  currentEps?: number | null
  sector?: string | null
}

// ── Bollinger Bands ───────────────────────────────────────────────────────────

function computeBollingerBands(data: DataPoint[], period = 20, k = 2) {
  return data.map((_, i) => {
    const slice = data.slice(Math.max(0, i - period + 1), i + 1)
    // Always compute — single-point slice gives zero-width band that widens as data accumulates
    const mean = slice.reduce((s, x) => s + x.close, 0) / slice.length
    const sd = Math.sqrt(slice.reduce((s, x) => s + Math.pow(x.close - mean, 2), 0) / slice.length)
    return { bbUpper: mean + k * sd, bbMiddle: mean, bbLower: mean - k * sd }
  })
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

// ── Fair value helpers ────────────────────────────────────────────────────────

function getTrailing12mEps(date: string, history: EarningsPoint[]): number | null {
  const target = new Date(date).getTime()
  const past = history.filter(e => new Date(e.date).getTime() <= target)
  if (past.length === 0) return null
  const last4 = past.slice(-4)
  if (last4.length < 4) return null
  const ttm = last4.reduce((s, e) => s + e.eps, 0)
  return ttm > 0 ? ttm : null
}

export default function StockChart({ ticker, currentPrice, previousClose, analystTarget, earningsHistory = [], currentEps, sector }: StockChartProps) {
  const NORMAL_PE = sector ? (SECTOR_NORMAL_PE[sector] ?? DEFAULT_NORMAL_PE) : DEFAULT_NORMAL_PE
  const [range, setRange] = useState<Range>('1M')
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [newsItems, setNewsItems] = useState<ChartNewsItem[]>([])

  // toggle overlays
  const [showFairValue, setShowFairValue] = useState(true)
  const [showSpikes, setShowSpikes] = useState(true)
  const [showBB, setShowBB] = useState(false)

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

  const BB_PERIOD: Record<Range, number> = { '1D': 12, '1W': 10, '1M': 10, '3M': 14, '1Y': 20, '5Y': 20 }
  const bbPeriod = BB_PERIOD[range]

  const spikeMap = useMemo(() => computeSpikes(data), [data])
  const bbBands  = useMemo(() => computeBollingerBands(data, bbPeriod), [data, bbPeriod])

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

  const hasPositiveEps = currentEps != null && currentEps > 0
  const hasFairValue = earningsHistory.length >= 4 || hasPositiveEps

  const formattedData = data.map((d, i) => {
    let fairValue: number | null = null
    if (hasFairValue) {
      let ttmEps: number | null = earningsHistory.length >= 4
        ? getTrailing12mEps(d.date, earningsHistory)
        : null
      if (ttmEps == null && hasPositiveEps) ttmEps = currentEps!
      fairValue = (ttmEps != null && ttmEps > 0) ? ttmEps * NORMAL_PE : null
    }
    const bb = bbBands[i]
    return {
      ...d,
      dateLabel: formatXAxis(d.date),
      fairValue,
      bbUpper:  bb?.bbUpper  ?? null,
      bbMiddle: bb?.bbMiddle ?? null,
      bbLower:  bb?.bbLower  ?? null,
    }
  })

  const priceMin = Math.min(...data.map((d) => d.low).filter(Boolean))
  const priceMax = Math.max(...data.map((d) => d.high).filter(Boolean))
  const fairValues = formattedData.map(d => d.fairValue).filter((v): v is number => v != null)
  const fairMin = fairValues.length ? Math.min(...fairValues) : priceMin

  const bbUpperValues = formattedData.map(d => d.bbUpper).filter((v): v is number => v != null)
  const bbLowerValues = formattedData.map(d => d.bbLower).filter((v): v is number => v != null)
  const bbMax = bbUpperValues.length ? Math.max(...bbUpperValues) : priceMax
  const bbMin = bbLowerValues.length ? Math.min(...bbLowerValues) : priceMin

  // Latest fair value for legend
  const latestFV = hasFairValue ? formattedData.filter(d => d.fairValue != null).at(-1)?.fairValue ?? null : null
  const fvDiff = latestFV ? ((latestFV - currentPrice) / currentPrice) * 100 : null
  const isUnder = fvDiff != null && fvDiff > 0

  // Latest BB values for legend
  const latestBB = formattedData.filter(d => d.bbUpper != null).at(-1)

  // Y-axis domain: tight to actual price range with fixed $5 buffer each side
  const Y_PAD = 5
  const yDomainMin = (_dataMin: number) => {
    let lo = priceMin
    if (showBB && bbLowerValues.length) lo = Math.min(lo, bbMin)
    return Math.max(0, lo - Y_PAD)
  }
  const yDomainMax = (_dataMax: number) => {
    let hi = priceMax
    if (showBB && bbUpperValues.length) hi = Math.max(hi, bbMax)
    return hi + Y_PAD
  }

  // Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0]?.payload as DataPoint

    // Always derive the display date from the raw ISO date on the data point —
    // never from the XAxis label, which can be shared across many points.
    const displayDate = (() => {
      try {
        const dt = parseISO(d.date)
        if (range === '1D') return format(dt, 'HH:mm')
        if (range === '1W' || range === '1M') return format(dt, 'MMM d')
        return format(dt, 'MMM d, yyyy')
      } catch { return d.date }
    })()

    const bbPoint = d as any
    const hasBBPoint = showBB && bbPoint.bbUpper != null

    const spikePercent = spikeMap.get(d.date)
    const isSpike = showSpikes && spikePercent !== undefined
    const summary = isSpike ? (spikeSummaries[d.date] ?? null) : null
    const relatedNews = isSpike ? findNewsForDate(d.date, newsItems) : []

    if (isSpike && d.date !== lastFetchedSpike.current) {
      lastFetchedSpike.current = d.date
      setTimeout(() => fetchSummary(d.date, spikePercent!), 0)
    }

    return (
      <div style={{
        background: '#111827',
        border: '1px solid #374151',
        borderRadius: '10px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        fontSize: '11px',
        maxWidth: '200px',
        color: '#f9fafb',
        pointerEvents: 'none',
      }}>
        <div style={{ padding: '8px 10px 7px' }}>
          <p style={{ color: '#9ca3af', marginBottom: '4px', fontWeight: 500, fontSize: '10px' }}>{displayDate}</p>
          <p style={{ color: '#ffffff', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>
            ${d.close?.toFixed(2)}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 10px', fontSize: '10.5px' }}>
            <p style={{ color: '#9ca3af' }}>O: <span style={{ color: '#e5e7eb' }}>${d.open?.toFixed(2)}</span></p>
            <p style={{ color: '#9ca3af' }}>V: <span style={{ color: '#e5e7eb' }}>{(d.volume / 1e6).toFixed(1)}M</span></p>
            <p style={{ color: '#4ade80' }}>H: <span style={{ color: '#86efac' }}>${d.high?.toFixed(2)}</span></p>
            <p style={{ color: '#f87171' }}>L: <span style={{ color: '#fca5a5' }}>${d.low?.toFixed(2)}</span></p>
          </div>
          {hasBBPoint && (
            <div style={{ marginTop: '5px', paddingTop: '5px', borderTop: '1px solid #1f2937', display: 'flex', gap: '6px', fontSize: '10px', flexWrap: 'wrap' }}>
              <span style={{ color: '#a78bfa' }}>↑<span style={{ color: '#c4b5fd' }}>${bbPoint.bbUpper?.toFixed(2)}</span></span>
              <span style={{ color: '#a78bfa' }}>SMA <span style={{ color: '#c4b5fd' }}>${bbPoint.bbMiddle?.toFixed(2)}</span></span>
              <span style={{ color: '#a78bfa' }}>↓<span style={{ color: '#c4b5fd' }}>${bbPoint.bbLower?.toFixed(2)}</span></span>
            </div>
          )}
        </div>

        {isSpike && (
          <div style={{ borderTop: '1px solid #1f2937', padding: '6px 10px 8px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '2px 7px', borderRadius: '5px', marginBottom: '6px',
              background: spikePercent! > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${spikePercent! > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: spikePercent! > 0 ? '#4ade80' : '#f87171' }}>
                {spikePercent! > 0 ? '+' : ''}{spikePercent!.toFixed(1)}% move
              </span>
            </div>
            {summary === 'loading' && (
              <p style={{ color: '#6b7280', fontSize: '10px', fontStyle: 'italic' }}>Analyzing...</p>
            )}
            {summary && summary !== 'loading' && (
              <p style={{ color: '#d1d5db', fontSize: '10.5px', lineHeight: '1.5' }}>{summary}</p>
            )}
            {!summary && relatedNews.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {relatedNews.slice(0, 1).map((item, i) => (
                  <p key={i} style={{ color: '#d1d5db', fontSize: '10.5px', lineHeight: '1.4' }}>{item.title}</p>
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
    if (!showSpikes) return <g key={`dot-${payload.date}`} />
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
      {/* Range buttons + toggles row */}
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Button key={r} size="sm" variant={range === r ? 'secondary' : 'ghost'}
              onClick={() => setRange(r)} className="text-xs h-7 px-2">
              {r}
            </Button>
          ))}
        </div>

        {/* Overlay toggles */}
        <div className="flex items-center gap-1.5">
          {hasFairValue && latestFV && (
            <button
              onClick={() => setShowFairValue(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-all ${
                showFairValue
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                  : 'border-gray-700 bg-transparent text-gray-600 opacity-50'
              }`}
            >
              <svg width="14" height="3" className="shrink-0">
                <line x1="0" y1="1.5" x2="14" y2="1.5" stroke={showFairValue ? '#f59e0b' : '#6b7280'} strokeWidth="1.5" strokeDasharray="4 2" />
              </svg>
              Fair Value
            </button>
          )}
          {spikeMap.size > 0 && (
            <button
              onClick={() => setShowSpikes(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-all ${
                showSpikes
                  ? 'border-green-500/40 bg-green-500/10 text-green-400'
                  : 'border-gray-700 bg-transparent text-gray-600 opacity-50'
              }`}
            >
              <div className={`h-2 w-2 rounded-full shrink-0 ${showSpikes ? 'bg-green-500' : 'bg-gray-600'}`} />
              AI Dots
            </button>
          )}
          <button
            onClick={() => setShowBB(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-all ${
              showBB
                ? 'border-violet-500/40 bg-violet-500/10 text-violet-400'
                : 'border-gray-700 bg-transparent text-gray-600 opacity-50'
            }`}
          >
            <svg width="14" height="10" className="shrink-0" viewBox="0 0 14 10">
              <line x1="0" y1="1" x2="14" y2="1" stroke={showBB ? '#a78bfa' : '#6b7280'} strokeWidth="1.5" />
              <line x1="0" y1="5" x2="14" y2="5" stroke={showBB ? '#a78bfa' : '#6b7280'} strokeWidth="1" strokeDasharray="3 2" />
              <line x1="0" y1="9" x2="14" y2="9" stroke={showBB ? '#a78bfa' : '#6b7280'} strokeWidth="1.5" />
            </svg>
            BB ({bbPeriod},2)
          </button>
        </div>
      </div>

      {/* Legend row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-5 rounded" style={{ background: color }} />
          <span className="text-xs text-gray-500">Market Price</span>
        </div>

        {hasFairValue && showFairValue && latestFV && fvDiff != null && (
          <>
            <div className="flex items-center gap-1.5">
              <svg width="20" height="4" className="shrink-0">
                <line x1="0" y1="2" x2="20" y2="2" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 3" />
              </svg>
              <span className="text-xs text-gray-500">
                Fair Value <span className="text-amber-400 font-medium">${latestFV.toFixed(0)}</span>
                <span className="text-gray-600 ml-1">(EPS × {NORMAL_PE})</span>
              </span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isUnder
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {isUnder ? '↑ Undervalued' : '↓ Overvalued'} {Math.abs(fvDiff).toFixed(1)}%
            </span>
          </>
        )}

        {showSpikes && spikeMap.size > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500 opacity-80" />
            <span className="text-xs text-gray-500">≥2% move — hover for AI summary</span>
          </div>
        )}
        {showBB && latestBB && (
          <div className="flex items-center gap-1.5">
            <svg width="20" height="10" className="shrink-0" viewBox="0 0 20 10">
              <line x1="0" y1="1" x2="20" y2="1" stroke="#a78bfa" strokeWidth="1.5" />
              <line x1="0" y1="5" x2="20" y2="5" stroke="#a78bfa" strokeWidth="1" strokeDasharray="4 2" />
              <line x1="0" y1="9" x2="20" y2="9" stroke="#a78bfa" strokeWidth="1.5" />
            </svg>
            <span className="text-xs text-gray-500">
              Bollinger Bands{' '}
              <span className="text-violet-400 font-medium">${latestBB.bbLower?.toFixed(2)} – ${latestBB.bbUpper?.toFixed(2)}</span>
              <span className="text-gray-600 ml-1">({bbPeriod}, 2σ)</span>
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-72 w-full" />
      ) : data.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-gray-500">No chart data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={420}>
          <AreaChart data={formattedData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`bb-fill-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.10} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="dateLabel" tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis
              domain={[yDomainMin, yDomainMax]}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => `$${v.toFixed(0)}`} width={60} />
            <Tooltip content={CustomTooltip} />
            {previousClose && (
              <ReferenceLine y={previousClose} stroke="#6b7280" strokeDasharray="4 4" strokeOpacity={0.5} />
            )}
            {/* BB bands — drawn before price area so price line stays on top */}
            {showBB && <>
              <Area type="monotone" dataKey="bbUpper"
                stroke="#8b5cf6" strokeWidth={1.5} fill={`url(#bb-fill-${ticker})`}
                dot={false} activeDot={false} isAnimationActive={false} connectNulls={true} />
              <Area type="monotone" dataKey="bbMiddle"
                stroke="#8b5cf6" strokeWidth={1} strokeDasharray="5 3" fill="none"
                dot={false} activeDot={false} isAnimationActive={false} connectNulls={true} />
              <Area type="monotone" dataKey="bbLower"
                stroke="#8b5cf6" strokeWidth={1.5} fill="none"
                dot={false} activeDot={false} isAnimationActive={false} connectNulls={true} />
            </>}
            {/* Price area */}
            <Area type="monotone" dataKey="close" stroke={color} strokeWidth={2}
              fill={`url(#gradient-${ticker})`} dot={renderDot}
              activeDot={{ r: 5, fill: color, stroke: '#111827', strokeWidth: 2 }} />
            {/* Fair value line — on top so it's never obscured */}
            {hasFairValue && showFairValue && (
              <Area
                type="monotone"
                dataKey="fairValue"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="8 4"
                fill="none"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                connectNulls={true}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
