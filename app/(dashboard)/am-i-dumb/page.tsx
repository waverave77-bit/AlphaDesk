'use client'
import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'

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

interface Result {
  verdict: string
  analysis: string
}

type VerdictKey = 'SMART MOVE' | 'RISKY' | 'NOT GREAT' | 'ACTUALLY DUMB'

const VERDICT_CONFIG: Record<VerdictKey, { bg: string; border: string; text: string }> = {
  'SMART MOVE': { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400' },
  'RISKY': { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400' },
  'NOT GREAT': { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400' },
  'ACTUALLY DUMB': { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400' },
}

function getVerdictStyle(verdict: string) {
  const upper = verdict.toUpperCase()
  for (const key of Object.keys(VERDICT_CONFIG) as VerdictKey[]) {
    if (upper.includes(key)) return VERDICT_CONFIG[key]
  }
  return VERDICT_CONFIG['RISKY']
}

function parseAnalysis(text: string) {
  const verdictMatch = text.match(/VERDICT:\s*(.+?)(?:\n|$)/i)
  const whyMatch = text.match(/WHY:\s*([\s\S]*?)(?=IF YOU DO IT:|$)/i)
  const ifMatch = text.match(/IF YOU DO IT:\s*([\s\S]*?)(?=BOTTOM LINE:|$)/i)
  const bottomMatch = text.match(/BOTTOM LINE:\s*([\s\S]*?)$/i)
  return {
    verdict: verdictMatch?.[1]?.trim() ?? '',
    why: whyMatch?.[1]?.trim() ?? '',
    ifYouDoIt: ifMatch?.[1]?.trim() ?? '',
    bottomLine: bottomMatch?.[1]?.trim() ?? '',
  }
}

export default function AmIDumbPage() {
  const { themeId } = useTheme()
  const isDark = themeId !== 'white'
  const [trade, setTrade] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  useEffect(() => { window.scrollTo(0, 0) }, [])

  async function handleCheck() {
    if (!trade.trim()) return
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const res = await fetch('/api/am-i-dumb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trade: trade.trim() }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setResult(data)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const parsed = result ? parseAnalysis(result.analysis) : null
  const style = parsed ? getVerdictStyle(parsed.verdict) : getVerdictStyle('RISKY')

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

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-5">
          <div className="mrg-idle">
            <MrGuyHead px={5} />
          </div>
          <div>
            <h1 className={cn('text-4xl font-extrabold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              Am I Dumb?
            </h1>
            <p className={cn('text-base mt-1', isDark ? 'text-gray-400' : 'text-slate-500')}>
              Describe a trade you're thinking about. Mr. Guy will be brutally honest.
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-3">
          <textarea
            value={trade}
            onChange={e => setTrade(e.target.value)}
            rows={4}
            placeholder={`e.g. 'I'm thinking about buying Tesla puts because Elon seems distracted' or 'Should I buy the dip on COIN?'`}
            className={cn(
              'w-full rounded-xl border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors',
              isDark
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
            )}
          />
          <button
            onClick={handleCheck}
            disabled={loading || !trade.trim()}
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base transition-colors"
          >
            Be Honest With Me
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-4 py-6">
            <div className="mrg-think">
              <MrGuyHead px={4} />
            </div>
            <p className={cn('text-base font-medium', isDark ? 'text-gray-300' : 'text-slate-600')}>
              Consulting my completely unbiased opinion...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={cn('rounded-xl border p-4 text-sm', isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600')}>
            {error}
          </div>
        )}

        {/* Result */}
        {result && parsed && (
          <div className={cn('rounded-2xl border p-6 space-y-5 bubble-pop', isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200')}>
            {/* Verdict badge */}
            <div className={cn('inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-lg font-extrabold', style.bg, style.border, style.text)}>
              {parsed.verdict}
            </div>

            {/* Why */}
            {parsed.why && (
              <div className="space-y-1">
                <p className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-slate-400')}>Why</p>
                <p className={cn('text-base leading-relaxed', isDark ? 'text-gray-200' : 'text-slate-700')}>
                  {parsed.why}
                </p>
              </div>
            )}

            {/* If you do it */}
            {parsed.ifYouDoIt && (
              <div className={cn('rounded-xl border p-4', isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200')}>
                <p className={cn('text-xs font-bold uppercase tracking-wider mb-1', isDark ? 'text-blue-400' : 'text-blue-500')}>If You Do It</p>
                <p className={cn('text-sm leading-relaxed', isDark ? 'text-gray-200' : 'text-slate-700')}>
                  {parsed.ifYouDoIt}
                </p>
              </div>
            )}

            {/* Bottom line */}
            {parsed.bottomLine && (
              <div className={cn('rounded-xl border p-4', isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-slate-50 border-slate-200')}>
                <p className={cn('text-xs font-bold uppercase tracking-wider mb-1', isDark ? 'text-gray-500' : 'text-slate-400')}>Bottom Line</p>
                <p className={cn('text-base font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                  {parsed.bottomLine}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 text-center mt-6 px-4">This analysis is AI-generated using publicly available financial data for informational purposes only. It is not financial advice, and should not be the sole basis for any investment decision. Always consult a qualified financial professional before acting on any analysis.</p>
    </div>
  )
}
