'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { TrendingUp, Bot, BarChart2, ChevronRight, Check, GraduationCap, Award, BookOpen, Sparkles, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import MrGuyLogoSvg from '@/components/MrGuyLogoSvg'

const STORAGE_KEY = 'zg_onboarded_v2'

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Complete Beginner', desc: "I've never invested before", Icon: GraduationCap },
  { id: 'some',     label: 'Some Experience',   desc: 'I know the basics',           Icon: TrendingUp },
  { id: 'experienced', label: 'Experienced',    desc: "I've been investing for years", Icon: Award },
]

const GOALS = [
  { id: 'learn',     label: 'Learn the basics',          Icon: GraduationCap },
  { id: 'practice',  label: 'Practice with fake money',  Icon: BarChart2 },
  { id: 'questions', label: 'Get my questions answered', Icon: Bot },
  { id: 'terms',     label: 'Understand the terms',      Icon: BookOpen },
]

// Mirrors the primary nav — learning leads, then practice, then the AI buddy,
// the dictionary, and the deeper research tools for when you graduate.
const FEATURES = [
  { icon: GraduationCap, label: 'Learn',           desc: 'Bite-size lessons with XP and streaks that take you from total beginner to confident. Start here.' },
  { icon: BarChart2,     label: '$100K Challenge', desc: 'Practice investing with $100,000 in fake money — real market prices, zero risk.' },
  { icon: Bot,           label: 'Ask Mr. Guy',     desc: 'Your AI buddy. Ask anything about investing and get a plain-English answer.' },
  { icon: BookOpen,      label: 'Dictionary',      desc: 'Every confusing term explained simply, the moment you need it.' },
  { icon: Search,        label: 'Research & Markets', desc: 'Dig into any stock and track the whole market — there when you’re ready for it.' },
]

export default function OnboardingModal() {
  const { data: session, status, update: updateSession } = useSession()
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [experience, setExperience] = useState<string | null>(null)
  const [goals, setGoals] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Only show for logged-in users who haven't completed onboarding.
    // Gate purely on the DB flag (carried in the session token) so the behaviour is
    // identical across devices — relying on localStorage made it re-show in incognito
    // for accounts that had already finished onboarding.
    if (status !== 'authenticated') return
    if (!(session?.user as any)?.hasOnboarded) setVisible(true)
  }, [status, session])

  // Mark the user as onboarded in the DB + refresh the session token so it won't
  // show again — used both when finishing the flow and when dismissing it.
  const persistOnboarded = async () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experience: experience ?? 'beginner', goals: Array.from(goals) }),
    }).catch(() => {})
    updateSession()
  }

  // Closing without finishing (backdrop / Escape) still counts as "seen" so it
  // doesn't nag on the next page load.
  const dismiss = () => { setVisible(false); persistOnboarded() }

  const complete = async () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    const level = experience ?? 'beginner'
    localStorage.setItem('zg_experience', level)

    // Save to DB — marks hasOnboarded=true so it never shows again on any device
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experience: level, goals: Array.from(goals) }),
    }).catch(() => {})

    // Save experience level
    fetch('/api/user/experience', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experienceLevel: level }),
    }).catch(() => {})

    // Refresh session token so hasOnboarded is reflected immediately
    updateSession()

    // Kick off the guided tour for new users
    localStorage.setItem('zg_guided_tour_active', '1')
    localStorage.setItem('zg_guided_tour_step', '0')
    window.dispatchEvent(new Event('zg-tour-start'))

    setVisible(false)
  }

  const modalRef = useRef<HTMLDivElement>(null)

  // Escape key closes modal
  useEffect(() => {
    if (!visible) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [visible])

  // Focus trap
  useEffect(() => {
    if (!visible) return
    const modal = modalRef.current
    if (!modal) return

    // Focus first focusable element
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    )
    focusable[0]?.focus()

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [visible])

  const toggleGoal = (id: string) =>
    setGoals((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  if (!visible) return null

  // ── Arcade tokens ───────────────────────────────────────────────────
  const cardBase = 'border-2 bg-[#fff] dark:bg-gray-900 border-[#16130a]/15 dark:border-gray-700 hover:border-[#16130a]/40 dark:hover:border-gray-600'
  const cardSel  = 'border-2 border-[#16130a] dark:border-blue-500 bg-[#ffd23f]/25 dark:bg-blue-600/10'
  const iconBox  = 'h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-[#ffd23f] border-2 border-[#16130a] dark:border-gray-700'
  const primaryBtn = 'bg-[#16130a] text-[#ffd23f] hover:bg-[#0f0c06] dark:bg-blue-600 dark:text-[#fff] dark:hover:bg-blue-700'
  const backBtn  = 'border-2 border-[#16130a]/25 text-[#16130a]/60 hover:text-[#16130a] hover:border-[#16130a]/50 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white'

  return (
    <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-xl p-4 overflow-y-auto" onClick={dismiss}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-3xl bg-[#fdf3d7] dark:bg-gray-950 border-2 border-[#16130a] dark:border-gray-800 rounded-3xl shadow-[8px_8px_0_#16130a] dark:shadow-2xl flex flex-col max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Progress bar */}
        <div className="h-1.5 bg-[#16130a]/10 dark:bg-gray-800 rounded-t-3xl shrink-0">
          <div
            className="h-full bg-[#16130a] dark:bg-blue-600 transition-all duration-500 rounded-t-3xl"
            style={{ width: `${((step + 1) / 4) * 100}%` }}
          />
        </div>

        {/* Step dots — pinned above scroll area */}
        <div className="flex items-center justify-center gap-2 pt-6 px-6 shrink-0">
          {[0,1,2,3].map((i) => (
            <div key={i} className={cn('h-2.5 rounded-full transition-all duration-300', i === step ? 'w-8 bg-[#16130a] dark:bg-blue-500' : i < step ? 'w-2.5 bg-[#16130a]/40 dark:bg-blue-800' : 'w-2.5 bg-[#16130a]/15 dark:bg-gray-700')} />
          ))}
        </div>

        {/* Scrollable content area */}
        <div className="px-6 md:px-10 pt-6 pb-2 overflow-y-auto flex-1">

          {/* STEP 0: Welcome */}
          {step === 0 && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="bg-[#fff] border-[3px] border-[#16130a] shadow-[5px_5px_0_#16130a] dark:shadow-none p-3 inline-flex rounded-xl">
                  <MrGuyLogoSvg px={4} />
                </div>
              </div>
              <div>
                <h2 id="modal-title" className="font-display text-2xl sm:text-4xl text-[#16130a] dark:text-white">Welcome to Mr. Guy Invests</h2>
                <p className="text-[#16130a]/60 dark:text-gray-400 mt-3 text-base sm:text-lg leading-relaxed max-w-lg mx-auto">Learn investing from scratch — fun, bite-size lessons, a $100K practice account, and Mr. Guy to explain anything in plain English.</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { Icon: GraduationCap, label: 'Bite-size lessons' },
                  { Icon: BarChart2,     label: '$100K practice account' },
                  { Icon: Bot,           label: 'Ask Mr. Guy anything' },
                ].map((f) => (
                  <div key={f.label} className="bg-[#fff] dark:bg-gray-900 rounded-2xl p-3 sm:p-5 border-2 border-[#16130a]/15 dark:border-gray-800">
                    <div className="h-9 w-9 rounded-lg bg-[#ffd23f] border-2 border-[#16130a] dark:border-gray-700 flex items-center justify-center mb-2 mx-auto sm:mx-0">
                      <f.Icon className="h-5 w-5 text-[#16130a]" />
                    </div>
                    <p className="text-xs sm:text-sm text-[#16130a]/70 dark:text-gray-400 font-semibold">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1: Experience */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="font-display text-2xl sm:text-3xl text-[#16130a] dark:text-white">What's your experience level?</h2>
                <p className="text-[#16130a]/50 dark:text-gray-500 mt-2 text-base">We'll tailor things to match where you're at</p>
              </div>

              {/* AI personalization notice */}
              <div className="flex items-start gap-3 bg-[#ffd23f]/25 dark:bg-blue-600/10 border-2 border-[#16130a]/15 dark:border-blue-500/20 rounded-2xl px-4 py-3">
                <Sparkles className="h-4 w-4 text-[#16130a] dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="text-sm text-[#16130a]/80 dark:text-blue-300 leading-relaxed">
                  <strong className="text-[#16130a] dark:text-blue-200">This changes how Mr. Guy explains things to you.</strong> Beginners get everything in plain English. Experienced investors get the full technical breakdown. You can change this anytime in Settings.
                </p>
              </div>

              <div className="space-y-3">
                {EXPERIENCE_LEVELS.map((lvl) => {
                  const sel = experience === lvl.id
                  return (
                    <button
                      key={lvl.id}
                      onClick={() => setExperience(lvl.id)}
                      className={cn('w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all', sel ? cardSel : cardBase)}
                    >
                      <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border-2', sel ? 'bg-[#ffd23f] border-[#16130a] dark:border-gray-700' : 'bg-[#16130a]/5 dark:bg-gray-800 border-transparent')}>
                        <lvl.Icon className={cn('h-6 w-6', sel ? 'text-[#16130a]' : 'text-[#16130a]/50 dark:text-gray-400')} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[#16130a] dark:text-white font-bold text-base">{lvl.label}</p>
                        <p className="text-[#16130a]/55 dark:text-gray-500 text-sm">{lvl.desc}</p>
                      </div>
                      {sel && <Check className="h-6 w-6 text-[#16130a] dark:text-blue-400 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Goals */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="font-display text-2xl sm:text-3xl text-[#16130a] dark:text-white">What brings you here?</h2>
                <p className="text-[#16130a]/50 dark:text-gray-500 mt-2 text-base">Pick everything that applies</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {GOALS.map((g) => {
                  const selected = goals.has(g.id)
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGoal(g.id)}
                      className={cn('flex flex-col items-start gap-3 p-4 rounded-2xl text-left transition-all', selected ? cardSel : cardBase)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center border-2', selected ? 'bg-[#ffd23f] border-[#16130a] dark:border-gray-700' : 'bg-[#16130a]/5 dark:bg-gray-800 border-transparent')}>
                          <g.Icon className={cn('h-5 w-5', selected ? 'text-[#16130a]' : 'text-[#16130a]/50 dark:text-gray-400')} />
                        </div>
                        {selected && <Check className="h-5 w-5 text-[#16130a] dark:text-blue-400" />}
                      </div>
                      <p className="text-sm sm:text-base font-semibold text-[#16130a] dark:text-white">{g.label}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Feature tour */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="font-display text-2xl sm:text-3xl text-[#16130a] dark:text-white">Here's what you can do</h2>
                <p className="text-[#16130a]/50 dark:text-gray-500 mt-2 text-base">A quick look at the most useful features</p>
              </div>
              <div className="space-y-3">
                {FEATURES.map((f) => {
                  const Icon = f.icon
                  return (
                    <div key={f.label} className="flex items-start gap-4 p-4 rounded-2xl border-2 border-[#16130a]/15 dark:border-gray-800 bg-[#fff] dark:bg-gray-900">
                      <div className={iconBox}>
                        <Icon className="h-5 w-5 text-[#16130a]" />
                      </div>
                      <div>
                        <p className="text-[#16130a] dark:text-white font-bold text-base">{f.label}</p>
                        <p className="text-[#16130a]/65 dark:text-gray-400 mt-1 text-sm leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-[#16130a]/40 dark:text-gray-600 text-center">Your AI experience level is saved. You can change it anytime in Settings.</p>
            </div>
          )}
        </div>

        {/* Sticky footer — action buttons always visible, never scrolled away */}
        <div className="px-6 md:px-10 pb-6 pt-4 shrink-0">
          {step === 0 && (
            <button
              onClick={() => setStep(1)}
              className={cn('w-full h-14 text-lg font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors', primaryBtn)}
            >
              Get Started <ChevronRight className="h-5 w-5" />
            </button>
          )}
          {step === 1 && (
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className={cn('flex-1 h-12 rounded-2xl transition-colors', backBtn)}>Back</button>
              <button onClick={() => setStep(2)} disabled={!experience} className={cn('flex-1 h-12 font-bold rounded-2xl transition-colors disabled:opacity-40', primaryBtn)}>Continue</button>
            </div>
          )}
          {step === 2 && (
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className={cn('flex-1 h-12 rounded-2xl transition-colors', backBtn)}>Back</button>
              <button onClick={() => setStep(3)} className={cn('flex-1 h-12 font-bold rounded-2xl transition-colors', primaryBtn)}>Continue</button>
            </div>
          )}
          {step === 3 && (
            <button onClick={complete} className={cn('w-full h-14 text-lg font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors', primaryBtn)}>
              Start Exploring <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
