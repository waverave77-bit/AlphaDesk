'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { GuestLock } from '@/components/GuestGate'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'
import ProLimitBanner from '@/components/ProLimitBanner'

const N = null
const HEAD_PIXELS: Array<Array<string|null>> = [
  [N,    N,    '#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604',N      ],
  [N,    '#2b1604','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#2b1604','#2b1604'],
  ['#2b1604','#5c2e0a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#5c2e0a','#5c2e0a','#2b1604'],
  ['#2b1604','#5c2e0a','#5c2e0a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#5c2e0a','#5c2e0a','#5c2e0a','#2b1604'],
  ['#2b1604','#5c2e0a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#5c2e0a','#2b1604'],
  ['#2b1604','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#2b1604'],
  ['#2b1604','#111118','#111118','#1e3a8a','#1e3a8a','#f5c49a','#f5c49a','#1e3a8a','#1e3a8a','#111118','#111118','#2b1604'],
  ['#2b1604','#111118','#111118','#1e3a8a','#1e3a8a','#111118','#111118','#1e3a8a','#1e3a8a','#111118','#111118','#2b1604'],
  ['#2b1604','#111118','#111118','#111118','#111118','#f5c49a','#f5c49a','#111118','#111118','#111118','#111118','#2b1604'],
  ['#2b1604','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#2b1604'],
  [N,    '#f5c49a','#f5c49a','#f5c49a','#c47a50','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a',N      ],
  [N,    '#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a',N,    N      ],
  [N,    N,    '#f5c49a','#f0f0f0','#f0f0f0','#c01010','#c01010','#f0f0f0','#f0f0f0','#f5c49a',N,    N      ],
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
  return <canvas ref={ref} width={HEAD_COLS * px} height={HEAD_ROWS * px} className={className} style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }} />
}

interface GradeItem {
  grade: string
  note: string
}

interface ReportCardResult {
  ticker: string
  companyName: string
  price: number
  changePercent: number
  grades: {
    valuation: GradeItem
    growth: GradeItem
    momentum: GradeItem
    risk: GradeItem
    fundamentals: GradeItem
  }
  overallGrade: string
  summary: string
}

function gradeColor(grade: string): { bg: string; text: string; border: string } {
  const g = grade.toUpperCase()
  if (g.startsWith('A')) return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' }
  if (g.startsWith('B')) return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' }
  if (g.startsWith('C')) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' }
  return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' }
}

const CATEGORY_LABELS: Record<string, string> = {
  valuation: 'Valuation',
  growth: 'Growth',
  momentum: 'Momentum',
  risk: 'Risk',
  fundamentals: 'Fundamentals',
}

export default function ReportCardPage() {
  const { data: session, status } = useSession()
  const { themeId } = useTheme()
  const isDark = themeId !== 'white'
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReportCardResult | null>(null)
  const [error, setError] = useState('')
  const [limitReached, setLimitReached] = useState(false)
  const [searchResults, setSearchResults] = useState<{ symbol: string; name: string }[]>([])

  useEffect(() => { window.scrollTo(0, 0) }, [])

  async function searchTicker(q: string) {
    if (q.length < 2) { setSearchResults([]); return }
    try {
      const res = await fetch(`/api/search-ticker?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data.results ?? [])
    } catch {
      setSearchResults([])
    }
  }

  async function handleGrade(overrideTicker?: string) {
    const t = (overrideTicker ?? query).trim().toUpperCase()
    if (!t) return
    setLoading(true)
    setResult(null)
    setError('')
    setLimitReached(false)
    setSearchResults([])
    try {
      const res = await fetch(`/api/report-card?ticker=${encodeURIComponent(t)}`)
      const data = await res.json()
      if (data.limitReached) { setLimitReached(true); setLoading(false); return }
      if (data.error) { setError(data.error); return }
      setResult(data)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleGrade()
  }

  const overallStyle = result ? gradeColor(result.overallGrade) : null

  if (status === 'loading') return null
  if (!session) return <GuestLock feature="Report Card" />

  return (
    <div className={cn('min-h-screen transition-colors', isDark ? 'bg-gray-950' : 'bg-slate-50')}>
      <style>{`
        @keyframes mrg-idle  { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
        @keyframes mrg-run   { 0% { transform: translateX(-8px) rotate(-6deg) translateY(0px); } 25% { transform: translateX(0px) rotate(0deg) translateY(-5px); } 50% { transform: translateX(8px) rotate(6deg) translateY(0px); } 75% { transform: translateX(0px) rotate(0deg) translateY(-5px); } 100% { transform: translateX(-8px) rotate(-6deg) translateY(0px); } }
        @keyframes briefcase-swing { 0%, 100% { transform: rotate(-15deg) translateY(2px); } 50% { transform: rotate(15deg) translateY(-2px); } }
        @keyframes bubble-pop { 0% { opacity: 0; transform: scale(0.5) translateY(8px); } 70% { transform: scale(1.05) translateY(-2px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        .mrg-idle  { animation: mrg-idle 2.4s ease-in-out infinite; }
        .mrg-run   { animation: mrg-run 0.55s ease-in-out infinite; }
        .briefcase { animation: briefcase-swing 0.55s ease-in-out infinite; display: inline-block; }
        .bubble-pop { animation: bubble-pop 0.28s cubic-bezier(.34,1.56,.64,1) both; }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-5">
          <div className="mrg-idle">
            <MrGuyHead px={5} />
          </div>
          <div>
            <h1 className={cn('text-2xl sm:text-4xl font-extrabold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              Stock Report Card
            </h1>
            <p className={cn('text-base mt-1', isDark ? 'text-gray-400' : 'text-slate-500')}>
              Any stock. Five grades. One verdict.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <div className="relative flex gap-3">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); searchTicker(e.target.value) }}
                onKeyDown={handleKeyDown}
                placeholder="Ticker or company name (e.g. NVDA or Nvidia)"
                className={cn(
                  'w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors',
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                )}
              />
              {searchResults.length > 0 && (
                <div className={cn(
                  'absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-lg z-10 overflow-hidden',
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
                )}>
                  {searchResults.map(r => (
                    <button
                      key={r.symbol}
                      onClick={() => { setQuery(r.symbol); setSearchResults([]); handleGrade(r.symbol) }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        isDark ? 'hover:bg-gray-700' : 'hover:bg-slate-50'
                      )}
                    >
                      <span className={cn('text-xs font-mono font-bold w-12 shrink-0', isDark ? 'text-orange-400' : 'text-orange-600')}>{r.symbol}</span>
                      <span className={cn('text-sm truncate', isDark ? 'text-gray-300' : 'text-slate-600')}>{r.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => handleGrade()}
              disabled={loading || !query.trim()}
              className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors whitespace-nowrap"
            >
              Grade It
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="flex items-end gap-2">
              <MrGuyHead px={6} className="mrg-run" />
              <span className="text-3xl briefcase">💼</span>
            </div>
            <p className={cn('text-sm font-medium', isDark ? 'text-gray-300' : 'text-slate-600')}>
              Grading on a curve...
            </p>
          </div>
        )}

        {/* Error */}
        {limitReached && <ProLimitBanner feature="report-card" isDark={isDark} />}
        {error && (
          <div className={cn('rounded-xl border p-4 text-sm', isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600')}>
            {error}
          </div>
        )}

        {/* Result */}
        {result && overallStyle && (
          <div className="space-y-5 bubble-pop">
            {/* Company header */}
            <div className={cn('rounded-2xl border p-5 flex items-center justify-between', isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200')}>
              <div>
                <p className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-slate-900')}>{result.ticker}</p>
                <p className={cn('text-sm mt-0.5', isDark ? 'text-gray-400' : 'text-slate-500')}>{result.companyName}</p>
              </div>
              <div className="text-right">
                <p className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>${result.price.toFixed(2)}</p>
                <p className={cn('text-sm font-semibold', result.changePercent >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {result.changePercent >= 0 ? '+' : ''}{result.changePercent.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Overall grade */}
            <div className={cn('rounded-2xl border p-6 flex items-center gap-6', isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200')}>
              <div className={cn('w-24 h-24 rounded-2xl border-2 flex items-center justify-center flex-shrink-0', overallStyle.bg, overallStyle.border)}>
                <span className={cn('text-5xl font-extrabold', overallStyle.text)}>{result.overallGrade}</span>
              </div>
              <div>
                <p className={cn('text-sm font-bold uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-slate-400')}>Overall Grade</p>
                <p className={cn('text-base font-medium mt-1', isDark ? 'text-gray-200' : 'text-slate-700')}>
                  {result.overallGrade.startsWith('A') ? 'Strong stock overall' :
                   result.overallGrade.startsWith('B') ? 'Decent but not perfect' :
                   result.overallGrade.startsWith('C') ? 'Mixed signals across factors' :
                   'Needs serious work'}
                </p>
              </div>
            </div>

            {/* Category grades */}
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(result.grades) as [string, GradeItem][]).map(([cat, item]) => {
                const style = gradeColor(item.grade)
                return (
                  <div key={cat} className={cn('rounded-xl border p-4', isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200')}>
                    <p className={cn('text-xs font-bold uppercase tracking-wider mb-2', isDark ? 'text-gray-500' : 'text-slate-400')}>
                      {CATEGORY_LABELS[cat] ?? cat}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className={cn('text-3xl font-extrabold', style.text)}>{item.grade}</span>
                      <p className={cn('text-xs leading-snug', isDark ? 'text-gray-400' : 'text-slate-500')}>{item.note}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Mr. Guy summary */}
            <div className={cn('rounded-2xl border p-5 flex items-start gap-4', isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200')}>
              <div className="mrg-idle flex-shrink-0">
                <MrGuyHead px={3} />
              </div>
              <div>
                <p className={cn('text-xs font-bold uppercase tracking-wider mb-2', isDark ? 'text-gray-500' : 'text-slate-400')}>Mr. Guy's Take</p>
                <p className={cn('text-base font-medium leading-relaxed', isDark ? 'text-gray-200' : 'text-slate-700')}>
                  "{result.summary}"
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mt-6 px-4">
          Grades are AI-generated using publicly available financial data for informational purposes only. They are not financial advice and should not be the sole basis for any investment decision. Always do your own research.
        </p>
      </div>
    </div>
  )
}
