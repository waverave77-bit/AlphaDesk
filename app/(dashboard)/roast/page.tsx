'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { GuestLock } from '@/components/GuestGate'
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

interface Holding {
  ticker: string
  shares: string
  avgPrice: string
}

function emptyHolding(): Holding {
  return { ticker: '', shares: '', avgPrice: '' }
}

export default function RoastPage() {
  const { data: session, status } = useSession()
  const { themeId } = useTheme()
  const isDark = themeId !== 'white'
  const [holdings, setHoldings] = useState<Holding[]>([emptyHolding(), emptyHolding(), emptyHolding()])
  const [loading, setLoading] = useState(false)
  const [roast, setRoast] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { window.scrollTo(0, 0) }, [])

  function updateHolding(index: number, field: keyof Holding, value: string) {
    setHoldings(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h))
  }

  function addHolding() {
    if (holdings.length >= 8) return
    setHoldings(prev => [...prev, emptyHolding()])
  }

  function removeHolding(index: number) {
    if (holdings.length <= 1) return
    setHoldings(prev => prev.filter((_, i) => i !== index))
  }

  async function handleRoast() {
    const valid = holdings.filter(h => h.ticker.trim())
    if (valid.length === 0) return

    const holdingsSummary = valid.map(h => {
      let desc = h.ticker.trim().toUpperCase()
      if (h.shares) desc += `: ${h.shares} shares`
      if (h.avgPrice) desc += ` at $${h.avgPrice} avg`
      return desc
    }).join(', ')

    const message = `Roast my portfolio. Here are my holdings: ${holdingsSummary}. For each stock, give me one-line brutal honest take (funny is ok). Then give me an overall portfolio grade and one big thing I should change.`

    setLoading(true)
    setRoast('')
    setError('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, experience: 'some', history: [] }),
      })
      if (!res.ok || !res.body) { setError('Something went wrong. Try again.'); return }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setRoast(fullText)
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputBase = cn(
    'rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors',
    isDark
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
  )

  if (status === 'loading') return null
  if (!session) return <GuestLock feature="Portfolio Roast" />

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
              Portfolio Roast
            </h1>
            <p className={cn('text-base mt-1', isDark ? 'text-gray-400' : 'text-slate-500')}>
              Enter your stocks. Mr. Guy will say what he actually thinks.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className={cn('rounded-xl border p-4 text-sm', isDark ? 'bg-gray-800/50 border-gray-700 text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-500')}>
          No brokerage connection needed. Just type in what you own. Shares and avg price are optional but help Mr. Guy give better context.
        </div>

        {/* Holdings input */}
        <div className="space-y-3">
          {/* Column headers */}
          <div className="grid grid-cols-12 gap-2 px-1">
            <p className={cn('col-span-4 text-xs font-bold uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-slate-400')}>Ticker</p>
            <p className={cn('col-span-3 text-xs font-bold uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-slate-400')}>Shares</p>
            <p className={cn('col-span-4 text-xs font-bold uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-slate-400')}>Avg Price</p>
          </div>

          {holdings.map((holding, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input
                value={holding.ticker}
                onChange={e => updateHolding(i, 'ticker', e.target.value.toUpperCase())}
                placeholder="AAPL"
                className={cn(inputBase, 'col-span-4 font-mono uppercase')}
                maxLength={6}
              />
              <input
                value={holding.shares}
                onChange={e => updateHolding(i, 'shares', e.target.value)}
                placeholder="100"
                type="number"
                min="0"
                className={cn(inputBase, 'col-span-3')}
              />
              <input
                value={holding.avgPrice}
                onChange={e => updateHolding(i, 'avgPrice', e.target.value)}
                placeholder="150.00"
                type="number"
                min="0"
                step="0.01"
                className={cn(inputBase, 'col-span-4')}
              />
              <button
                onClick={() => removeHolding(i)}
                disabled={holdings.length <= 1}
                className={cn(
                  'col-span-1 h-9 w-9 rounded-lg flex items-center justify-center text-lg font-bold transition-colors',
                  isDark
                    ? 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-500/40 disabled:opacity-30'
                    : 'bg-slate-100 border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 disabled:opacity-30'
                )}
              >
                x
              </button>
            </div>
          ))}

          {/* Add row button */}
          {holdings.length < 8 && (
            <button
              onClick={addHolding}
              className={cn(
                'w-full py-2.5 rounded-xl border border-dashed text-sm font-medium transition-colors',
                isDark
                  ? 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                  : 'border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600'
              )}
            >
              + Add another stock
            </button>
          )}

          {/* Roast button */}
          <button
            onClick={handleRoast}
            disabled={loading || holdings.every(h => !h.ticker.trim())}
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base transition-colors"
          >
            Roast Me
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-4 py-6">
            <div className="mrg-think">
              <MrGuyHead px={4} />
            </div>
            <p className={cn('text-base font-medium', isDark ? 'text-gray-300' : 'text-slate-600')}>
              Preparing your roasting...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={cn('rounded-xl border p-4 text-sm', isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600')}>
            {error}
          </div>
        )}

        {/* Roast result */}
        {roast && (
          <div className={cn('rounded-2xl border p-6 bubble-pop', isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200')}>
            <div className="flex items-start gap-4">
              <div className="mrg-idle flex-shrink-0">
                <MrGuyHead px={4} />
              </div>
              <div className="space-y-3 min-w-0">
                <p className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-slate-400')}>
                  Mr. Guy's Verdict
                </p>
                <div className={cn('text-base leading-relaxed whitespace-pre-wrap', isDark ? 'text-gray-200' : 'text-slate-700')}>
                  {roast}
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mt-6 px-4">
          Portfolio roasts are AI-generated for entertainment purposes only. They are not financial advice and should not influence any investment decision. Mr. Guy is not a licensed financial advisor. Always do your own research and consult a qualified professional before making any investment decisions.
        </p>
      </div>
    </div>
  )
}
