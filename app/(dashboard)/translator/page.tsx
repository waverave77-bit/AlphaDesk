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

interface TranslatorResult {
  translated: string
  redFlags?: string[]
}

const PLACEHOLDERS = {
  jargon: "Paste any confusing finance text here... e.g. 'The stock is trading at a forward P/E of 42x on consensus FY26 EBITDA estimates with a 15% FCF yield, implying significant multiple compression risk given the current macro headwinds.'",
  earnings: "Paste an earnings call excerpt here... e.g. CEO saying 'We're seeing some normalization in demand dynamics while we continue to optimize our go-to-market motion to drive sustainable top-line growth...'",
}

export default function TranslatorPage() {
  const { themeId } = useTheme()
  const isDark = themeId !== 'white'
  const [mode, setMode] = useState<'jargon' | 'earnings'>('jargon')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TranslatorResult | null>(null)
  const [error, setError] = useState('')
  const [limitReached, setLimitReached] = useState(false)

  useEffect(() => { window.scrollTo(0, 0) }, [])

  function handleModeSwitch(newMode: 'jargon' | 'earnings') {
    setMode(newMode)
    setResult(null)
    setError('')
    setLimitReached(false)
  }

  async function handleTranslate() {
    if (!text.trim()) return
    setLoading(true)
    setResult(null)
    setError('')
    setLimitReached(false)
    try {
      const res = await fetch('/api/translator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), mode }),
      })
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
              Finance Translator
            </h1>
            <p className={cn('text-base mt-1', isDark ? 'text-gray-400' : 'text-slate-500')}>
              Paste confusing finance text. Get it back in English.
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className={cn('flex rounded-xl p-1 gap-1', isDark ? 'bg-gray-800' : 'bg-slate-200')}>
          {(['jargon', 'earnings'] as const).map(m => (
            <button
              key={m}
              onClick={() => handleModeSwitch(m)}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all',
                mode === m
                  ? isDark ? 'bg-gray-700 text-white shadow' : 'bg-white text-slate-900 shadow'
                  : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {m === 'jargon' ? 'Jargon Translator' : 'Earnings Call Decoder'}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="space-y-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={6}
            placeholder={PLACEHOLDERS[mode]}
            className={cn(
              'w-full rounded-xl border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors',
              isDark
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
            )}
          />
          <button
            onClick={handleTranslate}
            disabled={loading || !text.trim()}
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base transition-colors"
          >
            Translate It
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-4 py-6">
            <div className="mrg-think">
              <MrGuyHead px={4} />
            </div>
            <p className={cn('text-base font-medium', isDark ? 'text-gray-300' : 'text-slate-600')}>
              Decoding the wall street speak...
            </p>
          </div>
        )}

        {/* Error */}
        {limitReached && <ProLimitBanner feature="translator" isDark={isDark} />}
        {error && (
          <div className={cn('rounded-xl border p-4 text-sm', isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600')}>
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={cn('rounded-2xl border p-6 space-y-5 bubble-pop', isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200')}>
            {/* Plain English */}
            <div className="space-y-2">
              <p className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-slate-400')}>
                {mode === 'earnings' ? 'Plain English' : 'Translation'}
              </p>
              <p className={cn('text-base leading-relaxed', isDark ? 'text-gray-200' : 'text-slate-700')}>
                {result.translated}
              </p>
            </div>

            {/* Red flags (earnings mode) */}
            {mode === 'earnings' && (
              <div>
                {result.redFlags && result.redFlags.length > 0 ? (
                  <div className={cn('rounded-xl border p-4 space-y-3', isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200')}>
                    <p className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-red-400' : 'text-red-600')}>
                      🚨 Red Flags
                    </p>
                    <ul className="space-y-2">
                      {result.redFlags.map((flag, i) => (
                        <li key={i} className={cn('text-sm leading-snug flex gap-2', isDark ? 'text-red-300' : 'text-red-700')}>
                          <span className="flex-shrink-0">🚨</span>
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className={cn('rounded-xl border p-4', isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200')}>
                    <p className={cn('text-sm font-medium', isDark ? 'text-green-400' : 'text-green-700')}>
                      ✅ No red flags detected. Sounds pretty straightforward.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mt-6 px-4">
          Translations are AI-generated for informational and educational purposes only. They are not financial advice. Always verify the original source and consult a qualified professional before making investment decisions.
        </p>
      </div>
    </div>
  )
}
