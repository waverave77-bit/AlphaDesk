/**
 * Progression & rewards: levels with finance titles, achievements, daily goal.
 * Everything derives from the user's own data (XP + completed lessons), so most
 * of it is computed client-side — no extra backend.
 */
import { COURSES, getLessonsForCourse, TOTAL_LESSONS } from './curriculum'

export type Level = { level: number; title: string; emoji: string; minXP: number }

/** Tuned so reaching the top ≈ completing the whole path. */
export const LEVELS: Level[] = [
  { level: 1, title: 'Intern',           emoji: '🪙', minXP: 0 },
  { level: 2, title: 'Junior Analyst',   emoji: '📋', minXP: 80 },
  { level: 3, title: 'Analyst',          emoji: '📊', minXP: 200 },
  { level: 4, title: 'Senior Analyst',   emoji: '📈', minXP: 360 },
  { level: 5, title: 'Associate',        emoji: '💼', minXP: 560 },
  { level: 6, title: 'Portfolio Manager',emoji: '🏦', minXP: 820 },
  { level: 7, title: 'Managing Director',emoji: '💎', minXP: 1150 },
  { level: 8, title: 'Hedge Fund Legend',emoji: '👑', minXP: 1500 },
]

export type LevelInfo = {
  level: number; title: string; emoji: string
  minXP: number; nextXP: number | null
  intoLevel: number; levelSpan: number; pct: number
}

export function levelFromXP(xp: number): LevelInfo {
  let cur = LEVELS[0]
  for (const l of LEVELS) if (xp >= l.minXP) cur = l
  const next = LEVELS.find((l) => l.level === cur.level + 1) ?? null
  const nextXP = next?.minXP ?? null
  const span = nextXP !== null ? nextXP - cur.minXP : 1
  const into = xp - cur.minXP
  return {
    level: cur.level, title: cur.title, emoji: cur.emoji,
    minXP: cur.minXP, nextXP,
    intoLevel: into, levelSpan: span,
    pct: nextXP !== null ? Math.min(100, Math.round((into / span) * 100)) : 100,
  }
}

/* ── Daily goal ── */
export const DAILY_GOAL = 3 // lessons per day

/* ── Achievements (computed from progress) ── */
export type ProgressSnapshot = {
  completed: { lessonId: string; score: number; total: number }[]
  xp: number
  streak: number
  longestStreak: number
}
export type Achievement = { id: string; title: string; desc: string; emoji: string; xp: number; check: (p: ProgressSnapshot) => boolean }

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first',     title: 'First Steps',     desc: 'Finish your first lesson',     emoji: '🎓', xp: 25,  check: (p) => p.completed.length >= 1 },
  { id: 'perfect',   title: 'Flawless',        desc: 'Ace a lesson with 100%',       emoji: '💯', xp: 25,  check: (p) => p.completed.some((c) => c.total > 0 && c.score === c.total) },
  { id: 'streak3',   title: 'On a Roll',       desc: 'Reach a 3-day streak',         emoji: '🔥', xp: 30,  check: (p) => p.longestStreak >= 3 },
  { id: 'basics',    title: 'Back to Basics',  desc: 'Finish the Basics course',     emoji: '🌱', xp: 40,  check: (p) => courseDone(p, 'basics') },
  { id: 'ten',       title: 'Bookworm',        desc: 'Finish 10 lessons total',      emoji: '📚', xp: 50,  check: (p) => p.completed.length >= 10 },
  { id: 'streak7',   title: 'Committed',       desc: 'Reach a 7-day streak',         emoji: '📅', xp: 60,  check: (p) => p.longestStreak >= 7 },
  { id: 'half',      title: 'Halfway There',   desc: 'Finish half the path',         emoji: '⛳', xp: 75,  check: (p) => p.completed.length >= Math.ceil(TOTAL_LESSONS / 2) },
  { id: 'legend',    title: 'Market Master',   desc: 'Finish every single lesson',   emoji: '👑', xp: 150, check: (p) => p.completed.length >= TOTAL_LESSONS },
]

function courseDone(p: ProgressSnapshot, courseId: string): boolean {
  const ids = new Set(p.completed.map((c) => c.lessonId))
  const lessons = getLessonsForCourse(courseId)
  return lessons.length > 0 && lessons.every((l) => ids.has(l.id))
}

export function unlockedAchievements(p: ProgressSnapshot): Set<string> {
  return new Set(ACHIEVEMENTS.filter((a) => a.check(p)).map((a) => a.id))
}

/* ── XP rewards (server uses these too) ── */
export const PERFECT_BONUS = 15
