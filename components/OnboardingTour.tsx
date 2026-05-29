'use client'
import { useState, useEffect, useRef } from 'react'
import { ChevronRight, X, ArrowRight } from 'lucide-react'

/* ── Mr. Guy pixel head ─────────────────────────────────────────────── */
const N = null
const HEAD: Array<Array<string|null>> = [
  [N,'#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604','#2b1604',N,N],
  ['#2b1604','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#5c2e0a','#2b1604','#2b1604',N],
  ['#2b1604','#5c2e0a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#8b4c1a','#5c2e0a','#5c2e0a','#2b1604',N],
  ['#2b1604','#5c2e0a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#5c2e0a','#2b1604',N],
  ['#2b1604','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#2b1604',N],
  ['#2b1604','#111118','#111118','#1e3a8a','#1e3a8a','#f5c49a','#f5c49a','#1e3a8a','#1e3a8a','#111118','#2b1604',N],
  ['#2b1604','#111118','#111118','#1e3a8a','#1e3a8a','#111118','#111118','#1e3a8a','#1e3a8a','#111118','#2b1604',N],
  ['#2b1604','#111118','#111118','#111118','#111118','#f5c49a','#f5c49a','#111118','#111118','#111118','#2b1604',N],
  ['#2b1604','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#2b1604',N],
  [N,'#f5c49a','#f5c49a','#c47a50','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a','#f5c49a',N,N],
  [N,N,'#f5c49a','#f0f0f0','#f0f0f0','#c01010','#c01010','#f0f0f0','#f0f0f0',N,N,N],
  ['#f0f0f0','#f0f0f0','#f0f0f0','#c01010','#c01010','#7a0000','#7a0000','#f0f0f0','#f0f0f0','#0f0f1a','#181828',N],
]
function MrGuyHead({ px = 4 }: { px?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, c.width, c.height)
    HEAD.forEach((row, r) => row.forEach((col, c2) => {
      if (!col) return
      ctx.fillStyle = col
      ctx.fillRect(c2 * px, r * px, px, px)
    }))
  }, [px])
  return <canvas ref={ref} width={12 * px} height={12 * px} style={{ imageRendering: 'pixelated', display: 'block' }} />
}

/* ── Steps ───────────────────────────────────────────────────────────── */
type Step = {
  lines: string[]
  expandedTitle?: string
  expandedLines?: string[]
  tryHref?: string       // navigate user directly to the feature
  tryLabel?: string      // label on the "Try it" button
  nextLabel: string
}

const STEPS: Step[] = [
  {
    lines: ["Hey! I'm Mr. Guy 👋", "I'm your AI investing sidekick.", "Want a quick 30-second tour?"],
    nextLabel: "Let's go! →",
  },
  {
    lines: ["📊 Start with the Research Tool.", "Pull up any stock — live price, financials, AI summary, and more. This is your home base."],
    nextLabel: 'Next →',
    expandedTitle: 'Stock Research',
    expandedLines: [
      "Search any ticker or company name to get a full deep-dive:",
      "• Live price, charts & key metrics",
      "• AI-powered plain-English analysis",
      "• Recent news, earnings, and analyst ratings",
    ],
    tryHref: '/research',
    tryLabel: 'Open Research →',
  },
  {
    lines: ["🤖 Ask me anything — literally.", "I'm Mr. Guy. I explain stocks, earnings, valuations, anything — in plain English. No finance degree needed."],
    nextLabel: 'Next →',
    expandedTitle: 'Mr. Guy AI Chat',
    expandedLines: [
      '"What does Apple\'s P/E ratio mean?" → Plain English.',
      '"Is NVDA overvalued?" → Bull & bear sides.',
      '"Translate this earnings report" → Paste it, I\'ll decode it.',
    ],
    tryHref: '/chat',
    tryLabel: 'Chat with Mr. Guy →',
  },
  {
    lines: ["🏆 Ready for a challenge?", "The $100K Challenge gives you $100,000 in virtual money. Build your portfolio. See if you can beat the market."],
    nextLabel: 'Next →',
    expandedTitle: '$100K Challenge',
    expandedLines: [
      "Start with $100,000 in virtual cash — no real money at risk.",
      "Buy and sell real stocks at live prices.",
      "Track your performance vs. the S&P 500 and other players.",
    ],
    tryHref: '/trading-simulator',
    tryLabel: 'Take the Challenge →',
  },
  {
    lines: ["That's the tour 🎉", "Explore at your own pace. Click me anytime if you get lost."],
    nextLabel: 'Start exploring →',
  },
]

/* ── Props ─────────────────────────────────────────────────────────── */
interface Props {
  /** Force-show regardless of localStorage (for previewing) */
  forceShow?: boolean
  /** Called when the user finishes or dismisses — parent can mark onboarding done */
  onComplete?: () => void
}

const TOUR_KEY = 'zg_tour_v1'

export default function OnboardingTour({ forceShow = false, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [textIdx, setTextIdx] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Hydration guard + show logic
  useEffect(() => {
    setMounted(true)
    // Check URL param directly — most reliable, avoids prop timing issues
    const isTourParam = typeof window !== 'undefined'
      && new URLSearchParams(window.location.search).get('tour') === '1'
    if (forceShow || isTourParam) { setVisible(true); return }
    const done = localStorage.getItem(TOUR_KEY)
    if (!done) setTimeout(() => setVisible(true), 800)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Animate lines in
  useEffect(() => {
    setTextIdx(0)
    setExpanded(false)
    const id = setInterval(() => setTextIdx(i => {
      const max = STEPS[step].lines.length - 1
      if (i >= max) { clearInterval(id); return i }
      return i + 1
    }), 520)
    return () => clearInterval(id)
  }, [step])

  const finish = () => {
    if (!forceShow) localStorage.setItem(TOUR_KEY, '1')
    setDismissed(true)
    onComplete?.()
  }

  const advance = () => {
    if (step < STEPS.length - 1) { setStep(s => s + 1) }
    else { finish() }
  }

  if (!mounted || !visible || dismissed) return null

  const cur = STEPS[step]
  const isLast = step === STEPS.length - 1
  const isFirst = step === 0

  return (
    <div
      className="fixed bottom-24 right-4 sm:right-20 z-[9998] transition-all duration-500 animate-slideUp"
      style={{ width: 'min(340px, calc(100vw - 24px))' }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.4s ease both; }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
          50% { box-shadow: 0 0 0 6px rgba(59,130,246,0.25); }
        }
        .try-btn { animation: pulseGlow 2s ease-in-out infinite; }
      `}</style>

      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">

        {/* Step progress bar */}
        <div className="h-0.5 bg-gray-800">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Dots + close */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === step ? 'w-4 h-1.5 bg-blue-400'
                  : i < step  ? 'w-1.5 h-1.5 bg-blue-700'
                               : 'w-1.5 h-1.5 bg-gray-700'
                }`}
              />
            ))}
          </div>
          <button onClick={finish} className="text-gray-600 hover:text-gray-400 transition-colors" aria-label="Close tour">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-2">
          <div className="flex items-start gap-3">
            {/* Character */}
            <div className="shrink-0 mt-0.5 relative">
              <MrGuyHead px={4} />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-60" />
                <span className="relative rounded-full h-2.5 w-2.5 bg-green-400 border-2 border-gray-900" />
              </span>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 space-y-1.5">
              {cur.lines.map((line, i) => (
                <p
                  key={`${step}-${i}`}
                  className={`text-sm leading-snug transition-all duration-300 ${
                    i <= textIdx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                  } ${i === 0 ? 'font-bold text-white' : 'text-gray-300'}`}
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Expanded detail panel */}
          {expanded && cur.expandedLines && (
            <div className="mt-3 bg-gray-800/60 rounded-xl p-3 border border-gray-700/50">
              {cur.expandedTitle && (
                <p className="text-xs font-bold text-blue-400 mb-2">{cur.expandedTitle}</p>
              )}
              <div className="space-y-1.5">
                {cur.expandedLines.map((line, i) => (
                  <p key={i} className="text-xs text-gray-300 leading-snug">{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="px-4 pb-4 flex flex-col gap-2 mt-2">

          {/* Primary CTA: "Try it →" for feature steps, or "Start exploring" for last */}
          {cur.tryHref ? (
            <a
              href={cur.tryHref}
              className="try-btn w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              {cur.tryLabel ?? 'Try it →'}
              <ArrowRight className="h-4 w-4" />
            </a>
          ) : (
            <button
              onClick={advance}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 transition-colors"
            >
              {cur.nextLabel}
              {!isLast && <ChevronRight className="h-4 w-4" />}
            </button>
          )}

          {/* For feature steps: secondary "next step" button + optional "tell me more" */}
          {cur.tryHref && (
            <div className="flex gap-2">
              {cur.expandedLines && (
                <button
                  onClick={() => setExpanded(e => !e)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                  {expanded ? 'Less info' : 'Tell me more'}
                </button>
              )}
              <button
                onClick={advance}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1"
              >
                {cur.nextLabel} <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Skip (only on non-last, non-first steps) */}
        {!isLast && !isFirst && (
          <div className="border-t border-gray-800 px-4 py-2 text-center">
            <button onClick={finish} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Skip tour
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
