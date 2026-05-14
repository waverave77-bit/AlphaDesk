'use client'
import { useState, useEffect } from 'react'
import { TrendingUp, Search, Bot, BookOpen, BarChart2, ChevronRight, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'zg_onboarded'

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
  { icon: Search, color: 'bg-blue-600/20 text-blue-400', label: 'Stock Research', desc: 'Deep-dive any stock or ETF with live data, charts, and AI analysis' },
  { icon: Bot, color: 'bg-purple-600/20 text-purple-400', label: 'AI Investing Coach', desc: 'Ask anything — powered by live news and explained in plain English' },
  { icon: BarChart2, color: 'bg-green-600/20 text-green-400', label: 'Live Markets', desc: 'Sector heatmaps, movers, macro data and Fear & Greed index' },
]

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [experience, setExperience] = useState<string | null>(null)
  const [goals, setGoals] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  const complete = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  const toggleGoal = (id: string) => {
    setGoals((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (!visible) return null

  const STEPS = ['Welcome', 'Experience', 'Goals', 'Features']

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gray-950 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 bg-gray-800">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-8">
          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((_, i) => (
              <div key={i} className={cn('h-2 rounded-full transition-all', i === step ? 'w-6 bg-blue-500' : i < step ? 'w-2 bg-blue-800' : 'w-2 bg-gray-700')} />
            ))}
          </div>

          {/* STEP 0 — Welcome */}
          {step === 0 && (
            <div className="text-center space-y-5">
              <div className="h-20 w-20 rounded-3xl bg-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-white">Welcome to Zains Game</h2>
                <p className="text-gray-400 mt-2 text-base leading-relaxed">Your personal stock market research and learning platform — built for everyday investors.</p>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { emoji: '📊', label: 'Live market data' },
                  { emoji: '🤖', label: 'AI investing coach' },
                  { emoji: '📖', label: 'Learn as you go' },
                ].map((f) => (
                  <div key={f.label} className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                    <div className="text-2xl mb-1.5">{f.emoji}</div>
                    <p className="text-xs text-gray-400 font-medium">{f.label}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(1)}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors mt-2"
              >
                Get Started <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* STEP 1 — Experience */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">What's your experience level?</h2>
                <p className="text-gray-500 text-sm mt-1">We'll tailor things to match where you're at</p>
              </div>
              <div className="space-y-3">
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => setExperience(lvl.id)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all',
                      experience === lvl.id
                        ? 'border-blue-500 bg-blue-600/10'
                        : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                    )}
                  >
                    <span className="text-3xl">{lvl.emoji}</span>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{lvl.label}</p>
                      <p className="text-gray-500 text-sm">{lvl.desc}</p>
                    </div>
                    {experience === lvl.id && <Check className="h-5 w-5 text-blue-400 shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 h-11 rounded-2xl border border-gray-700 text-gray-400 hover:text-white transition-colors text-sm">Back</button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!experience}
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold rounded-2xl transition-colors text-sm"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — Goals */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">What brings you here?</h2>
                <p className="text-gray-500 text-sm mt-1">Pick everything that applies</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {GOALS.map((g) => {
                  const selected = goals.has(g.id)
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGoal(g.id)}
                      className={cn(
                        'flex flex-col items-start gap-2 p-4 rounded-2xl border text-left transition-all',
                        selected ? 'border-blue-500 bg-blue-600/10' : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-2xl">{g.emoji}</span>
                        {selected && <Check className="h-4 w-4 text-blue-400" />}
                      </div>
                      <p className="text-sm font-semibold text-white">{g.label}</p>
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 h-11 rounded-2xl border border-gray-700 text-gray-400 hover:text-white transition-colors text-sm">Back</button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-colors text-sm"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Feature tour */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">Here's what you can do</h2>
                <p className="text-gray-500 text-sm mt-1">A quick look at the most useful features</p>
              </div>
              <div className="space-y-3">
                {FEATURES.map((f) => {
                  const Icon = f.icon
                  return (
                    <div key={f.label} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-900 border border-gray-800">
                      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', f.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{f.label}</p>
                        <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={complete}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors"
              >
                Start Exploring <ChevronRight className="h-5 w-5" />
              </button>
              <button onClick={complete} className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors">
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
