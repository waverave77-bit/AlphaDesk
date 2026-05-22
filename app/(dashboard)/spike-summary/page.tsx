'use client'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/ThemeProvider'
import ProLimitBanner from '@/components/ProLimitBanner'
import { TrendingUp, TrendingDown, Search, Info } from 'lucide-react'

// ─── Mr. Guy pixel head ───────────────────────────────────────────────────────
const N = null
const HEAD_PIXELS: Array<Array<string | null>> = [
  [N,'#2b1604','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#2b1604','#2b1604'],
  ['#2b1604','#5c2e0a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#5c2e0a','#5c2e0a','#2b1604'],
  ['#2b1604','#5c2e0a','#5c2e0a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#5c2e0a','#5c2e0a','#5c2e0a','#2b1604'],
  ['#2b1604','#5c2e0a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#5c2e0a','#2b1604'],
  ['#2b1604','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#2b1604'],
  ['#2b1604','#111118','#111118','#1e3a8a','#1e3a8a','#f5c49a','#f5c49a','#1e3a8a','#1e3a8a','#111118','#111118','#2b1604'],
  ['#2b1604','#111118','#111118','#1e3a8a','#1e3a8a','#111118','#111118','#1e3a8a','#1e3a8a','#111118','#111118','#2b1604'],
  ['#2b1604','#111118','#111118','#111118','#111118','#f5c49a','#f5c49a','#111118','#111118','#111118','#111118','#2b1604'],
  ['#2b1604','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#2b1604'],
  [N,'#f5c49a','#f5c49a','#f5c49a','#c47a50','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a',N],
  [N,'#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a',N,N],
  [N,N,'#f5c49a','#f0f0f0','#f0f0f0','#c01010','#c01010','#f0f0f0','#f0f0f0','#f5c49a',N,N],
  ['#f0f0f0','#f0f0f0','#f0f0f0','#f0f0f0','#c01010','#c01010','#7a0000','#7a0000','#f0f0f0','#f0f0f0','#f0f0f0','#222236'],
]
const HEAD_COLS = 12, HEAD_ROWS = 13

function MrGuyHead({ px = 3, className }: { px?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    HEAD_PIXELS.forEach((row, r) => {
      row.forEach((color, col) => {
        if (!color) return
        ctx.fillStyle = color
        ctx.fillRect(col * px, r * px, px, px)
      })
    })
  }, [px])
  return <canvas ref={ref} width={HEAD_COLS * px} height={HEAD_ROWS * px} className={className} style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }} />
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Spike {
  date: string
  changePercent: number
  open: number
  close: number
}

interface SpikeWithSummary extends Spike {
  summary?: string
  loading?: boolean
  limitReached?: boolean
}

export default function SpikeSummaryPage() {
  const { themeId } = useTheme()
  const isDark = themeId !== 'white'

  const [ticker, setTicker] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [spikes, setSpikes] = useState<SpikeWithSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limitReached, setLimitReached] = useState(false)

  const searchSpikes = async (sym: string) => {
    if (!sym) return
    setLoading(true)
    setError(null)
    setSpikes([])
    setLimitReached(false)

    try {
      // Fetch 3-month history via stock API
      const res = await fetch(`/api/stock/${sym.toUpperCase()}?type=history&range=3mo`)
      if (!res.ok) { setError('Stock not found'); setLoading(false); return }
      const data = await res.json()
      const history: { date: string; open: number; close: number; changePercent?: number }[] = data?.history ?? []

      if (!history.length) { setError('No price history available for this ticker'); setLoading(false); return }

      // Find days with moves of ±3% or more
      const found: SpikeWithSummary[] = history
        .filter(d => Math.abs(d.changePercent ?? ((d.close - d.open) / d.open * 100)) >= 3)
        .map(d => ({
          date: d.date,
          changePercent: d.changePercent ?? ((d.close - d.open) / d.open * 100),
          open: d.open,
          close: d.close,
        }))
        .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
        .slice(0, 10)

      if (!found.length) {
        setError(`No major price spikes found for ${sym.toUpperCase()} in the last 3 months (threshold: ±3%)`)
        setLoading(false)
        return
      }

      setTicker(sym.toUpperCase())
      setSpikes(found)
    } catch {
      setError('Failed to load price data. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const explainSpike = async (idx: number) => {
    const spike = spikes[idx]
    if (!spike || spike.summary || spike.loading) return

    setSpikes(prev => prev.map((s, i) => i === idx ? { ...s, loading: true } : s))

    try {
      const res = await fetch(
        `/api/spike-summary?ticker=${ticker}&date=${spike.date}&pct=${spike.changePercent.toFixed(2)}`
      )
      if (res.status === 429) {
        setSpikes(prev => prev.map((s, i) => i === idx ? { ...s, loading: false, limitReached: true } : s))
        setLimitReached(true)
        return
      }
      const data = await res.json()
      setSpikes(prev => prev.map((s, i) => i === idx ? { ...s, loading: false, summary: data.summary || 'No explanation available.' } : s))
    } catch {
      setSpikes(prev => prev.map((s, i) => i === idx ? { ...s, loading: false, summary: 'Failed to load explanation.' } : s))
    }
  }

  const card = isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200'
  const text = isDark ? 'text-white' : 'text-slate-900'
  const sub  = isDark ? 'text-gray-400' : 'text-slate-500'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div style={{ animation: 'mrg-idle 2.4s ease-in-out infinite' }}>
          <MrGuyHead px={5} />
        </div>
        <div>
          <h1 className={cn('text-3xl font-extrabold', text)}>Spike Summary</h1>
          <p className={cn('text-base mt-0.5', sub)}>
            Enter a ticker to see its biggest recent price moves — and why they happened.
          </p>
        </div>
      </div>

      {/* What is this? */}
      <div className={cn('rounded-xl border p-4 flex gap-3', isDark ? 'bg-blue-900/20 border-blue-800/40' : 'bg-blue-50 border-blue-200')}>
        <Info className={cn('h-5 w-5 mt-0.5 shrink-0', isDark ? 'text-blue-400' : 'text-blue-500')} />
        <div>
          <p className={cn('text-sm font-semibold', isDark ? 'text-blue-300' : 'text-blue-700')}>What is this?</p>
          <p className={cn('text-sm mt-0.5 leading-relaxed', isDark ? 'text-blue-200/80' : 'text-blue-600/90')}>
            Spike Summary scans the last 3 months of price history and finds days where a stock moved ±3% or more in a single session. Click any spike to get an AI explanation of what likely caused the move.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className={cn('rounded-2xl border p-5 space-y-4', card)}>
        <form
          onSubmit={e => { e.preventDefault(); searchSpikes(inputVal.trim()) }}
          className="flex gap-2"
        >
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value.toUpperCase())}
            placeholder="Enter ticker (e.g. NVDA)"
            className={cn(
              'flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium outline-none transition-colors',
              isDark
                ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400'
            )}
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold transition-colors"
          >
            <Search className="h-4 w-4" />
            {loading ? 'Scanning...' : 'Find Spikes'}
          </button>
        </form>

        {/* Example chips */}
        <div className="flex flex-wrap gap-2">
          {['NVDA', 'TSLA', 'AAPL', 'META', 'AMD'].map(t => (
            <button
              key={t}
              onClick={() => { setInputVal(t); searchSpikes(t) }}
              className={cn(
                'text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors',
                isDark ? 'border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-400' : 'border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={cn('rounded-xl border p-4 text-sm', isDark ? 'bg-red-900/20 border-red-800/40 text-red-300' : 'bg-red-50 border-red-200 text-red-600')}>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className={cn('rounded-2xl border p-6 space-y-3', card)}>
          {[1, 2, 3].map(i => (
            <div key={i} className={cn('h-16 rounded-xl animate-pulse', isDark ? 'bg-gray-700' : 'bg-slate-100')} />
          ))}
        </div>
      )}

      {/* Spike list */}
      {!loading && spikes.length > 0 && (
        <div className="space-y-3">
          <p className={cn('text-sm font-semibold', sub)}>
            {spikes.length} spike{spikes.length !== 1 ? 's' : ''} found for <span className={text}>{ticker}</span> — click any to explain
          </p>

          {spikes.map((spike, i) => {
            const pos = spike.changePercent >= 0
            return (
              <div key={spike.date} className={cn('rounded-2xl border p-5 space-y-3', card)}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                      pos ? 'bg-green-500/15' : 'bg-red-500/15'
                    )}>
                      {pos
                        ? <TrendingUp className="h-5 w-5 text-green-400" />
                        : <TrendingDown className="h-5 w-5 text-red-400" />
                      }
                    </div>
                    <div>
                      <p className={cn('text-sm font-bold', text)}>{spike.date}</p>
                      <p className={cn('text-xs', sub)}>Open ${spike.open?.toFixed(2)} → Close ${spike.close?.toFixed(2)}</p>
                    </div>
                  </div>
                  <span className={cn('text-xl font-black', pos ? 'text-green-400' : 'text-red-400')}>
                    {pos ? '+' : ''}{spike.changePercent.toFixed(2)}%
                  </span>
                </div>

                {/* Summary area */}
                {spike.summary ? (
                  <div className={cn('rounded-xl p-4 flex gap-3', isDark ? 'bg-gray-900/60 border border-gray-700' : 'bg-slate-50 border border-slate-200')}>
                    <MrGuyHead px={3} className="mt-0.5 shrink-0" />
                    <p className={cn('text-sm leading-relaxed', isDark ? 'text-gray-200' : 'text-slate-700')}>{spike.summary}</p>
                  </div>
                ) : spike.limitReached ? (
                  <ProLimitBanner feature="spike-summary" />
                ) : (
                  <button
                    onClick={() => explainSpike(i)}
                    disabled={spike.loading}
                    className={cn(
                      'w-full py-2.5 rounded-xl text-sm font-semibold transition-colors',
                      spike.loading
                        ? 'opacity-50 cursor-not-allowed'
                        : isDark
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    )}
                  >
                    {spike.loading ? 'Mr. Guy is thinking...' : '🧑‍💼 Explain this move'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {limitReached && <ProLimitBanner feature="spike-summary" />}

      <p className="text-xs text-center pb-4" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>
        Spike explanations are AI-generated and based on publicly available news. For informational purposes only — not financial advice.
      </p>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes mrg-idle { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
      ` }} />
    </div>
  )
}
