'use client'
import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
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
  /** Small gray note shown below body — e.g. auto-advance hint */
  hint?: string
  nextLabel: string
  nextHref?: string
  isLast?: boolean
}

const STEPS: TourStep[] = [
  {
    idx: 0,
    match: (p) => p === '/dashboard',
    title: "Hey, I'm Mr. Guy",
    body: "Your investing sidekick. I'll show you around in 60 seconds — it's worth it.",
    nextLabel: "Show me around →",
    nextHref: '/learn',
  },
  {
    idx: 1,
    match: (p) => p === '/learn' || p.startsWith('/learn/'),
    title: "Start here — Learn",
    body: "Bite-size lessons that take you from zero to confident. Earn XP, build a streak, and it actually sticks. This is the heart of Mr. Guy.",
    hint: "Five minutes a day is all it takes.",
    nextLabel: "What's next? →",
    nextHref: '/trading-simulator',
  },
  {
    idx: 2,
    match: (p) => p.startsWith('/trading-simulator'),
    title: "The $100K Challenge",
    body: "You get $100,000 in virtual cash and invest it like it's real — live prices, real stocks, zero risk. Try to beat the S&P 500 and climb the leaderboard.",
    hint: "The best way to learn investing without risking a cent.",
    nextLabel: "Show me Mr. Guy →",
    nextHref: '/chat',
  },
  {
    idx: 3,
    match: (p) => p === '/chat' || p.startsWith('/chat?') || p.startsWith('/chat/'),
    title: "Ask me anything",
    body: "\"Is NVDA overvalued?\" \"Explain this earnings report.\" \"What's a good first stock?\" Type it in the box below — I'll give you a real, plain-English answer.",
    hint: "I pull live market data, not generic answers.",
    nextLabel: "One more thing →",
    nextHref: '/dictionary',
  },
  {
    idx: 4,
    match: (p) => p === '/dictionary' || p.startsWith('/dictionary/'),
    title: "Confused by a term?",
    body: "P/E ratio? Market cap? Every confusing word explained in plain English. Search it here the moment you get stuck.",
    hint: "No finance degree required.",
    nextLabel: "Got it →",
    nextHref: '/dashboard',
  },
  {
    idx: 5,
    match: (p) => p === '/dashboard',
    title: "That's the core of it",
    body: "There's more when you're ready — research any stock, a markets overview, watchlists and earnings. Poke around and find what clicks.",
    hint: "last",
    nextLabel: "Let's go!",
    isLast: true,
  },
]

function getActiveStep(pathname: string, minStep: number): TourStep | null {
  const matching = STEPS.filter(s => s.match(pathname) && s.idx >= minStep)
  if (!matching.length) return null
  // Return the LOWEST matching step — never skip ahead automatically on same-page multi-steps
  return matching.sort((a, b) => a.idx - b.idx)[0]
}

/* ── Component ──────────────────────────────────────────────────────── */
export default function GuidedTour() {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted]     = useState(false)
  const [active, setActive]       = useState(false)
  const [minStep, setMinStep]     = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const minStepRef = useRef(0)

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

    // Listen for onboarding modal completing — start tour for new users
    const handleTourStart = () => {
      setActive(true)
      setMinStep(0)
      setDismissed(false)
    }
    window.addEventListener('zg-tour-start', handleTourStart)
    return () => window.removeEventListener('zg-tour-start', handleTourStart)
  }, [])

  minStepRef.current = minStep

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
    if (step.nextHref) router.push(step.nextHref)
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
        <div className="bg-[#fdf3d7] dark:bg-gray-900 border-2 border-[#16130a] dark:border-gray-700 rounded-2xl shadow-[4px_4px_0_#16130a] dark:shadow-2xl dark:shadow-black/60 overflow-hidden">

          {/* Progress bar */}
          <div className="h-1 bg-[#16130a]/10 dark:bg-gray-800">
            <div className="h-full bg-[#16130a] dark:bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          {/* Dots + close */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={`rounded-full transition-all duration-300 ${
                  i === step.idx ? 'w-4 h-1.5 bg-[#16130a] dark:bg-blue-400'
                  : i < step.idx ? 'w-1.5 h-1.5 bg-[#16130a]/40 dark:bg-blue-700'
                                 : 'w-1.5 h-1.5 bg-[#16130a]/15 dark:bg-gray-700'
                }`} />
              ))}
            </div>
            <button onClick={finish} className="text-[#16130a]/40 hover:text-[#16130a] dark:text-gray-600 dark:hover:text-gray-400 transition-colors" aria-label="Close tour">
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
                  <span className="relative rounded-full h-2.5 w-2.5 bg-green-400 border-2 border-[#fdf3d7] dark:border-gray-900" />
                </span>
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <p className="font-display text-sm text-[#16130a] dark:text-white leading-snug">{step.title}</p>
                <p className="text-sm text-[#16130a]/80 dark:text-gray-300 leading-relaxed">{step.body}</p>
                {step.hint && (
                  <p className="text-xs text-[#16130a]/50 dark:text-gray-500 leading-relaxed">
                    {step.hint === 'last'
                      ? <>Need help? <a href="/chat" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">Ask Mr. Guy</a> anything.</>
                      : step.hint
                    }
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
            <button
              onClick={() => handleNext(step)}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-[#16130a] text-[#ffd23f] hover:bg-[#0f0c06] dark:bg-blue-600 dark:text-[#fff] dark:hover:bg-blue-500 flex items-center justify-center gap-1.5 transition-colors"
            >
              {step.nextLabel}
              {!step.isLast && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>

          {/* Skip */}
          {step.idx > 0 && (
            <div className="border-t border-[#16130a]/10 dark:border-gray-800 px-4 py-2 text-center">
              <button onClick={finish} className="text-xs text-[#16130a]/40 hover:text-[#16130a]/70 dark:text-gray-600 dark:hover:text-gray-400 transition-colors">
                Skip tour
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
