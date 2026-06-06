'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { COURSES, ALL_LESSONS, TOTAL_LESSONS, getLessonsForCourse } from '@/lib/curriculum'
import MrGuyHead from '@/components/MrGuyHead'
import { Flame, Star, Lock, Check, BookOpen } from 'lucide-react'

type Progress = {
  authed: boolean
  completed: { lessonId: string; score: number; total: number }[]
  xp: number
  streak: number
  longestStreak: number
}

/* Static Tailwind class maps (dynamic bg-${color}-500 would get purged). */
const COLOR: Record<string, { solid: string; ring: string; text: string; soft: string }> = {
  blue:    { solid: 'bg-blue-500',    ring: 'ring-blue-400',    text: 'text-blue-400',    soft: 'bg-blue-500/10' },
  purple:  { solid: 'bg-purple-500',  ring: 'ring-purple-400',  text: 'text-purple-400',  soft: 'bg-purple-500/10' },
  emerald: { solid: 'bg-emerald-500', ring: 'ring-emerald-400', text: 'text-emerald-400', soft: 'bg-emerald-500/10' },
  red:     { solid: 'bg-red-500',     ring: 'ring-red-400',     text: 'text-red-400',     soft: 'bg-red-500/10' },
  amber:   { solid: 'bg-amber-500',   ring: 'ring-amber-400',   text: 'text-amber-400',   soft: 'bg-amber-500/10' },
  pink:    { solid: 'bg-pink-500',    ring: 'ring-pink-400',    text: 'text-pink-400',    soft: 'bg-pink-500/10' },
}

// Zig-zag horizontal offsets for that winding-path feel.
const OFFSETS = [0, 48, 72, 48, 0, -48, -72, -48]

export default function LearnPage() {
  const router = useRouter()
  const [progress, setProgress] = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/learn/progress')
      .then((r) => r.json())
      .then(setProgress)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const completedIds = new Set(progress?.completed.map((c) => c.lessonId) ?? [])
  const isUnlocked = (globalOrder: number) =>
    globalOrder === 0 || completedIds.has(ALL_LESSONS[globalOrder - 1]?.id)
  const currentLesson = ALL_LESSONS.find((l) => !completedIds.has(l.id) && isUnlocked(l.globalOrder))

  const completedCount = completedIds.size
  const pct = Math.round((completedCount / TOTAL_LESSONS) * 100)

  return (
    <div className="max-w-2xl mx-auto pb-16 space-y-6">
      <style>{`@keyframes lpPulse{0%,100%{box-shadow:0 0 0 0 rgba(96,165,250,.5)}50%{box-shadow:0 0 0 10px rgba(96,165,250,0)}}`}</style>

      {/* Header / stats */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
        <div className="flex items-center gap-4">
          <div className="shrink-0 bg-gray-800 rounded-2xl p-2"><MrGuyHead px={4} /></div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-white leading-tight">Learn to Invest</h1>
            <p className="text-gray-400 text-sm mt-0.5">Bite-sized lessons. 5 minutes a day. Zero jargon.</p>
          </div>
        </div>

        {/* Streak / XP / progress */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-gray-800/60 rounded-2xl px-3 py-3 text-center">
            <div className="flex items-center justify-center gap-1 text-orange-400 font-extrabold text-xl">
              <Flame className="h-5 w-5" /> {progress?.streak ?? 0}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">day streak</p>
          </div>
          <div className="bg-gray-800/60 rounded-2xl px-3 py-3 text-center">
            <div className="flex items-center justify-center gap-1 text-yellow-400 font-extrabold text-xl">
              <Star className="h-5 w-5" /> {progress?.xp ?? 0}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">XP earned</p>
          </div>
          <div className="bg-gray-800/60 rounded-2xl px-3 py-3 text-center">
            <div className="text-blue-400 font-extrabold text-xl">{completedCount}/{TOTAL_LESSONS}</div>
            <p className="text-[11px] text-gray-500 mt-0.5">lessons done</p>
          </div>
        </div>
        <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>

        {/* Guest nudge + dictionary link */}
        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          {progress && !progress.authed ? (
            <Link href="/register" className="text-sm font-semibold text-blue-400 hover:text-blue-300">
              Sign up free to save your streak & XP →
            </Link>
          ) : <span />}
          <Link href="/glossary" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
            <BookOpen className="h-4 w-4" /> Browse the Dictionary
          </Link>
        </div>
      </div>

      {/* Courses + winding lesson path */}
      {COURSES.map((course) => {
        const lessons = getLessonsForCourse(course.id)
        const c = COLOR[course.color] ?? COLOR.blue
        const courseDone = lessons.every((l) => completedIds.has(l.id))
        return (
          <div key={course.id} className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className={`h-12 w-12 rounded-2xl ${c.soft} flex items-center justify-center text-2xl`}>{course.emoji}</div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  {course.title}
                  {courseDone && <Check className={`h-4 w-4 ${c.text}`} />}
                </h2>
                <p className="text-sm text-gray-500">{course.tagline}</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 py-4">
              {lessons.map((lesson, i) => {
                const done = completedIds.has(lesson.id)
                const unlocked = isUnlocked(lesson.globalOrder)
                const isCurrent = currentLesson?.id === lesson.id
                const offset = OFFSETS[i % OFFSETS.length]
                return (
                  <div key={lesson.id} className="flex flex-col items-center" style={{ transform: `translateX(${offset}px)` }}>
                    <button
                      disabled={!unlocked}
                      onClick={() => router.push(`/learn/${lesson.id}`)}
                      style={isCurrent ? { animation: 'lpPulse 1.8s infinite' } : undefined}
                      className={[
                        'h-16 w-16 rounded-full flex items-center justify-center transition-transform',
                        unlocked ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-not-allowed',
                        done ? `${c.solid} shadow-lg` : isCurrent ? `${c.solid} ring-4 ${c.ring}` : unlocked ? 'bg-gray-700' : 'bg-gray-800',
                      ].join(' ')}
                      aria-label={`${course.title} lesson ${lesson.index}${done ? ' (completed)' : unlocked ? '' : ' (locked)'}`}
                    >
                      {done ? <Check className="h-7 w-7 text-white" strokeWidth={3} />
                        : !unlocked ? <Lock className="h-6 w-6 text-gray-600" />
                        : <span className="text-white font-extrabold text-lg">{lesson.index}</span>}
                    </button>
                    {isCurrent && <span className={`mt-1.5 text-[11px] font-bold ${c.text} uppercase tracking-wide`}>Start</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {loading && <p className="text-center text-gray-600 text-sm">Loading your progress…</p>}
    </div>
  )
}
