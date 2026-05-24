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

interface IndexData {
  ticker: string
  price: number
  changePercent: number
  change: number
}

interface BriefingData {
  briefing: string
  indices: {
    spy: IndexData | null
    qqq: IndexData | null
    dia: IndexData | null
  }
  date: string
  headlines: string[]
}

// ─── Index card component ─────────────────────────────────────────────────────

function IndexCard({
  label,
  data,
  isDark,
  loading,
}: {
  label: string
  data: IndexData | null
  isDark: boolean
  loading: boolean
}) {
  if (loading) {
    return (
      <div className={cn('rounded-xl border p-4 space-y-2 animate-pulse', isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200')}>
        <div className={cn('h-3 w-20 rounded', isDark ? 'bg-gray-700' : 'bg-slate-200')} />
        <div className={cn('h-6 w-28 rounded', isDark ? 'bg-gray-700' : 'bg-slate-200')} />
        <div className={cn('h-4 w-16 rounded', isDark ? 'bg-gray-700' : 'bg-slate-200')} />
      </div>
    )
  }

  const pct = data?.changePercent ?? 0
  const isUp = pct >= 0

  return (
    <div className={cn(
      'rounded-xl border p-3 sm:p-4',
      isUp
        ? isDark ? 'bg-green-900/20 border-green-700/40' : 'bg-green-50 border-green-200'
        : isDark ? 'bg-red-900/20 border-red-700/40' : 'bg-red-50 border-red-200'
    )}>
      <p className={cn('text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1', isDark ? 'text-gray-400' : 'text-slate-500')}>
        {label}
      </p>
      {data ? (
        <>
          <p className={cn('text-base sm:text-xl font-black tabular-nums', isDark ? 'text-white' : 'text-slate-900')}>
            ${data.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
          <p className={cn('text-xs sm:text-sm font-bold mt-0.5', isUp ? 'text-green-400' : 'text-red-400')}>
            {isUp ? '+' : ''}{pct.toFixed(2)}%
          </p>
        </>
      ) : (
        <p className={cn('text-sm', isDark ? 'text-gray-500' : 'text-slate-400')}>Unavailable</p>
      )}
    </div>
  )
}

// ─── Briefing text with styled "Today's vibe:" line ──────────────────────────

function BriefingText({ text, isDark }: { text: string; isDark: boolean }) {
  const vibeIdx = text.toLowerCase().lastIndexOf("today's vibe:")
  if (vibeIdx === -1) {
    return (
      <p className={cn('text-base leading-relaxed whitespace-pre-wrap', isDark ? 'text-gray-200' : 'text-slate-700')}>
        {text}
      </p>
    )
  }

  const before = text.slice(0, vibeIdx)
  const vibeLine = text.slice(vibeIdx)

  return (
    <div className="space-y-3">
      <p className={cn('text-base leading-relaxed whitespace-pre-wrap', isDark ? 'text-gray-200' : 'text-slate-700')}>
        {before}
      </p>
      <p className={cn(
        'text-lg font-black leading-snug',
        isDark ? 'text-[rgb(var(--accent-light,96_165_250))]' : 'text-blue-600'
      )}>
        {vibeLine}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BriefingPage() {
  const { data: session, status } = useSession()
  const { themeId } = useTheme()
  const isDark = themeId !== 'white'

  const [data, setData] = useState<BriefingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    fetch('/api/briefing')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (status === 'loading') return null
  if (!session) return <GuestLock feature="Morning Briefing" />

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
          <div className={loading ? 'mrg-think' : 'mrg-idle'}>
            <MrGuyHead px={5} />
          </div>
          <div>
            <h1 className={cn('text-2xl sm:text-3xl font-extrabold', isDark ? 'text-white' : 'text-slate-900')}>
              Morning Briefing
            </h1>
            <p className={cn('text-base mt-0.5', isDark ? 'text-gray-400' : 'text-slate-500')}>
              {loading ? 'Loading...' : (data?.date ?? new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))}
            </p>
          </div>
        </div>

        {/* Index cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <IndexCard label="S&P 500" data={data?.indices?.spy ?? null} isDark={isDark} loading={loading} />
          <IndexCard label="NASDAQ" data={data?.indices?.qqq ?? null} isDark={isDark} loading={loading} />
          <IndexCard label="DOW" data={data?.indices?.dia ?? null} isDark={isDark} loading={loading} />
        </div>

        {/* Briefing text card */}
        <div className={cn('rounded-2xl border p-7', isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200')}>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={cn('h-4 rounded animate-pulse', isDark ? 'bg-gray-700' : 'bg-slate-200', i === 5 ? 'w-3/5' : 'w-full')} />
              ))}
              <div className="pt-3">
                <div className={cn('h-5 w-2/3 rounded animate-pulse', isDark ? 'bg-gray-700' : 'bg-slate-200')} />
              </div>
            </div>
          ) : data?.briefing ? (
            <div className="flex gap-4">
              <MrGuyHead px={4} className="mt-1 flex-shrink-0" />
              <BriefingText text={data.briefing} isDark={isDark} />
            </div>
          ) : (
            <p className={cn('text-base', isDark ? 'text-gray-400' : 'text-slate-500')}>
              Briefing unavailable right now. Check back soon.
            </p>
          )}
        </div>

        {/* Headlines */}
        <div>
          <h2 className={cn('text-lg font-bold mb-4', isDark ? 'text-white' : 'text-slate-900')}>
            Today's Headlines
          </h2>

          {loading ? (
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={cn('h-8 rounded-full animate-pulse', isDark ? 'bg-gray-800' : 'bg-slate-200')} style={{ width: `${120 + i * 20}px` }} />
              ))}
            </div>
          ) : data?.headlines && data.headlines.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.headlines.map((headline, i) => (
                <span
                  key={i}
                  className={cn(
                    'inline-block px-3 py-1.5 rounded-full text-sm font-medium border',
                    isDark
                      ? 'bg-gray-800/60 border-gray-700 text-gray-300'
                      : 'bg-slate-100 border-slate-200 text-slate-700'
                  )}
                >
                  {headline}
                </span>
              ))}
            </div>
          ) : (
            <p className={cn('text-sm', isDark ? 'text-gray-500' : 'text-slate-400')}>
              No headlines available right now.
            </p>
          )}
        </div>

      </div>

      <p className="text-xs text-gray-500 text-center mt-6 pb-4 px-4">
        Market briefings are AI-generated summaries of publicly available news and market data. They are for informational purposes only — not financial advice. Always verify information independently and consult a qualified professional before making investment decisions.
      </p>
    </>
  )
}
