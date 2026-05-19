'use client'
import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'
import type { BullVsBearResult } from '@/app/api/bull-vs-bear/route'

const N = null
const HEAD_PIXELS: Array<Array<string | null>> = [
  [N,       N,       '#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604',N      ],
  [N,       '#2b1604','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#2b1604','#2b1604'],
  ['#2b1604','#5c2e0a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#5c2e0a','#5c2e0a','#2b1604'],
  ['#2b1604','#5c2e0a','#5c2e0a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#5c2e0a','#5c2e0a','#5c2e0a','#2b1604'],
  ['#2b1604','#5c2e0a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#5c2e0a','#2b1604'],
  ['#2b1604','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#2b1604'],
  ['#2b1604','#111118','#111118','#1e3a8a','#1e3a8a','#f5c49a','#f5c49a','#1e3a8a','#1e3a8a','#111118','#111118','#2b1604'],
  ['#2b1604','#111118','#111118','#1e3a8a','#1e3a8a','#111118','#111118','#1e3a8a','#1e3a8a','#111118','#111118','#2b1604'],
  ['#2b1604','#111118','#111118','#111118','#111118','#f5c49a','#f5c49a','#111118','#111118','#111118','#111118','#2b1604'],
  ['#2b1604','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#2b1604'],
  [N,       '#f5c49a','#f5c49a','#f5c49a','#c47a50','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a',N      ],
  [N,       '#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a',N,       N      ],
  [N,       N,       '#f5c49a','#f0f0f0','#f0f0f0','#c01010','#c01010','#f0f0f0','#f0f0f0','#f5c49a',N,       N      ],
  ['#f0f0f0','#f0f0f0','#f0f0f0','#f0f0f0','#c01010','#c01010','#7a0000','#7a0000','#f0f0f0','#f0f0f0','#f0f0f0','#222236'],
]
const HEAD_COLS = 12, HEAD_ROWS = 14

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
  return (
    <canvas
      ref={ref}
      width={HEAD_COLS * px}
      height={HEAD_ROWS * px}
      className={className}
      style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }}
    />
  )
}

function formatMarketCap(mc: number): string {
  if (mc >= 1_000_000_000_000) return `$${(mc / 1_000_000_000_000).toFixed(1)}T`
  if (mc >= 1_000_000_000) return `$${(mc / 1_000_000_000).toFixed(1)}B`
  if (mc >= 1_000_000) return `$${(mc / 1_000_000).toFixed(0)}M`
  return `$${mc}`
}

export default function BullVsBearPage() {
  const { themeId } = useTheme()
  const isDark = themeId !== 'white'

  const [ticker, setTicker] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BullVsBearResult | null>(null)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string }[]>([])

  useEffect(() => { window.scrollTo(0, 0) }, [])

  async function searchSuggestions(q: string) {
    if (q.length < 2) { setSuggestions([]); return }
    try {
      const res = await fetch(`/api/search-ticker?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSuggestions(data.results ?? [])
    } catch {
      setSuggestions([])
    }
  }

  async function handleFight(overrideTicker?: string) {
    const t = (overrideTicker ?? ticker).trim()
    if (!t) return

    setLoading(true)
    setResult(null)
    setError('')
    setSuggestions([])

    try {
      const res = await fetch('/api/bull-vs-bear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: t }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setResult(data as BullVsBearResult)
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleFight()
    if (e.key === 'Escape') setSuggestions([])
  }

  const changeColor = result
    ? result.changePercent >= 0
      ? isDark ? 'text-green-400' : 'text-green-600'
      : isDark ? 'text-red-400' : 'text-red-500'
    : ''

  const changeSign = result && result.changePercent >= 0 ? '+' : ''

  return (
    <div className={cn('min-h-screen transition-colors', isDark ? 'bg-gray-950' : 'bg-slate-50')}>
      <style>{`
        @keyframes mrg-think { 0%, 100% { transform: translateY(0px) rotate(-2deg); } 50% { transform: translateY(-3px) rotate(2deg); } }
        @keyframes mrg-idle  { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
        @keyframes bubble-pop { 0% { opacity: 0; transform: scale(0.5) translateY(8px); } 70% { transform: scale(1.05) translateY(-2px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        .mrg-think { animation: mrg-think 1.1s ease-in-out infinite; }
        .mrg-idle  { animation: mrg-idle 2.4s ease-in-out infinite; }
        .bubble-pop { animation: bubble-pop 0.28s cubic-bezier(.34,1.56,.64,1) both; }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-center gap-5">
          <div className="mrg-idle">
            <MrGuyHead px={5} />
          </div>
          <div>
            <h1 className={cn('text-4xl font-extrabold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              Bull vs Bear
            </h1>
            <p className={cn('text-base mt-1', isDark ? 'text-gray-400' : 'text-slate-500')}>
              Ticker or company name. Mr. Guy argues both sides — then picks one.
            </p>
          </div>
        </div>

        {/* Input row */}
        <div className="flex gap-3 items-start">
          <div className="relative flex-1">
            <input
              value={ticker}
              onChange={e => { setTicker(e.target.value); searchSuggestions(e.target.value) }}
              onKeyDown={handleKeyDown}
              onBlur={() => setTimeout(() => setSuggestions([]), 150)}
              placeholder="AAPL or Apple"
              maxLength={40}
              className={cn(
                'w-full rounded-xl border px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors',
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-600'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-300'
              )}
            />
            {suggestions.length > 0 && (
              <div className={cn(
                'absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-lg z-10 overflow-hidden',
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
              )}>
                {suggestions.map(r => (
                  <button
                    key={r.symbol}
                    onMouseDown={() => { setTicker(r.symbol); setSuggestions([]); handleFight(r.symbol) }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-slate-50'
                    )}
                  >
                    <span className={cn('text-xs font-mono font-bold w-14 shrink-0', isDark ? 'text-orange-400' : 'text-orange-600')}>{r.symbol}</span>
                    <span className={cn('text-sm truncate', isDark ? 'text-gray-300' : 'text-slate-600')}>{r.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => handleFight()}
            disabled={loading || !ticker.trim()}
            className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base transition-colors whitespace-nowrap"
          >
            🥊 Fight
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-4 py-6">
            <div className="mrg-think">
              <MrGuyHead px={4} />
            </div>
            <p className={cn('text-base font-medium', isDark ? 'text-gray-300' : 'text-slate-600')}>
              Mr. Guy is studying the tape...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={cn('rounded-xl border p-4 text-sm', isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600')}>
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-5 bubble-pop">

            {/* Stock info bar */}
            <div className={cn(
              'rounded-xl border px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm',
              isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200'
            )}>
              <span className={cn('font-mono font-bold text-base', isDark ? 'text-white' : 'text-slate-900')}>
                {result.ticker}
              </span>
              <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-slate-500')}>
                {result.companyName}
              </span>
              <span className={cn('font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                ${result.price.toFixed(2)}
              </span>
              <span className={cn('font-medium', changeColor)}>
                {changeSign}{result.changePercent.toFixed(2)}%
              </span>
            </div>

            {/* Bull / Bear debate cards */}
            <div className="flex flex-col sm:flex-row gap-4">

              {/* Bull Case */}
              <div className={cn(
                'flex-1 rounded-2xl border p-5 space-y-2',
                isDark
                  ? 'bg-green-950/30 border-green-700/40'
                  : 'bg-green-50 border-green-200'
              )}>
                <p className={cn('font-bold text-base', isDark ? 'text-green-400' : 'text-green-700')}>
                  🐂 The Bull Case
                </p>
                <div className={cn(
                  'text-sm leading-relaxed overflow-y-auto max-h-60',
                  isDark ? 'text-gray-200' : 'text-slate-700'
                )}>
                  {result.bullCase}
                </div>
              </div>

              {/* Bear Case */}
              <div className={cn(
                'flex-1 rounded-2xl border p-5 space-y-2',
                isDark
                  ? 'bg-red-950/30 border-red-700/40'
                  : 'bg-red-50 border-red-200'
              )}>
                <p className={cn('font-bold text-base', isDark ? 'text-red-400' : 'text-red-700')}>
                  🐻 The Bear Case
                </p>
                <div className={cn(
                  'text-sm leading-relaxed overflow-y-auto max-h-60',
                  isDark ? 'text-gray-200' : 'text-slate-700'
                )}>
                  {result.bearCase}
                </div>
              </div>
            </div>

            {/* Verdict */}
            <div className={cn(
              'rounded-2xl border p-5 flex items-start gap-4',
              isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200'
            )}>
              <div className="mrg-idle flex-shrink-0">
                <MrGuyHead px={4} />
              </div>
              <div className="space-y-3 min-w-0 flex-1">
                <p className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-slate-400')}>
                  Mr. Guy&apos;s Verdict
                </p>
                <p className={cn('text-base leading-relaxed', isDark ? 'text-gray-200' : 'text-slate-700')}>
                  {result.verdictText}
                </p>
                <div>
                  {result.verdict === 'bull' ? (
                    <span className={cn(
                      'inline-block px-4 py-1.5 rounded-full font-extrabold text-sm tracking-wide',
                      isDark ? 'bg-green-500/20 text-green-300 border border-green-600/40' : 'bg-green-100 text-green-700 border border-green-300'
                    )}>
                      BULL 📈
                    </span>
                  ) : (
                    <span className={cn(
                      'inline-block px-4 py-1.5 rounded-full font-extrabold text-sm tracking-wide',
                      isDark ? 'bg-red-500/20 text-red-300 border border-red-600/40' : 'bg-red-100 text-red-700 border border-red-300'
                    )}>
                      BEAR 📉
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
