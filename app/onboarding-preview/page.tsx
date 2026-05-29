'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ChevronRight, X, TrendingUp, BarChart2, Brain, Bell,
  Newspaper, Zap, Trophy, BookOpen, MessageSquare,
  Search, Star, Building2, Users, Activity, FlaskConical,
  Calendar, ChevronDown, ExternalLink, ArrowRight,
} from 'lucide-react'

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

/* ── Steps ──────────────────────────────────────────────────────────── */
type StepAction = { label: string; primary: boolean; href?: string; expand?: boolean }
type Step = {
  id: string
  lines: string[]
  highlight: string | null
  actions: StepAction[]
  expandedTitle?: string
  expandedLines?: string[]
  expandedHref?: string
}

const STEPS: Step[] = [
  {
    id: 'welcome',
    lines: ["Hey! I'm Mr. Guy 👋", "I'm your AI investing sidekick.", "Quick 30-second tour?"],
    highlight: null,
    actions: [
      { label: "Let's go! →", primary: true },
      { label: 'Skip tour', primary: false },
    ],
  },
  {
    id: 'smart-money',
    lines: ["This is 🔥 — the Smart Money Tracker.", "See what hedge funds & insiders are buying. Real SEC filings, plain English."],
    highlight: 'smart-money',
    actions: [
      { label: 'Cool, next →', primary: true },
      { label: 'Tell me more', primary: false, expand: true },
    ],
    expandedTitle: 'Smart Money Tracker',
    expandedLines: [
      "Hedge funds file 13F reports with the SEC every quarter — we decode them automatically.",
      "Insiders (CEOs, CFOs, board members) must report when they buy or sell their own stock. That's Form 4.",
      "You get: which funds bought what, how much, when — and whether insiders are buying alongside them.",
      "It's public data. We just make it readable.",
    ],
    expandedHref: '/insiders',
  },
  {
    id: 'ai-tutor',
    lines: ["Ask me anything about any stock 🤖", "I'll break down earnings, valuations, risks — all in plain English."],
    highlight: 'ai-tutor',
    actions: [
      { label: 'Got it, next →', primary: true },
      { label: 'Tell me more', primary: false, expand: true },
    ],
    expandedTitle: 'Mr. Guy Chat (AI Tutor)',
    expandedLines: [
      '"What does Apple\'s P/E ratio actually mean?" — I\'ll explain it.',
      '"Is NVDA overvalued right now?" — I\'ll give you bull and bear sides.',
      '"Explain this earnings report" — paste it, I\'ll translate it.',
      "No jargon. No fluff. Just clear answers.",
    ],
    expandedHref: '/chat',
  },
  {
    id: 'report-card',
    lines: ["Not sure about a stock? 🎯", "I grade it A–F: financials, momentum, valuation, sentiment. Takes 10 seconds."],
    highlight: 'report-card',
    actions: [
      { label: 'Nice, next →', primary: true },
      { label: 'Tell me more', primary: false, expand: true },
    ],
    expandedTitle: 'Stock Report Card',
    expandedLines: [
      "Type any ticker. I'll pull live data and grade it across 4 categories:",
      "📊 Financials — revenue growth, margins, debt",
      "📈 Momentum — price action, relative strength",
      "💰 Valuation — P/E, P/S vs sector peers",
      "🧠 Sentiment — analyst ratings, insider activity",
      "You get a letter grade and a plain-English explanation for each.",
    ],
    expandedHref: '/report-card',
  },
  {
    id: 'done',
    lines: ["That's the tour 🎉", "Explore at your own pace. Click me anytime — I'm always around."],
    highlight: null,
    actions: [
      { label: 'Start exploring →', primary: true, href: '/dashboard' },
    ],
  },
]

/* ── Real top nav items ────────────────────────────────────────────── */
const PRIMARY_NAV = ['Dashboard', 'Research', 'Learn', '$100K Challenge', 'Mr. Guy', 'Markets']
const MORE_NAV    = ['Watchlist', 'Dividends', 'Smart Money', 'Earnings Calendar', 'Hedge Funds', 'Quant Strategy']

/* ── Real dashboard quick links ────────────────────────────────────── */
const QUICK_LINKS = [
  { label: 'Research',     icon: Search,      id: null,          desc: 'Deep-dive any stock' },
  { label: 'Watchlist',    icon: Star,        id: null,          desc: 'Stocks you\'re tracking' },
  { label: 'Earnings',     icon: Calendar,    id: null,          desc: 'Upcoming earnings dates' },
  { label: 'Hedge Funds',  icon: Building2,   id: 'smart-money', desc: 'Where big money is going' },
  { label: 'Smart Money',  icon: Users,       id: 'smart-money', desc: 'Insider & fund trades' },
  { label: 'Markets',      icon: Activity,    id: null,          desc: 'Market overview' },
  { label: 'Quant',        icon: FlaskConical,id: null,          desc: 'Screen stocks systematically' },
  { label: 'Dictionary',   icon: BookOpen,    id: null,          desc: 'Plain-English finance terms' },
  { label: 'Mr. Guy Chat', icon: MessageSquare, id: 'ai-tutor',  desc: 'Ask me anything' },
  { label: 'Report Card',  icon: Trophy,      id: 'report-card', desc: 'Grade any stock A–F' },
  { label: 'Hot Take',     icon: Zap,         id: null,          desc: 'AI verdict in 10s' },
  { label: 'Alerts',       icon: Bell,        id: null,          desc: 'Price notifications' },
]

export default function OnboardingPreview() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [textIdx, setTextIdx] = useState(0)
  const [expanded, setExpanded] = useState(false)

  const current = STEPS[step]

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 500)
    return () => clearTimeout(t)
  }, [])

  // Animate text lines in per-step
  useEffect(() => {
    setTextIdx(0)
    setExpanded(false)
    const id = setInterval(() => setTextIdx(i => {
      if (i >= current.lines.length - 1) { clearInterval(id); return i }
      return i + 1
    }), 550)
    return () => clearInterval(id)
  }, [step, current.lines.length])

  const advance = () => {
    setExpanded(false)
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else setDismissed(true)
  }
  const dismiss = () => setDismissed(true)

  const highlight = current.highlight

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col overflow-hidden">

      {/* ── Preview banner ────────────────────────────────── */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs text-amber-300 font-medium">Preview only — this onboarding is not live yet</span>
        </div>
        <Link href="/dashboard" className="text-xs text-amber-400 hover:text-amber-300 font-medium">
          Go to real dashboard →
        </Link>
      </div>

      {/* ── Real-style top nav ────────────────────────────── */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center gap-2 h-12 shrink-0 z-40">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-6 shrink-0">
          <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm text-gray-900 dark:text-white">Mr. Guy</span>
        </div>
        {/* Nav links */}
        <nav className="flex items-center gap-0.5 flex-1 overflow-hidden">
          {PRIMARY_NAV.map(label => (
            <span key={label} className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-default whitespace-nowrap">
              {label}
            </span>
          ))}
          <span className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-default flex items-center gap-1 whitespace-nowrap">
            More <ChevronDown className="h-3 w-3" />
          </span>
          <span className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-default flex items-center gap-1 whitespace-nowrap">
            Mr. Guy Tools <ChevronDown className="h-3 w-3" />
          </span>
        </nav>
        {/* Right side */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <div className="h-7 w-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">Z</div>
        </div>
      </header>

      {/* ── Ticker bar ────────────────────────────────────── */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-1.5 flex items-center gap-6 overflow-hidden shrink-0">
        {[
          { t: 'SPY', p: '591.42', c: '+0.82%', pos: true },
          { t: 'QQQ', p: '512.18', c: '+1.14%', pos: true },
          { t: 'NVDA', p: '1,087.50', c: '-0.33%', pos: false },
          { t: 'AAPL', p: '213.07', c: '+0.55%', pos: true },
          { t: 'TSLA', p: '182.63', c: '-1.22%', pos: false },
          { t: 'BTC',  p: '68,420', c: '+2.10%', pos: true },
        ].map(t => (
          <span key={t.t} className="flex items-center gap-1.5 text-xs whitespace-nowrap">
            <span className="text-gray-400 font-medium">{t.t}</span>
            <span className="text-white font-semibold">{t.p}</span>
            <span className={t.pos ? 'text-green-400' : 'text-red-400'}>{t.c}</span>
          </span>
        ))}
      </div>

      {/* ── Main content ──────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="p-5 max-w-5xl mx-auto">

          {/* Greeting */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-white">Good morning ☀️</h1>
              <p className="text-sm text-gray-500 mt-0.5">Markets are open · S&amp;P 500 +0.82%</p>
            </div>
            <span className="text-xs bg-green-500/10 border border-green-500/20 text-green-400 px-2.5 py-1 rounded-full font-medium">● Open</span>
          </div>

          {/* Quick links grid — matches real dashboard */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-5">
            {QUICK_LINKS.map(card => {
              const Icon = card.icon
              const isHighlighted = card.id === highlight
              return (
                <div
                  key={card.label}
                  className={`rounded-xl border p-3 flex flex-col items-center text-center gap-1.5 transition-all duration-300 cursor-default ${
                    isHighlighted
                      ? 'bg-blue-600/10 border-blue-500/50 ring-2 ring-blue-500/30 scale-[1.04] shadow-lg shadow-blue-500/10'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isHighlighted ? 'bg-blue-600/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <Icon className={`h-4 w-4 ${isHighlighted ? 'text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                  </div>
                  <p className={`text-xs font-semibold leading-tight ${isHighlighted ? 'text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>{card.label}</p>
                </div>
              )
            })}
          </div>

          {/* Market overview placeholder */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 h-36 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <BarChart2 className="h-7 w-7 opacity-40" />
              <p className="text-xs opacity-40">Market overview</p>
            </div>
          </div>

        </div>

        {/* ── Dim overlay when highlighting ─────────────── */}
        {!dismissed && highlight && (
          <div className="absolute inset-0 bg-gray-950/55 pointer-events-none transition-opacity duration-300" />
        )}

        {/* ── Mr. Guy onboarding panel ──────────────────── */}
        {!dismissed && (
          <div
            className={`fixed bottom-5 right-5 z-50 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ width: 'min(340px, calc(100vw - 24px))' }}
          >
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">

              {/* Step progress bar */}
              <div className="h-0.5 bg-gray-800">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                />
              </div>

              {/* Step dots + close */}
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <div className="flex items-center gap-1.5">
                  {STEPS.map((_, i) => (
                    <div key={i} className={`rounded-full transition-all duration-300 ${i === step ? 'w-4 h-1.5 bg-blue-400' : i < step ? 'w-1.5 h-1.5 bg-blue-600/50' : 'w-1.5 h-1.5 bg-gray-700'}`} />
                  ))}
                </div>
                <button onClick={dismiss} className="text-gray-600 hover:text-gray-400 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Main content */}
              <div className="px-4 py-2">
                <div className="flex items-start gap-3">
                  {/* Head */}
                  <div className="shrink-0 mt-0.5 relative">
                    <MrGuyHead px={4} />
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-60" />
                      <span className="relative rounded-full h-2.5 w-2.5 bg-green-400 border-2 border-gray-900" />
                    </span>
                  </div>

                  {/* Speech bubble */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {current.lines.map((line, i) => (
                      <p
                        key={`${step}-${i}`}
                        className={`text-sm leading-snug transition-all duration-300 ${i <= textIdx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'} ${i === 0 ? 'font-bold text-white' : 'text-gray-300'}`}
                        style={{ transitionDelay: `${i * 80}ms` }}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Expanded details */}
                {expanded && current.expandedLines && (
                  <div className="mt-3 bg-gray-800/60 rounded-xl p-3 border border-gray-700/50">
                    <p className="text-xs font-bold text-blue-400 mb-2">{current.expandedTitle}</p>
                    <div className="space-y-1.5">
                      {current.expandedLines.map((line, i) => (
                        <p key={i} className="text-xs text-gray-300 leading-snug">{line}</p>
                      ))}
                    </div>
                    {current.expandedHref && (
                      <a
                        href={current.expandedHref}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        Open in a new tab <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="px-4 pb-4 flex flex-col gap-2 mt-2">
                {current.actions.map((action, i) => {
                  if (action.expand) {
                    return (
                      <button
                        key={i}
                        onClick={() => setExpanded(e => !e)}
                        className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
                      >
                        {expanded ? 'Got it ✓' : action.label}
                      </button>
                    )
                  }
                  if (action.href) {
                    return (
                      <a key={i} href={action.href} target="_blank" rel="noreferrer">
                        <button className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25">
                          {action.label} <ArrowRight className="h-4 w-4" />
                        </button>
                      </a>
                    )
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (!action.primary && step === 0) { dismiss(); return }
                        advance()
                      }}
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
                })}
              </div>

              {/* Skip */}
              {step > 0 && step < STEPS.length - 1 && (
                <div className="border-t border-gray-800 px-4 py-2 text-center">
                  <button onClick={dismiss} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                    Skip tour
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dismissed mini tag */}
        {dismissed && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 shadow-xl">
            <MrGuyHead px={3} />
            <div>
              <p className="text-xs font-semibold text-white">That's the vibe ✌️</p>
              <p className="text-xs text-gray-500">Click me anytime if you get lost</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
