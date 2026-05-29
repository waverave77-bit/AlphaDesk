'use client'
import { useState, useEffect, useRef } from 'react'
import { ChevronRight, X, TrendingUp, BarChart2, Brain, Bell, DollarSign, Newspaper, Zap, Trophy, BookOpen, MessageSquare } from 'lucide-react'
import Link from 'next/link'

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
  return <canvas ref={ref} width={12 * px} height={12 * px} style={{ imageRendering: 'pixelated' }} />
}

/* ── Steps ──────────────────────────────────────────────────────────── */
type StepAction = { label: string; primary: boolean; href?: string }
type Step = { id: string; lines: string[]; highlight: string | null; actions: StepAction[] }
const STEPS: Step[] = [
  {
    id: 'welcome',
    lines: [
      "Hey! I'm Mr. Guy 👋",
      "I'm your AI investing sidekick.",
      "Quick 30-second tour?",
    ],
    highlight: null,
    actions: [
      { label: "Let's go! →", primary: true },
      { label: 'Skip tour', primary: false },
    ],
  },
  {
    id: 'smart-money',
    lines: [
      "This is 🔥 — the Smart Money Tracker.",
      "See exactly what hedge funds & insiders are buying. Real SEC filings, plain English.",
    ],
    highlight: 'smart-money',
    actions: [
      { label: 'Cool, next →', primary: true },
      { label: 'Take me there', primary: false, href: '/hedgefunds' },
    ],
  },
  {
    id: 'ai-tutor',
    lines: [
      "Ask me anything about any stock 🤖",
      "I'll explain earnings, valuations, risks — all in plain English. No finance degree needed.",
    ],
    highlight: 'ai-tutor',
    actions: [
      { label: 'Got it, next →', primary: true },
      { label: 'Ask a question', primary: false, href: '/chat' },
    ],
  },
  {
    id: 'portfolio',
    lines: [
      "Track what you own 📊",
      "Add your holdings, watch performance, get price alerts the moment something moves.",
    ],
    highlight: 'portfolio',
    actions: [
      { label: 'Nice, next →', primary: true },
      { label: 'Add a stock', primary: false, href: '/portfolio' },
    ],
  },
  {
    id: 'report-card',
    lines: [
      "Not sure about a stock? 🎯",
      "I'll give it a Report Card — bull case, bear case, real rating. Takes 10 seconds.",
    ],
    highlight: 'report-card',
    actions: [
      { label: 'Last one →', primary: true },
      { label: 'Grade a stock', primary: false, href: '/report-card' },
    ],
  },
  {
    id: 'done',
    lines: [
      "That's the tour 🎉",
      "I'm always around if you get lost — just click me. Now let's make some gains.",
    ],
    highlight: null,
    actions: [
      { label: 'Start exploring →', primary: true, href: '/dashboard' },
    ],
  },
]

/* ── Nav items (mock sidebar) ──────────────────────────────────────── */
const NAV = [
  { label: 'Dashboard', icon: TrendingUp, id: null },
  { label: 'Smart Money', icon: Brain, id: 'smart-money' },
  { label: 'AI Tutor (Chat)', icon: MessageSquare, id: 'ai-tutor' },
  { label: 'Portfolio', icon: BarChart2, id: 'portfolio' },
  { label: 'Report Card', icon: Trophy, id: 'report-card' },
  { label: 'Alerts', icon: Bell, id: null },
  { label: 'Earnings', icon: Newspaper, id: null },
  { label: 'Translator', icon: BookOpen, id: null },
  { label: '$100K Challenge', icon: DollarSign, id: null },
]

/* ── Mock dashboard cards ────────────────────────────────────────────── */
const CARDS = [
  { title: 'Smart Money', icon: Brain, id: 'smart-money', desc: 'Hedge fund & insider trades' },
  { title: 'AI Tutor', icon: MessageSquare, id: 'ai-tutor', desc: 'Ask me anything' },
  { title: 'Portfolio', icon: BarChart2, id: 'portfolio', desc: 'Track your holdings' },
  { title: 'Report Card', icon: Trophy, id: 'report-card', desc: 'Grade any stock' },
  { title: 'Alerts', icon: Bell, id: null, desc: 'Price notifications' },
  { title: 'Earnings', icon: Newspaper, id: null, desc: 'Upcoming catalysts' },
]

export default function OnboardingPreview() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [textIdx, setTextIdx] = useState(0)
  const [charVisible, setCharVisible] = useState(false)

  const current = STEPS[step]

  // Slide in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600)
    const t2 = setTimeout(() => setCharVisible(true), 200)
    return () => { clearTimeout(t); clearTimeout(t2) }
  }, [])

  // Animate text lines
  useEffect(() => {
    setTextIdx(0)
    const id = setInterval(() => setTextIdx(i => {
      if (i >= current.lines.length - 1) { clearInterval(id); return i }
      return i + 1
    }), 600)
    return () => clearInterval(id)
  }, [step, current.lines.length])

  const advance = (href?: string) => {
    if (href) return // handled by Link
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      setDismissed(true)
    }
  }

  const dismiss = () => setDismissed(true)

  const highlight = current.highlight

  return (
    <div className="min-h-screen bg-gray-950 text-white flex overflow-hidden">

      {/* ── Sidebar (mock nav) ──────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 bg-gray-900 border-r border-gray-800 py-4 shrink-0">
        <div className="px-4 mb-6 flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm">Mr. Guy Invests</span>
        </div>
        {NAV.map(item => {
          const Icon = item.icon
          const isHighlighted = item.id === highlight
          return (
            <div
              key={item.label}
              className={`flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm font-medium cursor-default transition-all duration-300 relative ${
                isHighlighted
                  ? 'bg-blue-600/20 text-blue-300 ring-2 ring-blue-500/60 ring-offset-1 ring-offset-gray-900'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
              {isHighlighted && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative rounded-full h-2 w-2 bg-blue-400" />
                </span>
              )}
            </div>
          )
        })}
      </aside>

      {/* ── Main area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Top bar */}
        <header className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-900 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Dashboard</span>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">Preview</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">Z</div>
          </div>
        </header>

        {/* Content grid */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-gray-500 mb-4">Good morning! Markets are open. 📈</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CARDS.map(card => {
                const Icon = card.icon
                const isHighlighted = card.id === highlight
                return (
                  <div
                    key={card.title}
                    className={`rounded-xl border p-4 transition-all duration-300 cursor-default ${
                      isHighlighted
                        ? 'bg-blue-600/10 border-blue-500/50 ring-2 ring-blue-500/40 scale-[1.02]'
                        : 'bg-gray-900 border-gray-800'
                    }`}
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${
                      isHighlighted ? 'bg-blue-600/20' : 'bg-gray-800'
                    }`}>
                      <Icon className={`h-5 w-5 ${isHighlighted ? 'text-blue-400' : 'text-gray-400'}`} />
                    </div>
                    <p className={`text-sm font-semibold mb-0.5 ${isHighlighted ? 'text-white' : 'text-gray-200'}`}>{card.title}</p>
                    <p className={`text-xs ${isHighlighted ? 'text-blue-300' : 'text-gray-500'}`}>{card.desc}</p>
                  </div>
                )
              })}
            </div>

            {/* Mock chart placeholder */}
            <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900 p-5 h-40 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-gray-600">
                <BarChart2 className="h-8 w-8" />
                <p className="text-xs">Market overview loads here</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Onboarding overlay backdrop ─────────────────── */}
        {!dismissed && highlight && (
          <div
            className="absolute inset-0 bg-gray-950/60 backdrop-blur-[1px] z-20 pointer-events-none"
            style={{ transition: 'opacity 0.3s' }}
          />
        )}

        {/* ── Mr. Guy onboarding panel ─────────────────────── */}
        {!dismissed && (
          <div
            className={`absolute bottom-5 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-5 z-30 transition-all duration-500 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ width: 'min(340px, calc(100vw - 24px))' }}
          >
            {/* Card */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">

              {/* Progress bar */}
              <div className="h-0.5 bg-gray-800">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                />
              </div>

              {/* Header row */}
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <div className="flex items-center gap-1.5">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-full transition-all duration-300 ${
                        i === step ? 'w-4 h-1.5 bg-blue-400' : i < step ? 'w-1.5 h-1.5 bg-blue-600/50' : 'w-1.5 h-1.5 bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={dismiss}
                  className="text-gray-600 hover:text-gray-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-4 py-3">
                <div className="flex items-start gap-3">
                  {/* Character head */}
                  <div
                    className={`shrink-0 transition-all duration-500 ${charVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                  >
                    <div className="relative">
                      <MrGuyHead px={4} />
                      {/* Bounce dot indicator */}
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-60" />
                        <span className="relative rounded-full h-3 w-3 bg-green-400 border-2 border-gray-900" />
                      </span>
                    </div>
                  </div>

                  {/* Speech bubble */}
                  <div className="flex-1 min-w-0">
                    <div className="space-y-1.5">
                      {current.lines.map((line, i) => (
                        <p
                          key={`${step}-${i}`}
                          className={`text-sm leading-snug transition-all duration-400 ${
                            i <= textIdx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                          } ${i === 0 ? 'font-bold text-white' : 'text-gray-300'}`}
                          style={{ transitionDelay: `${i * 100}ms` }}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="px-4 pb-4 flex flex-col gap-2 mt-1">
                {current.actions.map((action, i) => {
                  const content = (
                    <button
                      key={i}
                      onClick={() => advance(action.href)}
                      className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        action.primary
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25'
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
                      }`}
                    >
                      {action.label}
                      {action.primary && <ChevronRight className="h-4 w-4" />}
                    </button>
                  )
                  if (action.href) {
                    return (
                      <Link key={i} href={action.href} className="block">
                        {content}
                      </Link>
                    )
                  }
                  return content
                })}
              </div>

              {/* Skip footer */}
              {step < STEPS.length - 1 && (
                <div className="border-t border-gray-800 px-4 py-2 text-center">
                  <button
                    onClick={dismiss}
                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    Skip tour
                  </button>
                </div>
              )}
            </div>

            {/* Tail pointer */}
            <div className="flex justify-end pr-8 hidden md:flex">
              <div className="w-3 h-2 overflow-hidden">
                <div className="w-3 h-3 bg-gray-700 rotate-45 translate-y-[-50%] ml-0" />
              </div>
            </div>
          </div>
        )}

        {/* Dismissed state */}
        {dismissed && (
          <div className="absolute bottom-6 right-6 z-30 flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <MrGuyHead px={3} />
            <div>
              <p className="text-xs font-semibold text-white">That's the vibe ✌️</p>
              <p className="text-xs text-gray-500">Click me anytime if you need help</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Preview note bar at top ──────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs text-amber-300 font-medium">Preview only — this onboarding is not live yet</span>
        </div>
        <Link href="/dashboard" className="text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium">
          Go to real dashboard →
        </Link>
      </div>
      <style>{`
        body { padding-top: 36px; }
        .animate-in { animation: fadeSlideIn 0.3s ease both; }
        .fade-in { opacity: 1; }
        .slide-in-from-bottom-2 { transform: translateY(0); }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
