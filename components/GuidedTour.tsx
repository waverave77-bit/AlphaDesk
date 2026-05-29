'use client'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { X, ArrowUp, ArrowDown, ChevronRight } from 'lucide-react'

/* ── Persistence keys ───────────────────────────────────────────────── */
const TOUR_ACTIVE_KEY = 'zg_guided_tour_active'
const TOUR_STEP_KEY  = 'zg_guided_tour_step'

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

/* ── Tour steps ─────────────────────────────────────────────────────── */
type TourStep = {
  /** Return true when this step should be shown for a given pathname */
  match: (p: string) => boolean
  /** Step index — used to know which step we're on */
  idx: number
  title: string
  body: string[]
  /** Bouncing arrow to draw user's eye */
  arrow?: 'up' | 'down'
  arrowLabel?: string
  /** Primary CTA */
  nextLabel: string
  /** If set, clicking Next navigates here */
  nextHref?: string
  /** If true, this is the last step */
  isLast?: boolean
}

const STEPS: TourStep[] = [
  {
    idx: 0,
    match: (p) => p === '/dashboard',
    title: "Hey! I'm Mr. Guy 👋",
    body: [
      "I'm your AI investing sidekick.",
      "Let me show you around — I'll take you to the good stuff.",
    ],
    nextLabel: "Show me around →",
    nextHref: '/research',
  },
  {
    idx: 1,
    match: (p) => p === '/research',
    title: "📊 Search any stock up there ↑",
    body: [
      "Type a company name or ticker in the search bar at the top of this page.",
      "Try: AAPL · NVDA · TSLA — anything you're curious about.",
    ],
    arrow: 'up',
    arrowLabel: 'Search bar is up there',
    nextLabel: "I found a stock →",
  },
  {
    idx: 2,
    match: (p) => p.startsWith('/research/') && p.length > 10,
    title: "🔍 Here's your full deep-dive!",
    body: [
      "Live price & chart — how it's moving right now.",
      "Key metrics: P/E ratio, revenue, earnings growth.",
      "AI summary: I translate all of it into plain English.",
      "Scroll down — there's a lot here.",
    ],
    nextLabel: "Cool! Show me Mr. Guy Chat →",
    nextHref: '/chat',
  },
  {
    idx: 3,
    match: (p) => p === '/chat' || p.startsWith('/chat?'),
    title: "🤖 Ask me anything ↓",
    body: [
      "Type any investing question in the box below.",
      "Try: \"Is Apple a good buy right now?\"",
      "or: \"Explain what a P/E ratio means\"",
      "I'll give you a real answer in plain English.",
    ],
    arrow: 'down',
    arrowLabel: 'Chat box is down there',
    nextLabel: "I asked one →",
    nextHref: '/trading-simulator',
  },
  {
    idx: 4,
    match: (p) => p.startsWith('/trading-simulator'),
    title: "🏆 Your $100K is ready",
    body: [
      "This is virtual money — zero real risk.",
      "Search a stock and hit Buy to start your portfolio.",
      "Your goal: beat the S&P 500. Can you do it?",
    ],
    nextLabel: "Let's go! 🚀",
    isLast: true,
  },
]

/* ── Helpers ────────────────────────────────────────────────────────── */
function getActiveStep(pathname: string, minStep: number): TourStep | null {
  // Find all steps that match current pathname
  const matching = STEPS.filter(s => s.match(pathname))
  if (!matching.length) return null
  // Show the highest-indexed matching step that is >= minStep
  const best = matching.filter(s => s.idx >= minStep).sort((a, b) => b.idx - a.idx)[0]
  return best ?? null
}

/* ── Component ──────────────────────────────────────────────────────── */
export default function GuidedTour() {
  const pathname = usePathname()
  const [mounted, setMounted]   = useState(false)
  const [active, setActive]     = useState(false)
  const [minStep, setMinStep]   = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [textIdx, setTextIdx]   = useState(0)
  const [prevStep, setPrevStep] = useState<number | null>(null)

  // On mount — read state from localStorage + check URL param
  useEffect(() => {
    setMounted(true)
    const isTourUrl = new URLSearchParams(window.location.search).get('tour') === '1'
    const wasActive = localStorage.getItem(TOUR_ACTIVE_KEY) === '1'
    const savedStep = parseInt(localStorage.getItem(TOUR_STEP_KEY) ?? '0', 10)

    if (isTourUrl || wasActive) {
      setActive(true)
      setMinStep(isNaN(savedStep) ? 0 : savedStep)
      if (isTourUrl) {
        // Clean up the URL but keep tour running
        window.history.replaceState({}, '', '/dashboard')
      }
      localStorage.setItem(TOUR_ACTIVE_KEY, '1')
    }
  }, [])

  // Derive the current step from pathname + minStep
  const currentStep = mounted && active && !dismissed
    ? getActiveStep(pathname, minStep)
    : null

  // Animate lines when step changes
  useEffect(() => {
    if (!currentStep) return
    if (currentStep.idx === prevStep) return
    setPrevStep(currentStep.idx)
    setTextIdx(0)
    const id = setInterval(() => setTextIdx(i => {
      const max = currentStep.body.length // title + body lines
      if (i >= max) { clearInterval(id); return i }
      return i + 1
    }), 450)
    return () => clearInterval(id)
  }, [currentStep, prevStep])

  // When pathname changes and we're on a step with higher idx, auto-advance minStep
  useEffect(() => {
    if (!active || dismissed) return
    const matching = STEPS.filter(s => s.match(pathname))
    if (!matching.length) return
    const highestMatch = Math.max(...matching.map(s => s.idx))
    if (highestMatch > minStep) {
      setMinStep(highestMatch)
      localStorage.setItem(TOUR_STEP_KEY, String(highestMatch))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, active, dismissed])

  const finish = () => {
    localStorage.removeItem(TOUR_ACTIVE_KEY)
    localStorage.removeItem(TOUR_STEP_KEY)
    setDismissed(true)
  }

  const handleNext = (step: TourStep) => {
    if (step.isLast) {
      finish()
      return
    }
    const nextMin = step.idx + 1
    setMinStep(nextMin)
    localStorage.setItem(TOUR_STEP_KEY, String(nextMin))

    if (step.nextHref) {
      window.location.href = step.nextHref
    }
  }

  if (!mounted || !active || dismissed || !currentStep) return null

  const step = currentStep
  const totalSteps = STEPS.length
  const progress = ((step.idx + 1) / totalSteps) * 100

  return (
    <>
      <style>{`
        @keyframes guideSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes guideBounceUp {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes guideBounceDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        @keyframes guidePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.0); }
          50% { box-shadow: 0 0 0 8px rgba(59,130,246,0.2); }
        }
        .guide-panel { animation: guideSlideUp 0.4s ease both; }
        .guide-arrow-up { animation: guideBounceUp 1s ease-in-out infinite; }
        .guide-arrow-down { animation: guideBounceDown 1s ease-in-out infinite; }
        .guide-cta { animation: guidePulse 2s ease-in-out infinite; }
      `}</style>

      {/* ── Upward arrow beacon (for search bar / top of page) ── */}
      {step.arrow === 'up' && (
        <div className="fixed top-[140px] right-6 sm:right-24 z-[9997] flex flex-col items-center gap-1 pointer-events-none">
          <div className="guide-arrow-up flex flex-col items-center gap-1">
            <svg width="32" height="40" viewBox="0 0 32 40" fill="none">
              <path d="M16 0 L4 20 H12 V40 H20 V20 H28 Z" fill="#3b82f6" opacity="0.9"/>
            </svg>
          </div>
          {step.arrowLabel && (
            <span className="text-xs font-semibold text-blue-400 bg-gray-900/90 px-2 py-1 rounded-lg border border-blue-500/30 whitespace-nowrap">
              {step.arrowLabel}
            </span>
          )}
        </div>
      )}

      {/* ── Downward arrow beacon (for chat input / bottom of page) ── */}
      {step.arrow === 'down' && (
        <div className="fixed bottom-[220px] right-6 sm:right-24 z-[9997] flex flex-col items-center gap-1 pointer-events-none">
          {step.arrowLabel && (
            <span className="text-xs font-semibold text-blue-400 bg-gray-900/90 px-2 py-1 rounded-lg border border-blue-500/30 whitespace-nowrap">
              {step.arrowLabel}
            </span>
          )}
          <div className="guide-arrow-down flex flex-col items-center gap-1">
            <svg width="32" height="40" viewBox="0 0 32 40" fill="none">
              <path d="M16 40 L4 20 H12 V0 H20 V20 H28 Z" fill="#3b82f6" opacity="0.9"/>
            </svg>
          </div>
        </div>
      )}

      {/* ── Main tour panel ── */}
      <div
        className="guide-panel fixed bottom-24 right-4 sm:right-20 z-[9998]"
        style={{ width: 'min(340px, calc(100vw - 24px))' }}
      >
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">

          {/* Progress bar */}
          <div className="h-0.5 bg-gray-800">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step dots + close */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === step.idx ? 'w-4 h-1.5 bg-blue-400'
                    : i < step.idx ? 'w-1.5 h-1.5 bg-blue-700'
                                   : 'w-1.5 h-1.5 bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={finish}
              className="text-gray-600 hover:text-gray-400 transition-colors"
              aria-label="Close tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-2">
            <div className="flex items-start gap-3">
              {/* Mr. Guy head */}
              <div className="shrink-0 mt-0.5 relative">
                <MrGuyHead px={4} />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-60" />
                  <span className="relative rounded-full h-2.5 w-2.5 bg-green-400 border-2 border-gray-900" />
                </span>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 space-y-1.5">
                {/* Title */}
                <p
                  className={`text-sm font-bold text-white leading-snug transition-all duration-300 ${
                    textIdx >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                  }`}
                >
                  {step.title}
                </p>
                {/* Body lines — animate in one by one */}
                {step.body.map((line, i) => (
                  <p
                    key={`${step.idx}-${i}`}
                    className={`text-sm text-gray-300 leading-snug transition-all duration-300 ${
                      i < textIdx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                    }`}
                    style={{ transitionDelay: `${i * 60}ms` }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="px-4 pb-4 pt-2 flex flex-col gap-2">
            <button
              onClick={() => handleNext(step)}
              className="guide-cta w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              {step.nextLabel}
              {!step.isLast && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>

          {/* Skip */}
          {step.idx > 0 && (
            <div className="border-t border-gray-800 px-4 py-2 text-center">
              <button
                onClick={finish}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                Skip tour
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
