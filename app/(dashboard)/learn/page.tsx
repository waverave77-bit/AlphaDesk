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

/* Per-course front/edge hex for the 3D nodes + banners. */
const HEX: Record<string, { front: string; edge: string; glow: string }> = {
  blue:    { front: '#3b82f6', edge: '#1d4ed8', glow: 'rgba(59,130,246,.55)' },
  purple:  { front: '#a855f7', edge: '#7e22ce', glow: 'rgba(168,85,247,.55)' },
  emerald: { front: '#10b981', edge: '#047857', glow: 'rgba(16,185,129,.55)' },
  red:     { front: '#ef4444', edge: '#b91c1c', glow: 'rgba(239,68,68,.55)' },
  amber:   { front: '#f59e0b', edge: '#b45309', glow: 'rgba(245,158,11,.55)' },
  pink:    { front: '#ec4899', edge: '#be185d', glow: 'rgba(236,72,153,.55)' },
}
const LOCKED = { front: '#374151', edge: '#1f2937' }

// Zig-zag offsets for the winding path.
const OFFSETS = [0, 52, 78, 52, 0, -52, -78, -52]

export default function LearnPage() {
  const router = useRouter()
  const [progress, setProgress] = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/learn/progress').then((r) => r.json()).then(setProgress).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const completedIds = new Set(progress?.completed.map((c) => c.lessonId) ?? [])
  const isUnlocked = (g: number) => g === 0 || completedIds.has(ALL_LESSONS[g - 1]?.id)
  const currentLesson = ALL_LESSONS.find((l) => !completedIds.has(l.id) && isUnlocked(l.globalOrder))
  const completedCount = completedIds.size
  const pct = Math.round((completedCount / TOTAL_LESSONS) * 100)

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <style>{`
        @keyframes lpFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        @keyframes lpStartBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes lpPulseRing{0%{box-shadow:0 0 0 0 var(--ring)}70%{box-shadow:0 0 0 14px transparent}100%{box-shadow:0 0 0 0 transparent}}
        .lnode{position:relative;width:74px;height:74px;border:none;background:transparent;padding:0}
        .lnode .lne{position:absolute;inset:0;border-radius:9999px;background:var(--e)}
        .lnode .lnf{position:absolute;inset:0;border-radius:9999px;background:var(--f);transform:translateY(-7px);display:flex;align-items:center;justify-content:center;transition:transform 120ms cubic-bezier(.3,.7,.4,1.5)}
        .lnode:not(:disabled){cursor:pointer}
        .lnode:not(:disabled):hover .lnf{transform:translateY(-10px)}
        .lnode:not(:disabled):active .lnf{transform:translateY(-2px)}
        .lp-float{animation:lpFloat 2.6s ease-in-out infinite}
      `}</style>

      {/* ── Hero / stats ── */}
      <div className="relative overflow-hidden rounded-3xl p-6 mb-6 border-2 border-blue-500/20 bg-gradient-to-br from-blue-600/20 via-gray-900 to-gray-900">
        <div className="flex items-center gap-4">
          <div className="shrink-0 bg-gray-950/40 rounded-2xl p-2 lp-float"><MrGuyHead px={5} /></div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-black text-white leading-tight tracking-tight">Learn to Invest</h1>
            <p className="text-blue-200/70 text-sm mt-1 font-medium">5 minutes a day. Zero jargon. Mr. Guy’s got you.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <Stat icon={<Flame className="h-5 w-5 fill-orange-400" />} value={progress?.streak ?? 0} label="day streak" color="text-orange-400" />
          <Stat icon={<Star className="h-5 w-5 fill-yellow-400" />} value={progress?.xp ?? 0} label="total XP" color="text-yellow-400" />
          <Stat plain={`${completedCount}/${TOTAL_LESSONS}`} label="lessons" color="text-blue-400" />
        </div>
        <div className="mt-3 h-2.5 bg-gray-950/50 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          {progress && !progress.authed ? (
            <Link href="/register" className="text-sm font-bold text-blue-300 hover:text-blue-200">Sign up free to save your streak →</Link>
          ) : <span />}
          <Link href="/glossary" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors font-medium">
            <BookOpen className="h-4 w-4" /> Dictionary
          </Link>
        </div>
      </div>

      {/* ── Courses + winding path ── */}
      {COURSES.map((course) => {
        const lessons = getLessonsForCourse(course.id)
        const hex = HEX[course.color] ?? HEX.blue
        const courseDone = lessons.every((l) => completedIds.has(l.id))
        const courseStarted = lessons.some((l) => completedIds.has(l.id) || currentLesson?.courseId === course.id)
        return (
          <div key={course.id} className="mb-4">
            {/* Unit banner */}
            <div
              className="rounded-3xl px-5 py-4 flex items-center gap-4 shadow-lg"
              style={{ background: hex.front, boxShadow: `0 5px 0 ${hex.edge}` }}
            >
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shrink-0">{course.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-[11px] font-black uppercase tracking-widest">{courseDone ? 'Completed' : courseStarted ? 'In progress' : 'Up next'}</p>
                <h2 className="text-white font-black text-xl leading-tight flex items-center gap-2">
                  {course.title} {courseDone && <Check className="h-5 w-5" strokeWidth={3} />}
                </h2>
                <p className="text-white/80 text-sm font-medium">{course.tagline}</p>
              </div>
            </div>

            {/* Lesson nodes */}
            <div className="flex flex-col items-center gap-5 py-6">
              {lessons.map((lesson, i) => {
                const done = completedIds.has(lesson.id)
                const unlocked = isUnlocked(lesson.globalOrder)
                const isCurrent = currentLesson?.id === lesson.id
                const f = unlocked ? hex.front : LOCKED.front
                const e = unlocked ? hex.edge : LOCKED.edge
                const offset = OFFSETS[i % OFFSETS.length]
                return (
                  <div key={lesson.id} className="relative flex flex-col items-center" style={{ transform: `translateX(${offset}px)` }}>
                    {isCurrent && (
                      <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-10" style={{ animation: 'lpStartBob 1.6s ease-in-out infinite' }}>
                        <div className="relative bg-white px-3 py-1 rounded-xl shadow-lg">
                          <span className="text-[12px] font-black uppercase tracking-wide" style={{ color: hex.front }}>Start</span>
                          <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-white rotate-45" />
                        </div>
                      </div>
                    )}
                    <button
                      disabled={!unlocked}
                      onClick={() => router.push(`/learn/${lesson.id}`)}
                      className="lnode"
                      style={{
                        ['--f' as any]: f, ['--e' as any]: e,
                        ['--ring' as any]: hex.glow,
                        ...(isCurrent ? { animation: 'lpPulseRing 1.8s infinite', borderRadius: '9999px' } : {}),
                      }}
                      aria-label={`${course.title} lesson ${lesson.index}${done ? ' (completed)' : unlocked ? '' : ' (locked)'}`}
                    >
                      <span className="lne" />
                      <span className="lnf" style={done ? { boxShadow: `0 0 18px ${hex.glow}` } : undefined}>
                        {done ? <Check className="h-8 w-8 text-white" strokeWidth={3.5} />
                          : !unlocked ? <Lock className="h-6 w-6 text-gray-500" />
                          : <span className="text-white font-black text-2xl drop-shadow">{lesson.index}</span>}
                      </span>
                    </button>
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

function Stat({ icon, value, plain, label, color }: { icon?: React.ReactNode; value?: number; plain?: string; label: string; color: string }) {
  return (
    <div className="bg-gray-950/40 rounded-2xl px-2 py-3 text-center">
      <div className={`flex items-center justify-center gap-1 font-black text-2xl ${color}`}>
        {icon} {plain ?? value}
      </div>
      <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-wide">{label}</p>
    </div>
  )
}
