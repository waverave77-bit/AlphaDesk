'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Brain, Loader2, Lock, Sparkles, ArrowRight } from 'lucide-react'
import AIAnalysisPanel from '@/components/portfolio/AIAnalysisPanel'

interface StatusResp {
  signedIn: boolean
  isPro?: boolean
  unlimited?: boolean
  emailVerified?: boolean
  trialsLeft?: number
  limit?: number
}

interface Props {
  data: any
  label?: string
}

/**
 * Gated AI Analysis section for the research page.
 * Content stays blurred behind a contextual CTA until the user acts:
 *   not signed in → "Sign up free"
 *   email unverified → "Verify your email"
 *   free, limit used → "Unlock with Pro"
 *   free, trials left → "Analyze (X left)"
 *   Pro → "Analyze"
 */
export default function AIAnalysisSection({ data, label }: Props) {
  const [status, setStatus] = useState<StatusResp | null>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/ai-analysis/status')
      .then((r) => r.json())
      .then((s) => { if (!cancelled) setStatus(s) })
      .catch(() => { if (!cancelled) setStatus({ signedIn: false }) })
    return () => { cancelled = true }
  }, [])

  const remaining: number | null =
    status?.unlimited ? null : typeof status?.trialsLeft === 'number' ? status.trialsLeft : 0

  const canAnalyze = !!status && status.signedIn && (status.unlimited || (status.emailVerified !== false && (remaining ?? 0) > 0))

  return (
    <section className="space-y-3">
      {/* Section header + blurb */}
      <div>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <h2 className="font-display uppercase text-lg text-[#16130a] dark:!text-white">AI Analysis</h2>
        </div>
        <p className="font-mono text-xs text-[#16130a]/60 dark:text-gray-400 mt-1 leading-relaxed">
          A second opinion — three AI models (Claude, DeepSeek, Grok) read the same fundamentals and news, then weigh in. Independent of Wall Street, and never financial advice.
        </p>
      </div>

      {started ? (
        <AIAnalysisPanel type="stock" data={data} label={label} autoRun remaining={remaining} />
      ) : (
        <GatePreview
          status={status}
          remaining={remaining}
          canAnalyze={canAnalyze}
          onAnalyze={() => setStarted(true)}
        />
      )}
    </section>
  )
}

function GatePreview({
  status,
  remaining,
  canAnalyze,
  onAnalyze,
}: {
  status: StatusResp | null
  remaining: number | null
  canAnalyze: boolean
  onAnalyze: () => void
}) {
  return (
    <div className="relative rounded-xl border-2 border-[#16130a] dark:border-gray-700 bg-white dark:bg-gray-900 shadow-[4px_4px_0_#16130a] dark:shadow-none overflow-hidden">
      {/* Blurred faux preview */}
      <div className="p-5 blur-[5px] opacity-60 select-none pointer-events-none" aria-hidden>
        <div className="flex items-center gap-4 p-4 rounded-xl border border-green-500/30 bg-green-500/10 mb-4">
          <Sparkles className="h-8 w-8 text-green-400 shrink-0" />
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">AI Consensus</p>
            <p className="text-2xl font-bold text-green-400">BUY</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-400">Agreement</p>
            <p className="text-lg font-bold text-white">3/3 models</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {['Claude Haiku', 'DeepSeek V3', 'Grok 4'].map((m) => (
            <div key={m} className="rounded-xl border border-gray-700 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">{m}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">BUY</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Strong fundamentals with healthy margins and a reasonable valuation relative to peers in the sector.
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/40 dark:bg-gray-900/40 px-4 text-center">
        <CTA status={status} remaining={remaining} canAnalyze={canAnalyze} onAnalyze={onAnalyze} />
      </div>
    </div>
  )
}

function CTA({
  status,
  remaining,
  canAnalyze,
  onAnalyze,
}: {
  status: StatusResp | null
  remaining: number | null
  canAnalyze: boolean
  onAnalyze: () => void
}) {
  const btn =
    'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#16130a] dark:border-gray-600 shadow-[3px_3px_0_#16130a] dark:shadow-none font-mono font-bold text-sm transition-transform hover:-translate-y-0.5'

  // Loading status
  if (!status) {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-mono text-[#16130a]/50 dark:text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking access…
      </span>
    )
  }

  // Not signed in
  if (!status.signedIn) {
    return (
      <>
        <Link href="/register" className={`${btn} bg-[#2563eb] text-[#fff]`}>
          Sign up free <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="font-mono text-xs text-[#16130a]/60 dark:text-gray-400">Free accounts get 2 AI analyses a day.</p>
      </>
    )
  }

  // Signed in but email not verified
  if (status.emailVerified === false) {
    return (
      <>
        <Link href="/settings" className={`${btn} bg-[#ffd23f] text-[#16130a]`}>
          <Lock className="h-4 w-4" /> Verify your email
        </Link>
        <p className="font-mono text-xs text-[#16130a]/60 dark:text-gray-400">Verify your email to unlock AI features.</p>
      </>
    )
  }

  // Free, limit used
  if (!canAnalyze) {
    return (
      <>
        <Link href="/upgrade" className={`${btn} bg-[#ffd23f] text-[#16130a]`}>
          <Lock className="h-4 w-4" /> Unlock with Pro
        </Link>
        <p className="font-mono text-xs text-[#16130a]/60 dark:text-gray-400">You&apos;ve used today&apos;s free analyses. Pro is unlimited.</p>
      </>
    )
  }

  // Ready — Pro (unlimited) or free with trials
  return (
    <>
      <button onClick={onAnalyze} className={`${btn} bg-[#2563eb] text-[#fff]`}>
        <Brain className="h-4 w-4" />
        {remaining === null ? 'Click to analyze' : `Click to analyze (${remaining} left)`}
      </button>
      <p className="font-mono text-xs text-[#16130a]/60 dark:text-gray-400">
        {remaining === null ? 'Unlimited with Pro.' : 'Runs three AI models in parallel.'}
      </p>
    </>
  )
}
