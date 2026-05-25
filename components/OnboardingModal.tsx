'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { TrendingUp, Search, Bot, BarChart2, ChevronRight, Check, GraduationCap, Award, Briefcase, BookOpen, Newspaper, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'zg_onboarded_v2'

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Complete Beginner', desc: "I've never invested before", Icon: GraduationCap },
  { id: 'some',     label: 'Some Experience',   desc: 'I know the basics',           Icon: TrendingUp },
  { id: 'experienced', label: 'Experienced',    desc: "I've been investing for years", Icon: Award },
]

const GOALS = [
  { id: 'portfolio', label: 'Try Mr. Guy AI tools', Icon: Bot },
  { id: 'learn',     label: 'Learn investing basics', Icon: BookOpen },
  { id: 'markets',   label: 'Follow market news',     Icon: Newspaper },
  { id: 'research',  label: 'Research stocks',        Icon: Search },
]

const FEATURES = [
  { icon: Search,   color: 'bg-blue-600/20 border-blue-500/30 text-blue-400',   label: 'Stock Research',      desc: 'Deep-dive any stock with live data, charts, and AI analysis' },
  { icon: Bot,      color: 'bg-purple-600/20 border-purple-500/30 text-purple-400', label: 'AI Investing Coach', desc: 'Ask anything, powered by live news, explained in plain English' },
  { icon: BarChart2, color: 'bg-green-600/20 border-green-500/30 text-green-400', label: 'Live Markets',       desc: 'Sector heatmaps, top movers, and the Fear and Greed index' },
]

export default function OnboardingModal() {
  const { data: session, status, update: updateSession } = useSession()
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [experience, setExperience] = useState<string | null>(null)
  const [goals, setGoals] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Only show for logged-in users who haven't completed onboarding
    // Check DB flag (via session) first, fall back to localStorage for backwards compat
    if (status !== 'authenticated') return
    const alreadyDone = (session?.user as any)?.hasOnboarded || localStorage.getItem(STORAGE_KEY)
    if (!alreadyDone) setVisible(true)
  }, [status, session])

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

    setVisible(false)
  }

  const toggleGoal = (id: string) =>
    setGoals((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="w-full max-w-3xl bg-gray-950 border border-gray-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-800 rounded-t-3xl shrink-0">
          <div
            className="h-full bg-blue-600 transition-all duration-500 rounded-t-3xl"
            style={{ width: `${((step + 1) / 4) * 100}%` }}
          />
        </div>

        {/* Step dots — pinned above scroll area */}
        <div className="flex items-center justify-center gap-2 pt-6 px-6 shrink-0">
          {[0,1,2,3].map((i) => (
            <div key={i} className={cn('h-2.5 rounded-full transition-all duration-300', i === step ? 'w-8 bg-blue-500' : i < step ? 'w-2.5 bg-blue-800' : 'w-2.5 bg-gray-700')} />
          ))}
        </div>

        {/* Scrollable content area */}
        <div className="px-6 md:px-10 pt-6 pb-2 overflow-y-auto flex-1">

          {/* STEP 0: Welcome */}
          {step === 0 && (
            <div className="text-center space-y-6">
              <div className="h-20 w-20 rounded-3xl bg-blue-600 flex items-center justify-center mx-auto shadow-2xl shadow-blue-600/40">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Welcome to Mr. Guy Invests</h2>
                <p className="text-gray-400 mt-3 text-base sm:text-lg leading-relaxed max-w-lg mx-auto">Your personal stock market research and learning platform, built for everyday investors.</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { Icon: BarChart2, label: 'Live market data' },
                  { Icon: Bot,       label: 'AI investing coach' },
                  { Icon: BookOpen,  label: 'Learn as you go' },
                ].map((f) => (
                  <div key={f.label} className="bg-gray-900 rounded-2xl p-3 sm:p-5 border border-gray-800">
                    <f.Icon className="h-6 w-6 text-blue-400 mb-2" />
                    <p className="text-xs sm:text-sm text-gray-400 font-medium">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1: Experience */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">What's your experience level?</h2>
                <p className="text-gray-500 mt-2 text-base">We'll tailor things to match where you're at</p>
              </div>

              {/* AI personalization notice */}
              <div className="flex items-start gap-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl px-4 py-3">
                <Sparkles className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-300 leading-relaxed">
                  <strong>This changes how Mr. Guy explains things to you.</strong> Beginners get everything in plain English. Experienced investors get the full technical breakdown. You can change this anytime in Settings.
                </p>
              </div>

              <div className="space-y-3">
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => setExperience(lvl.id)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all',
                      experience === lvl.id ? 'border-blue-500 bg-blue-600/10' : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                    )}
                  >
                    <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0', experience === lvl.id ? 'bg-blue-600/20' : 'bg-gray-800')}>
                      <lvl.Icon className={cn('h-6 w-6', experience === lvl.id ? 'text-blue-400' : 'text-gray-400')} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-base">{lvl.label}</p>
                      <p className="text-gray-500 text-sm">{lvl.desc}</p>
                    </div>
                    {experience === lvl.id && <Check className="h-6 w-6 text-blue-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Goals */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">What brings you here?</h2>
                <p className="text-gray-500 mt-2 text-base">Pick everything that applies</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {GOALS.map((g) => {
                  const selected = goals.has(g.id)
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGoal(g.id)}
                      className={cn(
                        'flex flex-col items-start gap-3 p-4 rounded-2xl border text-left transition-all',
                        selected ? 'border-blue-500 bg-blue-600/10' : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', selected ? 'bg-blue-600/20' : 'bg-gray-800')}>
                          <g.Icon className={cn('h-5 w-5', selected ? 'text-blue-400' : 'text-gray-400')} />
                        </div>
                        {selected && <Check className="h-5 w-5 text-blue-400" />}
                      </div>
                      <p className="text-sm sm:text-base font-semibold text-white">{g.label}</p>
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
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Here's what you can do</h2>
                <p className="text-gray-500 mt-2 text-base">A quick look at the most useful features</p>
              </div>
              <div className="space-y-3">
                {FEATURES.map((f) => {
                  const Icon = f.icon
                  return (
                    <div key={f.label} className={cn('flex items-start gap-4 p-4 rounded-2xl border border-gray-800 bg-gray-900')}>
                      <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border', f.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-base">{f.label}</p>
                        <p className="text-gray-400 mt-1 text-sm leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-gray-600 text-center">Your AI experience level is saved. You can change it anytime in Settings.</p>
            </div>
          )}
        </div>

        {/* Sticky footer — action buttons always visible, never scrolled away */}
        <div className="px-6 md:px-10 pb-6 pt-4 shrink-0">
          {step === 0 && (
            <button
              onClick={() => setStep(1)}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors"
            >
              Get Started <ChevronRight className="h-5 w-5" />
            </button>
          )}
          {step === 1 && (
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 h-12 rounded-2xl border border-gray-700 text-gray-400 hover:text-white transition-colors">Back</button>
              <button onClick={() => setStep(2)} disabled={!experience} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold rounded-2xl transition-colors">Continue</button>
            </div>
          )}
          {step === 2 && (
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 h-12 rounded-2xl border border-gray-700 text-gray-400 hover:text-white transition-colors">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-colors">Continue</button>
            </div>
          )}
          {step === 3 && (
            <button onClick={complete} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors">
              Start Exploring <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
