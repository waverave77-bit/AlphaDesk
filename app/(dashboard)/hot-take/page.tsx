'use client'

import { useSession } from 'next-auth/react'
import { GuestLock } from '@/components/GuestGate'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/ThemeProvider'

// ─── Mr. Guy pixel head ───────────────────────────────────────────────────────

const N = null
const HEAD_PIXELS: Array<Array<string | null>> = [
  [N,       N,        '#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604', N      ],
  [N,       '#2b1604','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#2b1604','#2b1604'],
  ['#2b1604','#5c2e0a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#5c2e0a','#5c2e0a','#2b1604'],
  ['#2b1604','#5c2e0a','#5c2e0a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#5c2e0a','#5c2e0a','#5c2e0a','#2b1604'],
  ['#2b1604','#5c2e0a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#5c2e0a','#2b1604'],
  ['#2b1604','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#2b1604'],
  ['#2b1604','#111118','#111118','#1e3a8a','#1e3a8a','#f5c49a','#f5c49a','#1e3a8a','#1e3a8a','#111118','#111118','#2b1604'],
  ['#2b1604','#111118','#111118','#1e3a8a','#1e3a8a','#111118','#111118','#1e3a8a','#1e3a8a','#111118','#111118','#2b1604'],
  ['#2b1604','#111118','#111118','#111118','#111118','#f5c49a','#f5c49a','#111118','#111118','#111118','#111118','#2b1604'],
  ['#2b1604','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#2b1604'],
  [N,       '#f5c49a','#f5c49a','#f5c49a','#c47a50','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a', N      ],
  [N,       '#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a', N,        N      ],
  [N,       N,        '#f5c49a','#f0f0f0','#f0f0f0','#c01010','#c01010','#f0f0f0','#f0f0f0','#f5c49a', N,        N      ],
  ['#f0f0f0','#f0f0f0','#f0f0f0','#f0f0f0','#c01010','#c01010','#7a0000','#7a0000','#f0f0f0','#f0f0f0','#f0f0f0','#222236'],
]
const HEAD_COLS = 12
const HEAD_ROWS = 14

function MrGuyHead({ px = 3, className }: { px?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface HotTake {
  ticker: string
  companyName: string
  price: number
  changePercent: number
  hotTake: string
  verdict: 'bullish' | 'bearish' | 'chaotic'
}

interface MiniQuote {
  ticker: string
  companyName: string
  price: number
  changePercent: number
}

const WATCH_TICKERS = ['AAPL', 'NVDA', 'TSLA', 'META']
const WATCH_NAMES: Record<string, string> = {
  AAPL: 'Apple',
  NVDA: 'NVIDIA',
  TSLA: 'Tesla',
  META: 'Meta',
}

const VERDICT_CONFIG = {
  bullish: { label: 'Bullish', icon: '🚀', bg: 'bg-green-500/20 border-green-500/40 text-green-400' },
  bearish: { label: 'Bearish', icon: '💀', bg: 'bg-red-500/20 border-red-500/40 text-red-400' },
  chaotic: { label: 'Chaotic', icon: '🎲', bg: 'bg-amber-500/20 border-amber-500/40 text-amber-400' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HotTakePage() {
  const { themeId } = useTheme()
  const isDark = themeId !== 'white'

  const [hotTake, setHotTake] = useState<HotTake | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [miniQuotes, setMiniQuotes] = useState<Record<string, MiniQuote>>({})

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    fetch('/api/hot-take')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return }
        setHotTake(d)
      })
      .catch(() => setError('Failed to load hot take'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    WATCH_TICKERS.forEach((ticker) => {
      fetch(`/api/stock/${ticker}`)
        .then((r) => r.json())
        .then((d) => {
          const q = d?.quote
          if (!q) return
          setMiniQuotes((prev) => ({
            ...prev,
            [ticker]: {
              ticker,
              companyName: q.companyName ?? WATCH_NAMES[ticker],
              price: q.price ?? 0,
              changePercent: q.changePercent ?? 0,
            },
          }))
        })
        .catch(() => {})
    })
  }, [])

  const verdict = hotTake ? VERDICT_CONFIG[hotTake.verdict] : null

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes mrg-think {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-3px) rotate(2deg); }
        }
        @keyframes mrg-idle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .mrg-think { animation: mrg-think 1.1s ease-in-out infinite; }
        .mrg-idle  { animation: mrg-idle 2.4s ease-in-out infinite; }
      ` }} />

      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="mrg-idle">
            <MrGuyHead px={5} />
          </div>
          <div>
            <h1 className={cn('text-3xl font-extrabold', isDark ? 'text-white' : 'text-slate-900')}>
              Mr. Guy's Hot Take
            </h1>
            <p className={cn('text-base mt-0.5', isDark ? 'text-gray-400' : 'text-slate-500')}>
              One under-$100 stock Mr. Guy is watching closely. This is speculative commentary, not a recommendation. 🚀
            </p>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className={cn(
            'rounded-2xl border p-10 flex flex-col items-center gap-5',
            isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200'
          )}>
            <div className="mrg-think">
              <MrGuyHead px={5} />
            </div>
            <p className={cn('text-lg font-semibold', isDark ? 'text-gray-300' : 'text-slate-600')}>
              Finding today's under-$100 gem...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className={cn(
            'rounded-2xl border p-8 text-center',
            isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200'
          )}>
            <p className={cn('text-lg', isDark ? 'text-red-400' : 'text-red-500')}>
              Couldn't load today's take. Try again later.
            </p>
          </div>
        )}

        {/* Main hot take card */}
        {hotTake && !loading && (
          <div className={cn(
            'rounded-2xl border p-7 space-y-5',
            isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200'
          )}>
            {/* Ticker + verdict row */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className={cn('text-4xl font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                    {hotTake.ticker}
                  </span>
                  <span className={cn('text-lg font-medium', isDark ? 'text-gray-400' : 'text-slate-500')}>
                    {hotTake.companyName}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                    ${hotTake.price.toFixed(2)}
                  </span>
                  <span className={cn(
                    'text-base font-semibold',
                    hotTake.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                  )}>
                    {hotTake.changePercent >= 0 ? '+' : ''}{hotTake.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {verdict && (
                <span className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold',
                  verdict.bg
                )}>
                  {verdict.icon} {verdict.label}
                </span>
              )}
            </div>

            {/* Speech bubble */}
            <div className={cn(
              'rounded-xl p-5 relative',
              isDark ? 'bg-gray-900/70 border border-gray-700' : 'bg-slate-50 border border-slate-200'
            )}>
              <div className="flex items-start gap-3">
                <MrGuyHead px={3} className="mt-0.5 flex-shrink-0" />
                <p className={cn('text-base leading-relaxed', isDark ? 'text-gray-200' : 'text-slate-700')}>
                  {hotTake.hotTake}
                </p>
              </div>
            </div>

            <p className={cn('text-xs text-right', isDark ? 'text-gray-600' : 'text-slate-400')}>
              New pick every day · always under $100
            </p>
          </div>
        )}

        {/* More hot stocks section */}
        <div>
          <h2 className={cn('text-lg font-bold mb-4', isDark ? 'text-white' : 'text-slate-900')}>
            Tracked Stocks
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {WATCH_TICKERS.map((ticker) => {
              const q = miniQuotes[ticker]
              return (
                <div
                  key={ticker}
                  className={cn(
                    'rounded-xl border p-4 space-y-1',
                    isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200'
                  )}
                >
                  <p className={cn('text-sm font-extrabold', isDark ? 'text-white' : 'text-slate-900')}>
                    {ticker}
                  </p>
                  <p className={cn('text-xs truncate', isDark ? 'text-gray-500' : 'text-slate-400')}>
                    {WATCH_NAMES[ticker]}
                  </p>
                  {q ? (
                    <>
                      <p className={cn('text-base font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                        ${q.price.toFixed(2)}
                      </p>
                      <p className={cn(
                        'text-xs font-semibold',
                        q.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                      )}>
                        {q.changePercent >= 0 ? '+' : ''}{q.changePercent.toFixed(2)}%
                      </p>
                    </>
                  ) : (
                    <div className={cn('h-8 rounded animate-pulse', isDark ? 'bg-gray-700' : 'bg-slate-100')} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>

      <p className="text-xs text-gray-600 text-center mt-6 max-w-2xl mx-auto">Hot takes are AI-generated commentary based on recent price and sentiment data. They are for entertainment and informational purposes only — not financial advice. Always do your own research before making investment decisions.</p>
    </>
  )
}
