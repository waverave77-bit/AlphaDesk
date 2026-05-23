'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { GuestLock } from '@/components/GuestGate'
import { cn } from '@/lib/utils'
import ProLimitBanner from '@/components/ProLimitBanner'
import { useTheme } from '@/components/ThemeProvider'
import { Send } from 'lucide-react'

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

const STYLES = `
@keyframes mrg-idle  { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
@keyframes mrg-run {
  0%   { transform: translateX(-8px) rotate(-6deg) translateY(0px); }
  25%  { transform: translateX(0px) rotate(0deg) translateY(-5px); }
  50%  { transform: translateX(8px) rotate(6deg) translateY(0px); }
  75%  { transform: translateX(0px) rotate(0deg) translateY(-5px); }
  100% { transform: translateX(-8px) rotate(-6deg) translateY(0px); }
}
@keyframes briefcase-swing {
  0%, 100% { transform: rotate(-15deg) translateY(2px); }
  50%       { transform: rotate(15deg) translateY(-2px); }
}
@keyframes bubble-pop { 0% { opacity: 0; transform: scale(0.5) translateY(8px); } 70% { transform: scale(1.05) translateY(-2px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
.mrg-idle    { animation: mrg-idle 2.4s ease-in-out infinite; }
.mrg-run     { animation: mrg-run 0.55s ease-in-out infinite; }
.briefcase   { animation: briefcase-swing 0.55s ease-in-out infinite; display: inline-block; }
.bubble-pop  { animation: bubble-pop 0.28s cubic-bezier(.34,1.56,.64,1) both; }
`

type Verdict = 'SOLID IDEA' | 'RISKY BUT COULD WORK' | 'SKETCHY' | 'NOPE'

interface Result {
  verdict: string
  whatsReal: string
  theCatch: string
  bottomLine: string
  tickersFound: string[]
}

const EXAMPLES = [
  'NVDA is going to $2000 because of AI hype',
  'AMC is about to squeeze again, trust me bro',
  "I'm thinking about buying Tesla puts because Elon seems distracted",
  'Should I buy the dip on COIN right now?',
  'Buying GME because it memed before and it can meme again',
]

function verdictStyle(v: string): { bg: string; text: string; border: string; emoji: string } {
  const upper = v.toUpperCase()
  if (upper.includes('SOLID')) return { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30', emoji: '✅' }
  if (upper.includes('RISKY')) return { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30', emoji: '⚠️' }
  if (upper.includes('SKETCHY')) return { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', emoji: '🤨' }
  return { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', emoji: '❌' }
}

export default function RealityCheckPage() {
  const { data: session, status } = useSession()
  const { themeId } = useTheme()
  const isDark = themeId !== 'white'

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [limitReached, setLimitReached] = useState(false)

  useEffect(() => { window.scrollTo(0, 0) }, [])

  async function check() {
    if (!input.trim()) return
    setLoading(true)
    setResult(null)
    setError('')
    setLimitReached(false)
    try {
      const res = await fetch('/api/reality-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      const data = await res.json()
      if (data.limitReached) { setLimitReached(true); setLoading(false); return }
      if (data.error) { setError('Something went wrong — try again'); return }
      setResult(data)
    } catch {
      setError('Something went wrong — try again')
    } finally {
      setLoading(false)
    }
  }

  const style = result ? verdictStyle(result.verdict) : null

  if (status === 'loading') return null
  if (!session) return <GuestLock feature="Reality Check" />

  return (
    <div className={cn('min-h-screen', isDark ? 'bg-gray-950' : 'bg-slate-50')}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <MrGuyHead px={5} className={cn('rounded-lg', loading ? 'mrg-run' : 'mrg-idle')} />
          <div>
            <h1 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>
              Reality Check
            </h1>
            <p className={cn('text-sm mt-0.5', isDark ? 'text-gray-400' : 'text-slate-500')}>
              Stock tip? Trade idea? Heard something sketchy? Mr. Guy checks it against real data.
            </p>
          </div>
        </div>

        {/* Input area */}
        <div className={cn('rounded-2xl border p-5 space-y-4', isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200')}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) check() }}
            placeholder={"Type anything — a tip you heard, a trade you're thinking about, or a claim you want to fact-check...\n\ne.g. 'NVDA is going to $2000 because of AI'"}
            rows={4}
            className={cn(
              'w-full px-3 py-2.5 rounded-xl border text-sm resize-none leading-relaxed',
              isDark ? 'bg-gray-700/60 border-gray-600 text-white placeholder-gray-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            )}
          />
          <div className="flex items-center justify-between">
            <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-slate-400')}>
              Works for tips, trade ideas, claims — anything finance related
            </p>
            <button
              onClick={check}
              disabled={loading || !input.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm transition-colors disabled:opacity-40"
            >
              {loading ? 'Checking...' : 'Check It'}
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex items-end gap-2">
              <MrGuyHead px={6} className="mrg-run" />
              <span className="text-3xl briefcase">💼</span>
            </div>
            <p className={cn('text-sm font-medium', isDark ? 'text-gray-300' : 'text-slate-600')}>Running the numbers...</p>
            <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-slate-400')}>Checking live data + asking Mr. Guy</p>
          </div>
        )}

        {/* Error */}
        {limitReached && <ProLimitBanner feature="reality-check" isDark={isDark} />}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Result */}
        {result && style && !loading && (
          <div className="space-y-4 bubble-pop">

            {/* Tickers found */}
            {result.tickersFound.length > 0 && (
              <div className={cn('flex items-center gap-2 text-xs', isDark ? 'text-gray-500' : 'text-slate-400')}>
                <span>Checked live data for:</span>
                {result.tickersFound.map(t => (
                  <span key={t} className={cn('px-2 py-0.5 rounded-full font-mono font-semibold', isDark ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-600')}>
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Verdict banner */}
            <div className={cn('rounded-2xl border px-5 py-4 flex items-center gap-3', style.bg, style.border)}>
              <span className="text-2xl">{style.emoji}</span>
              <div>
                <p className={cn('text-xs font-semibold uppercase tracking-wider mb-0.5', isDark ? 'text-gray-400' : 'text-slate-500')}>Mr. Guy's Verdict</p>
                <p className={cn('text-xl font-black', style.text)}>{result.verdict}</p>
              </div>
            </div>

            {/* What's Real */}
            {result.whatsReal && (
              <div className={cn('rounded-2xl border p-5 space-y-2', isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200')}>
                <p className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-gray-400' : 'text-slate-500')}>What's Real</p>
                <p className={cn('text-sm leading-relaxed', isDark ? 'text-gray-200' : 'text-slate-700')}>{result.whatsReal}</p>
              </div>
            )}

            {/* The Catch */}
            {result.theCatch && (
              <div className={cn('rounded-2xl border p-5 space-y-2', isDark ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200')}>
                <p className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-yellow-400/70' : 'text-yellow-600')}>The Catch</p>
                <p className={cn('text-sm leading-relaxed', isDark ? 'text-gray-200' : 'text-slate-700')}>{result.theCatch}</p>
              </div>
            )}

            {/* Bottom Line */}
            {result.bottomLine && (
              <div className="flex items-start gap-3">
                <MrGuyHead px={3} className="mt-0.5 shrink-0" />
                <div className={cn('flex-1 rounded-2xl border px-4 py-3', isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200')}>
                  <p className={cn('text-xs font-semibold uppercase tracking-wider mb-1', isDark ? 'text-orange-400' : 'text-orange-600')}>Bottom Line</p>
                  <p className={cn('text-sm font-medium leading-relaxed', isDark ? 'text-white' : 'text-slate-900')}>{result.bottomLine}</p>
                </div>
              </div>
            )}

            {/* Try another */}
            <button
              onClick={() => { setResult(null); setInput('') }}
              className={cn('text-sm', isDark ? 'text-gray-500 hover:text-gray-300' : 'text-slate-400 hover:text-slate-600')}
            >
              Check something else
            </button>
          </div>
        )}

        {/* Examples (shown when no result) */}
        {!result && !loading && (
          <div className="space-y-3">
            <p className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-slate-400')}>Try these</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map(ex => (
                <button
                  key={ex}
                  onClick={() => setInput(ex)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full border transition-colors text-left',
                    isDark ? 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  )}
                >
                  "{ex}"
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mt-6 px-4">
          Reality Check uses AI and publicly available data to evaluate financial claims. Results are for informational and educational purposes only — not financial advice. AI analysis can be incorrect or incomplete. Always verify claims independently before making any investment decisions.
        </p>
      </div>
    </div>
  )
}
