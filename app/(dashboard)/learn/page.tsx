'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { COURSES, ALL_LESSONS, TOTAL_LESSONS, getLessonsForCourse } from '@/lib/curriculum'
import { levelFromXP, levelIcon, ACHIEVEMENTS, unlockedAchievements, DAILY_GOAL, type ProgressSnapshot } from '@/lib/progression'
import { etDateString } from '@/lib/learn-streak'
import MrGuyMascot from '@/components/learn/MrGuyMascot'
import MrGuyHead from '@/components/MrGuyHead'
import { useSound } from '@/components/learn/useSound'
import { Flame, Star, Lock, Check, BookOpen, X, Crown, Gift, Target } from 'lucide-react'

type Progress = {
  authed: boolean
  completed: { lessonId: string; score: number; total: number; completedAt?: string }[]
  xp: number
  streak: number
  longestStreak: number
}
type LbRow = { rank: number; name: string; xp: number; level: number; isMe: boolean }

const HEX: Record<string, { front: string; edge: string; glow: string }> = {
  blue:    { front: '#3b82f6', edge: '#1d4ed8', glow: 'rgba(59,130,246,.55)' },
  purple:  { front: '#a855f7', edge: '#7e22ce', glow: 'rgba(168,85,247,.55)' },
  emerald: { front: '#10b981', edge: '#047857', glow: 'rgba(16,185,129,.55)' },
  red:     { front: '#ef4444', edge: '#b91c1c', glow: 'rgba(239,68,68,.55)' },
  amber:   { front: '#f59e0b', edge: '#b45309', glow: 'rgba(245,158,11,.55)' },
  pink:    { front: '#ec4899', edge: '#be185d', glow: 'rgba(236,72,153,.55)' },
}
const LOCKED = { front: '#374151', edge: '#1f2937' }
const OFFSETS = [0, 52, 78, 52, 0, -52, -78, -52]

function etDateOf(iso?: string): string {
  if (!iso) return ''
  const et = new Date(new Date(iso).toLocaleString('en-US', { timeZone: 'America/New_York' }))
  return `${et.getFullYear()}-${String(et.getMonth() + 1).padStart(2, '0')}-${String(et.getDate()).padStart(2, '0')}`
}

export default function LearnPage() {
  const router = useRouter()
  const sound = useSound()
  const [progress, setProgress] = useState<Progress | null>(null)
  const [board, setBoard] = useState<LbRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAch, setShowAch] = useState(false)

  const go = (href: string) => { sound.tick(); router.push(href) }

  useEffect(() => {
    fetch('/api/learn/progress').then((r) => r.json()).then(setProgress).catch(() => {}).finally(() => setLoading(false))
    fetch('/api/learn/leaderboard').then((r) => r.json()).then((d) => setBoard(d.leaderboard ?? [])).catch(() => {})
  }, [])

  const completedIds = new Set(progress?.completed.map((c) => c.lessonId) ?? [])
  const isUnlocked = (g: number) => g === 0 || completedIds.has(ALL_LESSONS[g - 1]?.id)
  const currentLesson = ALL_LESSONS.find((l) => !completedIds.has(l.id) && isUnlocked(l.globalOrder))
  const completedCount = completedIds.size
  const pct = Math.round((completedCount / TOTAL_LESSONS) * 100)

  const xp = progress?.xp ?? 0
  const lvl = levelFromXP(xp)
  const today = etDateString(0)
  const lessonsToday = (progress?.completed ?? []).filter((c) => etDateOf(c.completedAt) === today).length
  const snapshot: ProgressSnapshot = { completed: progress?.completed ?? [], xp, streak: progress?.streak ?? 0, longestStreak: progress?.longestStreak ?? 0 }
  const unlocked = unlockedAchievements(snapshot)

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <style>{`
        @keyframes lpStartBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes lpPulseRing{0%{box-shadow:0 0 0 0 var(--ring)}70%{box-shadow:0 0 0 14px transparent}100%{box-shadow:0 0 0 0 transparent}}
        .lnode{position:relative;width:74px;height:74px;border:none;background:transparent;padding:0}
        .lnode .lne{position:absolute;inset:0;border-radius:9999px;background:var(--e)}
        .lnode .lnf{position:absolute;inset:0;border-radius:9999px;background:var(--f);transform:translateY(-7px);display:flex;align-items:center;justify-content:center;transition:transform 120ms cubic-bezier(.3,.7,.4,1.5)}
        .lnode:not(:disabled){cursor:pointer}
        .lnode:not(:disabled):hover .lnf{transform:translateY(-10px)}
        .lnode:not(:disabled):active .lnf{transform:translateY(-2px)}
        .lp-float{animation:lpFloat 2.6s ease-in-out infinite}
        @keyframes lpFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
      `}</style>

      <div className="flex gap-6 justify-center">
        {/* ── Main column ── */}
        <div className="flex-1 max-w-2xl min-w-0">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl p-6 mb-6 border-2 border-blue-500/20 bg-gradient-to-br from-blue-600/20 via-gray-900 to-gray-900">
            <div className="flex items-center gap-4">
              <div className="shrink-0 bg-gray-950/40 rounded-2xl p-2 lp-float"><MrGuyHead px={5} /></div>
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-black text-white leading-tight tracking-tight">Learn to Invest</h1>
                <p className="text-blue-200/70 text-sm mt-1 font-medium">5 min a day. Zero jargon. Mr. Guy’s got you.</p>
              </div>
              <div className="shrink-0 text-center hidden sm:block">
                <lvl.Icon className="h-7 w-7 text-blue-300 mx-auto" />
                <div className="text-[10px] font-black uppercase tracking-wide text-blue-300 mt-1">Lvl {lvl.level}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5">
              <Stat icon={<Flame className="h-5 w-5 fill-orange-400" />} value={progress?.streak ?? 0} label="day streak" color="text-orange-400" />
              <Stat icon={<Star className="h-5 w-5 fill-yellow-400" />} value={xp} label="total XP" color="text-yellow-400" />
              <Stat plain={`${completedCount}/${TOTAL_LESSONS}`} label="lessons" color="text-blue-400" />
            </div>
            <div className="mt-3 h-2.5 bg-gray-950/50 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
              {progress && !progress.authed ? (
                <Link href="/register" onClick={() => sound.tick()} className="text-sm font-bold text-blue-300 hover:text-blue-200">Sign up free to save your streak →</Link>
              ) : <span />}
              <Link href="/dictionary" onClick={() => sound.tick()} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors font-medium"><BookOpen className="h-4 w-4" /> Dictionary</Link>
            </div>
          </div>

          {/* Courses + winding path */}
          {COURSES.map((course) => {
            const lessons = getLessonsForCourse(course.id)
            const hex = HEX[course.color] ?? HEX.blue
            const courseDone = lessons.every((l) => completedIds.has(l.id))
            const courseStarted = lessons.some((l) => completedIds.has(l.id)) || currentLesson?.courseId === course.id
            return (
              <div key={course.id} className="mb-2">
                <div className="rounded-3xl px-5 py-4 flex items-center gap-4 shadow-lg" style={{ background: hex.front, boxShadow: `0 5px 0 ${hex.edge}` }}>
                  <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><course.Icon className="h-6 w-6 text-white" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-[11px] font-black uppercase tracking-widest">{courseDone ? 'Completed' : courseStarted ? 'In progress' : 'Up next'}</p>
                    <h2 className="text-white font-black text-xl leading-tight flex items-center gap-2">{course.title} {courseDone && <Check className="h-5 w-5" strokeWidth={3} />}</h2>
                    <p className="text-white/80 text-sm font-medium">{course.tagline}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 py-5">
                  {lessons.map((lesson, i) => {
                    const done = completedIds.has(lesson.id)
                    const unlockedNode = isUnlocked(lesson.globalOrder)
                    const isCurrent = currentLesson?.id === lesson.id
                    const review = !!lesson.isReview
                    const GOLD = '#f59e0b', GOLD_EDGE = '#b45309', GOLD_GLOW = 'rgba(245,158,11,.6)'
                    const f = !unlockedNode ? LOCKED.front : review ? GOLD : hex.front
                    const e = !unlockedNode ? LOCKED.edge : review ? GOLD_EDGE : hex.edge
                    const ring = review ? GOLD_GLOW : hex.glow
                    const offset = OFFSETS[i % OFFSETS.length]
                    const size = review ? 88 : 74
                    return (
                      <div key={lesson.id} className="relative flex flex-col items-center" style={{ transform: `translateX(${offset}px)` }}>
                        {/* Mr. Guy stands beside the current node */}
                        {isCurrent && (
                          <div className="absolute top-1 z-0" style={{ [offset > 0 ? 'right' : 'left']: `${size + 4}px` }}>
                            <MrGuyMascot px={2} mood="idle" flip={offset > 0} />
                          </div>
                        )}
                        {isCurrent && (
                          <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-10" style={{ animation: 'lpStartBob 1.6s ease-in-out infinite' }}>
                            <div className="relative bg-white px-3 py-1 rounded-xl shadow-lg">
                              <span className="text-[12px] font-black uppercase tracking-wide" style={{ color: review ? GOLD : hex.front }}>{review ? 'Boss' : 'Start'}</span>
                              <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-white rotate-45" />
                            </div>
                          </div>
                        )}
                        <button disabled={!unlockedNode} onClick={() => go(`/learn/${lesson.id}`)} className="lnode relative z-[1]"
                          style={{ width: size, height: size, ['--f' as any]: f, ['--e' as any]: e, ['--ring' as any]: ring, ...(isCurrent ? { animation: 'lpPulseRing 1.8s infinite', borderRadius: '9999px' } : {}) }}
                          aria-label={`${course.title} ${review ? 'review boss' : `lesson ${lesson.index}`}${done ? ' (completed)' : unlockedNode ? '' : ' (locked)'}`}>
                          <span className="lne" />
                          <span className="lnf" style={done || review ? { boxShadow: `0 0 18px ${review ? GOLD_GLOW : hex.glow}` } : undefined}>
                            {!unlockedNode ? <Lock className="h-6 w-6 text-gray-500" />
                              : review ? <Crown className="h-9 w-9 text-white" strokeWidth={2.5} fill={done ? 'currentColor' : 'none'} />
                              : done ? <Check className="h-8 w-8 text-white" strokeWidth={3.5} />
                              : <span className="text-white font-black text-2xl drop-shadow">{lesson.index}</span>}
                          </span>
                        </button>
                        {review && <span className="text-[10px] font-black mt-1.5 uppercase tracking-widest" style={{ color: unlockedNode ? GOLD : '#6b7280' }}>Review</span>}
                      </div>
                    )
                  })}

                  {/* Chest milestone at the end of each course */}
                  <div className="relative flex flex-col items-center pt-1">
                    <div className="h-16 w-16 rounded-2xl flex items-center justify-center" style={courseDone ? { background: 'linear-gradient(#fbbf24,#d97706)', boxShadow: '0 4px 0 #b45309' } : { background: '#1f2937', boxShadow: '0 4px 0 #111827' }}>
                      <Gift className={`h-7 w-7 ${courseDone ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 mt-1.5 uppercase tracking-wide">{courseDone ? 'Claimed' : 'Reward'}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Desktop right rail ── */}
        <aside className="hidden lg:block w-80 shrink-0 space-y-4 self-start sticky top-4">
          <LevelCard xp={xp} lvl={lvl} />
          <RailCard title="Daily goal"><DailyGoal done={lessonsToday} /></RailCard>
          <RailCard title="Achievements"><Achievements unlocked={unlocked} onOpen={() => { sound.tick(); setShowAch(true) }} /></RailCard>
          <RailCard title="Top learners"><Leaderboard rows={board} /></RailCard>
        </aside>
      </div>

      {/* ── Mobile: achievements + leaderboard below the path ── */}
      <div className="lg:hidden mt-6 space-y-4 max-w-2xl mx-auto">
        <RailCard title="Daily goal"><DailyGoal done={lessonsToday} /></RailCard>
        <RailCard title="Achievements"><Achievements unlocked={unlocked} onOpen={() => { sound.tick(); setShowAch(true) }} /></RailCard>
        <RailCard title="Top learners"><Leaderboard rows={board} /></RailCard>
      </div>

      {showAch && <AchievementsModal unlocked={unlocked} onClose={() => setShowAch(false)} />}

      {loading && <p className="text-center text-gray-600 text-sm mt-4">Loading…</p>}
    </div>
  )
}

function Stat({ icon, value, plain, label, color }: { icon?: React.ReactNode; value?: number; plain?: string; label: string; color: string }) {
  return (
    <div className="bg-gray-950/40 rounded-2xl px-2 py-3 text-center">
      <div className={`flex items-center justify-center gap-1 font-black text-2xl ${color}`}>{icon} {plain ?? value}</div>
      <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-wide">{label}</p>
    </div>
  )
}

function RailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5">
      <h3 className="text-sm font-black text-white uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  )
}

function LevelCard({ xp, lvl }: { xp: number; lvl: ReturnType<typeof levelFromXP> }) {
  return (
    <div className="bg-gradient-to-br from-purple-600/25 to-blue-600/15 border-2 border-purple-400/25 rounded-3xl p-5">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-purple-500/20 flex items-center justify-center shrink-0"><lvl.Icon className="h-6 w-6 text-purple-300" /></div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black uppercase tracking-widest text-purple-300">Level {lvl.level}</p>
          <p className="text-lg font-black text-white leading-tight">{lvl.title}</p>
        </div>
      </div>
      <div className="mt-3 h-2.5 bg-gray-950/50 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-purple-400 to-blue-500 rounded-full transition-all duration-700" style={{ width: `${lvl.pct}%` }} />
      </div>
      <p className="text-[11px] text-gray-400 mt-1.5 font-semibold">{lvl.nextXP !== null ? `${lvl.nextXP - xp} XP to next level` : 'Max level reached'}</p>
    </div>
  )
}

function DailyGoal({ done }: { done: number }) {
  const goal = DAILY_GOAL
  const pct = Math.min(1, done / goal)
  const r = 30, c = 2 * Math.PI * r
  const met = done >= goal
  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
        <svg width="72" height="72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#1f2937" strokeWidth="8" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={met ? '#22c55e' : '#f59e0b'} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 36 36)" style={{ transition: 'stroke-dashoffset .6s' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">{met ? <Check className="h-6 w-6 text-green-400" strokeWidth={3} /> : <Target className="h-6 w-6 text-amber-400" />}</div>
      </div>
      <div>
        <p className="text-white font-black text-lg">{Math.min(done, goal)}/{goal} lessons</p>
        <p className="text-gray-500 text-sm">{met ? 'Goal smashed today!' : 'Keep your streak alive'}</p>
      </div>
    </div>
  )
}

function Achievements({ unlocked, onOpen }: { unlocked: Set<string>; onOpen: () => void }) {
  return (
    <>
      <button onClick={onOpen} className="grid grid-cols-4 gap-2 w-full">
        {ACHIEVEMENTS.map((a) => {
          const got = unlocked.has(a.id)
          return (
            <div key={a.id} className={`aspect-square rounded-2xl flex items-center justify-center border transition-transform hover:scale-105 ${got ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-gray-800/50 border-gray-700/40'}`}>
              <a.Icon className={`h-6 w-6 ${got ? 'text-yellow-400' : 'text-gray-600'}`} />
            </div>
          )
        })}
      </button>
      <button onClick={onOpen} className="mt-3 w-full text-xs font-bold text-blue-400 hover:text-blue-300">
        {unlocked.size}/{ACHIEVEMENTS.length} unlocked · see all →
      </button>
    </>
  )
}

function AchievementsModal({ unlocked, onClose }: { unlocked: Set<string>; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-gray-950 border border-gray-800 rounded-3xl p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-black text-white">Achievements</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-white"><X className="h-6 w-6" /></button>
        </div>
        <p className="text-sm text-gray-500 mb-5">Earn these as you learn — each one drops bonus XP.</p>
        <div className="space-y-2.5">
          {ACHIEVEMENTS.map((a) => {
            const got = unlocked.has(a.id)
            return (
              <div key={a.id} className={`flex items-center gap-3 rounded-2xl px-4 py-3 border ${got ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-gray-900 border-gray-800'}`}>
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${got ? 'bg-yellow-500/15' : 'bg-gray-800'}`}><a.Icon className={`h-6 w-6 ${got ? 'text-yellow-400' : 'text-gray-600'}`} /></div>
                <div className="flex-1 min-w-0">
                  <p className={`font-black ${got ? 'text-white' : 'text-gray-400'}`}>{a.title}</p>
                  <p className="text-sm text-gray-500">{a.desc}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`font-black ${got ? 'text-yellow-400' : 'text-gray-600'}`}>+{a.xp}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-600">{got ? '✓ earned' : 'locked'}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Leaderboard({ rows }: { rows: LbRow[] }) {
  if (!rows.length) return <p className="text-sm text-gray-500">Be the first to earn XP!</p>
  const medalColor = ['text-yellow-400', 'text-gray-300', 'text-amber-600']
  return (
    <div className="space-y-1.5">
      {rows.slice(0, 6).map((r) => {
        const RankIcon = levelIcon(r.level)
        return (
          <div key={r.rank} className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl ${r.isMe ? 'bg-blue-500/15 border border-blue-500/30' : ''}`}>
            <span className={`w-5 text-center text-sm font-black ${medalColor[r.rank - 1] ?? 'text-gray-500'}`}>{r.rank}</span>
            <RankIcon className="h-4 w-4 text-gray-400 shrink-0" />
            <span className={`flex-1 truncate text-sm font-semibold ${r.isMe ? 'text-blue-300' : 'text-gray-200'}`}>{r.name}{r.isMe && ' (you)'}</span>
            <span className="text-sm font-black text-yellow-400">{r.xp}</span>
          </div>
        )
      })}
    </div>
  )
}
