'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { createChart, ColorType, LineStyle, CrosshairMode, UTCTimestamp, IChartApi, LineSeries, AreaSeries, createSeriesMarkers } from 'lightweight-charts'
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function toTime(dateStr: string): UTCTimestamp {
  return Math.floor(new Date(dateStr).getTime() / 1000) as UTCTimestamp
}

function computeBollingerBands(data: DataPoint[], period = 20, k = 2) {
  return data.map((_, i) => {
    const slice = data.slice(Math.max(0, i - period + 1), i + 1)
    if (slice.length < 2) return { bbUpper: null as number | null, bbMiddle: null as number | null, bbLower: null as number | null }
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
      if (Math.abs(pct) >= 0.05) map.set(data[i].date, pct * 100)
    }
  }
  return map
}

function getTrailing12mEps(date: string, history: EarningsPoint[]): number | null {
  const target = new Date(date).getTime()
  const past = history.filter(e => new Date(e.date).getTime() <= target)
  if (past.length === 0) return null
  const last4 = past.slice(-4)
  if (last4.length < 4) return null
  const ttm = last4.reduce((s, e) => s + e.eps, 0)
  return ttm > 0 ? ttm : null
}

function findNewsForDate(date: string, news: ChartNewsItem[]): ChartNewsItem[] {
  const target = new Date(date).getTime()
  return news
    .filter(item => Math.abs(target - item.providerPublishTime * 1000) <= 2 * 86400000)
    .slice(0, 1)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StockChart({
  ticker, currentPrice, previousClose, analystTarget,
  earningsHistory = [], currentEps, sector,
}: StockChartProps) {
  const NORMAL_PE = sector ? (SECTOR_NORMAL_PE[sector] ?? DEFAULT_NORMAL_PE) : DEFAULT_NORMAL_PE

  const [range, setRange] = useState<Range>('1M')
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [newsItems, setNewsItems] = useState<ChartNewsItem[]>([])
  const [showFairValue, setShowFairValue] = useState(true)
  const [showSpikes, setShowSpikes] = useState(true)
  const [showBB, setShowBB] = useState(false)
  const [spikeSummaries, setSpikeSummaries] = useState<Record<string, string>>({})

  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const lastFetchedSpike = useRef<string | null>(null)

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    visible: boolean; x: number; y: number
    point: (DataPoint & { bbUpper?: number | null; bbMiddle?: number | null; bbLower?: number | null; fairValue?: number | null }) | null
  }>({ visible: false, x: 0, y: 0, point: null })

  // Keep mutable refs for use inside chart callbacks
  const formattedDataRef = useRef<typeof formattedData>([])
  const spikeMapRef = useRef<Map<string, number>>(new Map())
  const spikeSummariesRef = useRef<Record<string, string>>({})
  const newsItemsRef = useRef<ChartNewsItem[]>([])

  // ── Data fetching ────────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true)
    fetch(`/api/stock/${ticker}?type=historical&range=${rangeMap[range]}`)
      .then(r => r.json())
      .then(d => { setData(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [ticker, range])

  useEffect(() => {
    fetch(`/api/news/${ticker}?count=30`)
      .then(r => r.json())
      .then(d => setNewsItems(d.news || []))
      .catch(() => {})
  }, [ticker])

  // ── Derived data ─────────────────────────────────────────────────────────────

  const BB_PERIOD: Record<Range, number> = { '1D': 12, '1W': 10, '1M': 10, '3M': 14, '1Y': 20, '5Y': 20 }
  const bbPeriod = BB_PERIOD[range]

  const spikeMap = useMemo(() => computeSpikes(data), [data])
  const bbBands  = useMemo(() => computeBollingerBands(data, bbPeriod), [data, bbPeriod])

  const hasPositiveEps = currentEps != null && currentEps > 0
  const hasFairValue   = earningsHistory.length >= 4 || hasPositiveEps

  const formattedData = useMemo(() => data.map((d, i) => {
    let fairValue: number | null = null
    if (hasFairValue) {
      let ttmEps = earningsHistory.length >= 4 ? getTrailing12mEps(d.date, earningsHistory) : null
      if (ttmEps == null && hasPositiveEps) ttmEps = currentEps!
      fairValue = ttmEps != null && ttmEps > 0 ? ttmEps * NORMAL_PE : null
    }
    const bb = bbBands[i]
    return {
      ...d,
      fairValue,
      bbUpper:  bb?.bbUpper  ?? null,
      bbMiddle: bb?.bbMiddle ?? null,
      bbLower:  bb?.bbLower  ?? null,
    }
  }), [data, bbBands, hasFairValue, hasPositiveEps, currentEps, earningsHistory, NORMAL_PE])

  const firstClose  = data[0]?.close ?? currentPrice
  const isPositive  = data.length > 0 ? data[data.length - 1].close >= firstClose : true
  const color       = isPositive ? '#22c55e' : '#ef4444'

  const latestFV  = hasFairValue ? formattedData.filter(d => d.fairValue != null).at(-1)?.fairValue ?? null : null
  const fvDiff    = latestFV ? ((latestFV - currentPrice) / currentPrice) * 100 : null
  const isUnder   = fvDiff != null && fvDiff > 0
  const latestBB  = formattedData.filter(d => d.bbUpper != null).at(-1)

  // Sync refs
  useEffect(() => { formattedDataRef.current  = formattedData },  [formattedData])
  useEffect(() => { spikeMapRef.current        = spikeMap },       [spikeMap])
  useEffect(() => { spikeSummariesRef.current  = spikeSummaries }, [spikeSummaries])
  useEffect(() => { newsItemsRef.current       = newsItems },      [newsItems])

  // ── Chart initialisation ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!chartContainerRef.current || formattedData.length === 0) return

    // Destroy previous instance
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null }

    const container = chartContainerRef.current

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#6b7280',
        fontSize: 11,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: '#374151', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#4b5563', labelBackgroundColor: '#111827' },
        horzLine: { color: '#4b5563', labelBackgroundColor: '#111827' },
      },
      rightPriceScale: {
        borderVisible: false,
        textColor: '#6b7280',
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: range === '1D',
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      width:  container.clientWidth,
      height: 420,
      handleScroll: false,
      handleScale:  false,
    })

    chartRef.current = chart

    // ── BB bands (behind price) ──────────────────────────────────────────────
    if (showBB) {
      const opts = { lastValueVisible: false, priceLineVisible: false }
      const upper  = chart.addSeries(LineSeries, { ...opts, color: '#8b5cf6', lineWidth: 1 })
      const middle = chart.addSeries(LineSeries, { ...opts, color: '#8b5cf6', lineWidth: 1, lineStyle: LineStyle.Dashed })
      const lower  = chart.addSeries(LineSeries, { ...opts, color: '#8b5cf6', lineWidth: 1 })
      upper.setData(formattedData.filter(d => d.bbUpper  != null).map(d => ({ time: toTime(d.date), value: d.bbUpper! })))
      middle.setData(formattedData.filter(d => d.bbMiddle != null).map(d => ({ time: toTime(d.date), value: d.bbMiddle! })))
      lower.setData(formattedData.filter(d => d.bbLower  != null).map(d => ({ time: toTime(d.date), value: d.bbLower! })))
    }

    // ── Fair value line ──────────────────────────────────────────────────────
    if (showFairValue && hasFairValue) {
      const fvData = formattedData.filter(d => d.fairValue != null).map(d => ({ time: toTime(d.date), value: d.fairValue! }))
      if (fvData.length > 0) {
        const fvSeries = chart.addSeries(LineSeries, {
          color: '#f59e0b', lineWidth: 2, lineStyle: LineStyle.Dashed,
          lastValueVisible: false, priceLineVisible: false,
        })
        fvSeries.setData(fvData)
      }
    }

    // ── Previous close reference ─────────────────────────────────────────────
    if (previousClose && formattedData.length >= 2) {
      const pcSeries = chart.addSeries(LineSeries, {
        color: '#6b7280', lineWidth: 1, lineStyle: LineStyle.Dashed,
        lastValueVisible: false, priceLineVisible: false,
      })
      pcSeries.setData([
        { time: toTime(formattedData[0].date), value: previousClose },
        { time: toTime(formattedData[formattedData.length - 1].date), value: previousClose },
      ])
    }

    // ── Price area (on top) ──────────────────────────────────────────────────
    const priceSeries = chart.addSeries(AreaSeries, {
      lineColor: color,
      topColor:  `${color}33`,
      bottomColor: `${color}00`,
      lineWidth: 2,
      lastValueVisible: true,
      priceLineVisible: false,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: '#0f172a',
    })
    priceSeries.setData(formattedData.map(d => ({ time: toTime(d.date), value: d.close })))

    // ── AI dot markers ───────────────────────────────────────────────────────
    if (showSpikes && spikeMap.size > 0) {
      const markers = Array.from(spikeMap.entries())
        .map(([date, pct]) => ({
          time: toTime(date),
          position: pct > 0 ? 'aboveBar' as const : 'belowBar' as const,
          color: pct > 0 ? '#22c55e' : '#ef4444',
          shape: 'circle' as const,
          size: 1.5,
        }))
        .sort((a, b) => (a.time as number) - (b.time as number))
      createSeriesMarkers(priceSeries, markers)
    }

    chart.timeScale().fitContent()

    // ── Crosshair tooltip ────────────────────────────────────────────────────
    chart.subscribeCrosshairMove(param => {
      if (!param.point || !param.time) {
        setTooltip(prev => ({ ...prev, visible: false }))
        return
      }
      const t = param.time as number
      const fd = formattedDataRef.current
      if (!fd.length) return

      // Find nearest data point
      const match = fd.reduce((best, d) => {
        return Math.abs(toTime(d.date) - t) < Math.abs(toTime(best.date) - t) ? d : best
      }, fd[0])

      const spikePct = spikeMapRef.current.get(match.date)
      if (spikePct !== undefined && match.date !== lastFetchedSpike.current) {
        lastFetchedSpike.current = match.date
        if (spikeSummariesRef.current[match.date] === undefined) {
          setSpikeSummaries(prev => ({ ...prev, [match.date]: 'loading' }))
          fetch(`/api/spike-summary?ticker=${ticker}&date=${match.date}&pct=${spikePct.toFixed(1)}`)
            .then(r => r.json())
            .then(d => setSpikeSummaries(prev => ({ ...prev, [match.date]: d.summary || '' })))
            .catch(() => setSpikeSummaries(prev => ({ ...prev, [match.date]: '' })))
        }
      }

      setTooltip({ visible: true, x: param.point.x, y: param.point.y, point: match })
    })

    // ── Resize ───────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      chartRef.current?.applyOptions({ width: container.clientWidth })
    })
    ro.observe(container)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formattedData, range, showBB, showFairValue, showSpikes, color, hasFairValue, previousClose, ticker])

  // ── Tooltip content ──────────────────────────────────────────────────────────

  const tp = tooltip.point
  const spikePct    = tp ? spikeMap.get(tp.date) : undefined
  const summary     = tp && spikePct !== undefined ? spikeSummaries[tp.date] ?? null : null
  const relatedNews = tp && spikePct !== undefined ? findNewsForDate(tp.date, newsItems) : []

  const displayDate = tp ? (() => {
    try {
      const dt = parseISO(tp.date)
      if (range === '1D') return format(dt, 'HH:mm')
      if (range === '1W' || range === '1M') return format(dt, 'MMM d')
      return format(dt, 'MMM d, yyyy')
    } catch { return tp.date }
  })() : ''

  const containerW  = chartContainerRef.current?.clientWidth ?? 800
  const ttipWidth   = 200
  const ttipLeft    = tooltip.x + 24 > containerW - ttipWidth
    ? tooltip.x - ttipWidth - 14
    : tooltip.x + 24

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex gap-1">
          {RANGES.map(r => (
            <Button key={r} size="sm" variant={range === r ? 'secondary' : 'ghost'}
              onClick={() => setRange(r)} className="text-xs h-7 px-2">{r}</Button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {hasFairValue && latestFV && (
            <button onClick={() => setShowFairValue(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-all ${
                showFairValue ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' : 'border-gray-700 text-gray-600 opacity-50'
              }`}>
              <svg width="14" height="3"><line x1="0" y1="1.5" x2="14" y2="1.5" stroke={showFairValue ? '#f59e0b' : '#6b7280'} strokeWidth="1.5" strokeDasharray="4 2" /></svg>
              Fair Value
            </button>
          )}
          {spikeMap.size > 0 && (
            <button onClick={() => setShowSpikes(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-all ${
                showSpikes ? 'border-green-500/40 bg-green-500/10 text-green-400' : 'border-gray-700 text-gray-600 opacity-50'
              }`}>
              <div className={`h-2 w-2 rounded-full ${showSpikes ? 'bg-green-500' : 'bg-gray-600'}`} />
              AI Dots
            </button>
          )}
          <button onClick={() => setShowBB(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-all ${
              showBB ? 'border-violet-500/40 bg-violet-500/10 text-violet-400' : 'border-gray-700 text-gray-600 opacity-50'
            }`}>
            <svg width="14" height="10" viewBox="0 0 14 10">
              <line x1="0" y1="1" x2="14" y2="1" stroke={showBB ? '#a78bfa' : '#6b7280'} strokeWidth="1.5" />
              <line x1="0" y1="5" x2="14" y2="5" stroke={showBB ? '#a78bfa' : '#6b7280'} strokeWidth="1" strokeDasharray="3 2" />
              <line x1="0" y1="9" x2="14" y2="9" stroke={showBB ? '#a78bfa' : '#6b7280'} strokeWidth="1.5" />
            </svg>
            BB ({bbPeriod},2)
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-5 rounded" style={{ background: color }} />
          <span className="text-xs text-gray-500">Market Price</span>
        </div>
        {hasFairValue && showFairValue && latestFV && fvDiff != null && (
          <>
            <div className="flex items-center gap-1.5">
              <svg width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 3" /></svg>
              <span className="text-xs text-gray-500">
                Fair Value <span className="text-amber-400 font-medium">${latestFV.toFixed(0)}</span>
                <span className="text-gray-600 ml-1">(EPS × {NORMAL_PE})</span>
              </span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isUnder ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {isUnder ? '↑ Undervalued' : '↓ Overvalued'} {Math.abs(fvDiff).toFixed(1)}%
            </span>
          </>
        )}
        {showSpikes && spikeMap.size > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500 opacity-80" />
            <span className="text-xs text-gray-500">≥5% move — hover for AI summary</span>
          </div>
        )}
        {showBB && latestBB && (
          <div className="flex items-center gap-1.5">
            <svg width="20" height="10" viewBox="0 0 20 10">
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

      {/* Chart area */}
      {loading ? (
        <Skeleton className="h-[420px] w-full" />
      ) : data.length === 0 ? (
        <div className="h-[420px] flex items-center justify-center text-gray-500">No chart data available</div>
      ) : (
        <div className="relative">
          <div ref={chartContainerRef} className="w-full" />

          {/* Floating tooltip */}
          {tooltip.visible && tp && (
            <div className="pointer-events-none absolute z-50" style={{ left: ttipLeft, top: Math.max(0, tooltip.y - 50) }}>
              <div style={{
                background: '#111827', border: '1px solid #374151', borderRadius: '10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)', fontSize: '11px',
                minWidth: '170px', maxWidth: '200px', color: '#f9fafb',
              }}>
                <div style={{ padding: '8px 10px 7px' }}>
                  <p style={{ color: '#9ca3af', marginBottom: '4px', fontWeight: 500, fontSize: '10px' }}>{displayDate}</p>
                  <p style={{ color: '#ffffff', fontWeight: 700, fontSize: '13px', marginBottom: '5px' }}>
                    ${tp.close?.toFixed(2)}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 10px', fontSize: '10.5px' }}>
                    <span style={{ color: '#9ca3af' }}>O: <span style={{ color: '#e5e7eb' }}>${tp.open?.toFixed(2)}</span></span>
                    <span style={{ color: '#9ca3af' }}>V: <span style={{ color: '#e5e7eb' }}>{tp.volume ? (tp.volume / 1e6).toFixed(1) + 'M' : '—'}</span></span>
                    <span style={{ color: '#4ade80' }}>H: <span style={{ color: '#86efac' }}>${tp.high?.toFixed(2)}</span></span>
                    <span style={{ color: '#f87171' }}>L: <span style={{ color: '#fca5a5' }}>${tp.low?.toFixed(2)}</span></span>
                  </div>
                  {showBB && tp.bbUpper != null && (
                    <div style={{ marginTop: '5px', paddingTop: '5px', borderTop: '1px solid #1f2937', display: 'flex', gap: '6px', fontSize: '10px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#a78bfa' }}>↑<span style={{ color: '#c4b5fd' }}>${tp.bbUpper?.toFixed(2)}</span></span>
                      <span style={{ color: '#a78bfa' }}>SMA <span style={{ color: '#c4b5fd' }}>${tp.bbMiddle?.toFixed(2)}</span></span>
                      <span style={{ color: '#a78bfa' }}>↓<span style={{ color: '#c4b5fd' }}>${tp.bbLower?.toFixed(2)}</span></span>
                    </div>
                  )}
                </div>
                {spikePct !== undefined && (
                  <div style={{ borderTop: '1px solid #1f2937', padding: '6px 10px 8px' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '2px 7px', borderRadius: '5px', marginBottom: '6px',
                      background: spikePct > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                      border: `1px solid ${spikePct > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: spikePct > 0 ? '#4ade80' : '#f87171' }}>
                        {spikePct > 0 ? '+' : ''}{spikePct.toFixed(1)}% move
                      </span>
                    </div>
                    {summary === 'loading'
                      ? <p style={{ color: '#6b7280', fontSize: '10px', fontStyle: 'italic' }}>Analyzing…</p>
                      : summary
                        ? <p style={{ color: '#d1d5db', fontSize: '10.5px', lineHeight: '1.5' }}>{summary}</p>
                        : relatedNews.length > 0
                          ? <p style={{ color: '#d1d5db', fontSize: '10.5px', lineHeight: '1.4' }}>{relatedNews[0].title}</p>
                          : null
                    }
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
