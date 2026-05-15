'use client'
import { useState, useEffect } from 'react'
import { TrendingUp, Search, Bot, BarChart2, ChevronRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'zg_onboarded_v2'

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Complete Beginner', desc: "I've never invested before", emoji: '🌱' },
  { id: 'some', label: 'Some Experience', desc: 'I know the basics', emoji: '📈' },
  { id: 'experienced', label: 'Experienced', desc: "I've been investing for a while", emoji: '🏆' },
]

const GOALS = [
  { id: 'portfolio', label: 'Track my portfolio', emoji: '💼' },
  { id: 'learn', label: 'Learn investing basics', emoji: '📖' },
  { id: 'markets', label: 'Follow market news', emoji: '📰' },
  { id: 'research', label: 'Research stocks', emoji: '🔍' },
]

const FEATURES = [
  { icon: Search, color: 'bg-blue-600/20 border-blue-500/30 text-blue-400', label: 'Stock Research', desc: 'Deep-dive any stock with live data, charts, and AI analysis' },
  { icon: Bot, color: 'bg-purple-600/20 border-purple-500/30 text-purple-400', label: 'AI Investing Coach', desc: 'Ask anything — powered by live news, explained in plain English' },
  { icon: BarChart2, color: 'bg-green-600/20 border-green-500/30 text-green-400', label: 'Live Markets', desc: 'Sector heatmaps, top movers, and the Fear & Greed index' },
]

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [experience, setExperience] = useState<string | null>(null)
  const [goals, setGoals] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  const complete = async () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    if (experience) localStorage.setItem('zg_experience', experience)
    // Save to DB in background (fire and forget)
    fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experience, goals: [...goals] }),
    }).catch(() => {})
    setVisible(false)
  }

  const toggleGoal = (id: string) =>
    setGoals((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl">
      <div className="w-full max-w-3xl mx-4 bg-gray-950 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden">

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-800">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${((step + 1) / 4) * 100}%` }}
          />
        </div>

        <div className="p-10 md:p-14">
          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {[0,1,2,3].map((i) => (
              <div key={i} className={cn('h-2.5 rounded-full transition-all duration-300', i === step ? 'w-8 bg-blue-500' : i < step ? 'w-2.5 bg-blue-800' : 'w-2.5 bg-gray-700')} />
            ))}
          </div>

          {/* ── STEP 0: Welcome ── */}
          {step === 0 && (
            <div className="text-center space-y-8">
              <div className="h-24 w-24 rounded-3xl bg-blue-600 flex items-center justify-center mx-auto shadow-2xl shadow-blue-600/40">
                <TrendingUp className="h-12 w-12 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-extrabold text-white">Welcome to Zains Game</h2>
                <p className="text-gray-400 mt-3 text-lg leading-relaxed max-w-lg mx-auto">Your personal stock market research and learning platform — built for everyday investors.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { emoji: '📊', label: 'Live market data' },
                  { emoji: '🤖', label: 'AI investing coach' },
                  { emoji: '📖', label: 'Learn as you go' },
                ].map((f) => (
                  <div key={f.label} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                    <div className="text-3xl mb-2">{f.emoji}</div>
                    <p className="text-sm text-gray-400 font-medium">{f.label}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(1)}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors"
              >
                Get Started <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* ── STEP 1: Experience ── */}
          {step === 1 && (
            <div className="space-y-7">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white">What's your experience level?</h2>
                <p className="text-gray-500 mt-2 text-base">We'll tailor things to match where you're at</p>
              </div>
              <div className="space-y-4">
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => setExperience(lvl.id)}
                    className={cn(
                      'w-full flex items-center gap-5 p-5 rounded-2xl border text-left transition-all',
                      experience === lvl.id ? 'border-blue-500 bg-blue-600/10' : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                    )}
                  >
                    <span className="text-4xl">{lvl.emoji}</span>
                    <div className="flex-1">
                      <p className="text-white font-bold text-lg">{lvl.label}</p>
                      <p className="text-gray-500">{lvl.desc}</p>
                    </div>
                    {experience === lvl.id && <Check className="h-6 w-6 text-blue-400 shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 h-12 rounded-2xl border border-gray-700 text-gray-400 hover:text-white transition-colors">Back</button>
                <button onClick={() => setStep(2)} disabled={!experience} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold rounded-2xl transition-colors">Continue</button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Goals ── */}
          {step === 2 && (
            <div className="space-y-7">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white">What brings you here?</h2>
                <p className="text-gray-500 mt-2 text-base">Pick everything that applies</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {GOALS.map((g) => {
                  const selected = goals.has(g.id)
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGoal(g.id)}
                      className={cn(
                        'flex flex-col items-start gap-3 p-6 rounded-2xl border text-left transition-all',
                        selected ? 'border-blue-500 bg-blue-600/10' : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-3xl">{g.emoji}</span>
                        {selected && <Check className="h-5 w-5 text-blue-400" />}
                      </div>
                      <p className="text-base font-semibold text-white">{g.label}</p>
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 h-12 rounded-2xl border border-gray-700 text-gray-400 hover:text-white transition-colors">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-colors">Continue</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Feature tour ── */}
          {step === 3 && (
            <div className="space-y-7">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white">Here's what you can do</h2>
                <p className="text-gray-500 mt-2 text-base">A quick look at the most useful features</p>
              </div>
              <div className="space-y-4">
                {FEATURES.map((f) => {
                  const Icon = f.icon
                  return (
                    <div key={f.label} className={cn('flex items-start gap-5 p-5 rounded-2xl border', f.color.split(' ').slice(0,2).join(' '), 'border-gray-800 bg-gray-900')}>
                      <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border', f.color)}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-base">{f.label}</p>
                        <p className="text-gray-400 mt-1 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <button onClick={complete} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors">
                Start Exploring <ChevronRight className="h-5 w-5" />
              </button>
              <button onClick={complete} className="w-full text-sm text-gray-600 hover:text-gray-400 transition-colors">Skip for now</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
