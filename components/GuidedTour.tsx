'use client'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { X, ChevronRight } from 'lucide-react'

/* ── Persistence ────────────────────────────────────────────────────── */
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
  idx: number
  match: (p: string) => boolean
  title: string
  body: string
  nextLabel: string
  nextHref?: string
  isLast?: boolean
}

const STEPS: TourStep[] = [
  {
    idx: 0,
    match: (p) => p === '/dashboard',
    title: "Hey! I'm Mr. Guy 👋",
    body: "I'm your AI investing sidekick. Let me show you around the site.",
    nextLabel: "Let's go →",
    nextHref: '/research',
  },
  {
    idx: 1,
    match: (p) => p === '/research',
    title: "📊 This is the Research Tool",
    body: "Search for any stock using the search bar above. Try typing AAPL, NVDA, or any company you know.",
    nextLabel: "I searched one →",
  },
  {
    idx: 2,
    match: (p) => p.startsWith('/research/') && p.length > 10,
    title: "🔍 This is your stock deep-dive",
    body: "You can see the live price, chart, key financial metrics, and an AI summary that explains everything in plain English. Scroll down to see it all.",
    nextLabel: "Nice! Show me Mr. Guy Chat →",
    nextHref: '/chat',
  },
  {
    idx: 3,
    match: (p) => p === '/chat' || p.startsWith('/chat?') || p.startsWith('/chat/'),
    title: "🤖 This is Mr. Guy Chat",
    body: "Ask me anything about any stock. Try: \"Is Apple a good buy right now?\" or \"What does P/E ratio mean?\" Type in the box at the bottom of the page.",
    nextLabel: "I asked one →",
    nextHref: '/trading-simulator',
  },
  {
    idx: 4,
    match: (p) => p.startsWith('/trading-simulator'),
    title: "That's the tour! 🎉",
    body: "Mr. Guy has a ton of tools — markets, earnings, hedge funds, quant screener and more. Poke around and see what clicks. I'm here if you need me.",
    nextLabel: "Let's explore →",
    isLast: true,
  },
]

function getActiveStep(pathname: string, minStep: number): TourStep | null {
  const matching = STEPS.filter(s => s.match(pathname) && s.idx >= minStep)
  if (!matching.length) return null
  return matching.sort((a, b) => b.idx - a.idx)[0]
}

/* ── Component ──────────────────────────────────────────────────────── */
export default function GuidedTour() {
  const pathname = usePathname()
  const [mounted, setMounted]     = useState(false)
  const [active, setActive]       = useState(false)
  const [minStep, setMinStep]     = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isTourUrl = new URLSearchParams(window.location.search).get('tour') === '1'
    const wasActive = localStorage.getItem(TOUR_ACTIVE_KEY) === '1'
    const savedStep = parseInt(localStorage.getItem(TOUR_STEP_KEY) ?? '0', 10)
    if (isTourUrl || wasActive) {
      setActive(true)
      setMinStep(isNaN(savedStep) ? 0 : savedStep)
      if (isTourUrl) window.history.replaceState({}, '', '/dashboard')
      localStorage.setItem(TOUR_ACTIVE_KEY, '1')
    }
  }, [])

  // Auto-advance when navigating to a page that matches a higher step
  useEffect(() => {
    if (!active || dismissed) return
    const matching = STEPS.filter(s => s.match(pathname))
    if (!matching.length) return
    const highest = Math.max(...matching.map(s => s.idx))
    if (highest > minStep) {
      setMinStep(highest)
      localStorage.setItem(TOUR_STEP_KEY, String(highest))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, active, dismissed])

  const finish = () => {
    localStorage.removeItem(TOUR_ACTIVE_KEY)
    localStorage.removeItem(TOUR_STEP_KEY)
    setDismissed(true)
  }

  const handleNext = (step: TourStep) => {
    if (step.isLast) { finish(); return }
    const next = step.idx + 1
    setMinStep(next)
    localStorage.setItem(TOUR_STEP_KEY, String(next))
    if (step.nextHref) window.location.href = step.nextHref
  }

  if (!mounted || !active || dismissed) return null
  const step = getActiveStep(pathname, minStep)
  if (!step) return null

  const progress = ((step.idx + 1) / STEPS.length) * 100

  return (
    <>
      <style>{`
        @keyframes gtSlideUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .gt-panel { animation: gtSlideUp 0.35s ease both; }
      `}</style>

      <div
        key={step.idx}
        className="gt-panel fixed bottom-6 right-4 z-[9998]"
        style={{ width: 'min(300px, calc(100vw - 24px))' }}
      >
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">

          {/* Progress bar */}
          <div className="h-0.5 bg-gray-800">
            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          {/* Dots + close */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={`rounded-full transition-all duration-300 ${
                  i === step.idx ? 'w-4 h-1.5 bg-blue-400'
                  : i < step.idx ? 'w-1.5 h-1.5 bg-blue-700'
                                 : 'w-1.5 h-1.5 bg-gray-700'
                }`} />
              ))}
            </div>
            <button onClick={finish} className="text-gray-600 hover:text-gray-400 transition-colors" aria-label="Close tour">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="shrink-0 relative">
                <MrGuyHead px={4} />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-60" />
                  <span className="relative rounded-full h-2.5 w-2.5 bg-green-400 border-2 border-gray-900" />
                </span>
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm font-bold text-white leading-snug">{step.title}</p>
                <p className="text-sm text-gray-300 leading-relaxed">{step.body}</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
            <button
              onClick={() => handleNext(step)}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              {step.nextLabel}
              {!step.isLast && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>

          {/* Skip */}
          {step.idx > 0 && (
            <div className="border-t border-gray-800 px-4 py-2 text-center">
              <button onClick={finish} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                Skip tour
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
