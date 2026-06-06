/**
 * Progression & rewards: levels with finance titles, achievements, daily goal.
 * Everything derives from the user's own data (XP + completed lessons), so most
 * of it is computed client-side — no extra backend.
 */
import { getLessonsForCourse, TOTAL_LESSONS } from './curriculum'
import type { LucideIcon } from 'lucide-react'
import {
  Coins, ClipboardList, BarChart3, TrendingUp, Briefcase, Landmark, Gem, Crown,
  GraduationCap, BadgeCheck, Flame, Sprout, BookOpen, CalendarCheck, Flag,
} from 'lucide-react'

export type Level = { level: number; title: string; Icon: LucideIcon; minXP: number }

/** Tuned so reaching the top ≈ completing the whole path. */
export const LEVELS: Level[] = [
  { level: 1, title: 'Intern',            Icon: Coins,         minXP: 0 },
  { level: 2, title: 'Junior Analyst',    Icon: ClipboardList, minXP: 80 },
  { level: 3, title: 'Analyst',           Icon: BarChart3,     minXP: 200 },
  { level: 4, title: 'Senior Analyst',    Icon: TrendingUp,    minXP: 360 },
  { level: 5, title: 'Associate',         Icon: Briefcase,     minXP: 560 },
  { level: 6, title: 'Portfolio Manager', Icon: Landmark,      minXP: 820 },
  { level: 7, title: 'Managing Director', Icon: Gem,           minXP: 1150 },
  { level: 8, title: 'Hedge Fund Legend', Icon: Crown,         minXP: 1500 },
]

export type LevelInfo = {
  level: number; title: string; Icon: LucideIcon
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
    level: cur.level, title: cur.title, Icon: cur.Icon,
    minXP: cur.minXP, nextXP,
    intoLevel: into, levelSpan: span,
    pct: nextXP !== null ? Math.min(100, Math.round((into / span) * 100)) : 100,
  }
}

/** Icon for a given level number (for API consumers that only have the number). */
export function levelIcon(level: number): LucideIcon {
  return (LEVELS.find((l) => l.level === level) ?? LEVELS[0]).Icon
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
export type Achievement = { id: string; title: string; desc: string; Icon: LucideIcon; xp: number; check: (p: ProgressSnapshot) => boolean }

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first',     title: 'First Steps',     desc: 'Finish your first lesson',     Icon: GraduationCap, xp: 25,  check: (p) => p.completed.length >= 1 },
  { id: 'perfect',   title: 'Flawless',        desc: 'Ace a lesson with 100%',       Icon: BadgeCheck,    xp: 25,  check: (p) => p.completed.some((c) => c.total > 0 && c.score === c.total) },
  { id: 'streak3',   title: 'On a Roll',       desc: 'Reach a 3-day streak',         Icon: Flame,         xp: 30,  check: (p) => p.longestStreak >= 3 },
  { id: 'basics',    title: 'Back to Basics',  desc: 'Finish the Basics course',     Icon: Sprout,        xp: 40,  check: (p) => courseDone(p, 'basics') },
  { id: 'ten',       title: 'Bookworm',        desc: 'Finish 10 lessons total',      Icon: BookOpen,      xp: 50,  check: (p) => p.completed.length >= 10 },
  { id: 'streak7',   title: 'Committed',       desc: 'Reach a 7-day streak',         Icon: CalendarCheck, xp: 60,  check: (p) => p.longestStreak >= 7 },
  { id: 'half',      title: 'Halfway There',   desc: 'Finish half the path',         Icon: Flag,          xp: 75,  check: (p) => p.completed.length >= Math.ceil(TOTAL_LESSONS / 2) },
  { id: 'legend',    title: 'Market Master',   desc: 'Finish every single lesson',   Icon: Crown,         xp: 150, check: (p) => p.completed.length >= TOTAL_LESSONS },
]

/** Icon for an achievement id (for consumers that only have the id). */
export function achievementIcon(id: string): LucideIcon {
  return (ACHIEVEMENTS.find((a) => a.id === id) ?? ACHIEVEMENTS[0]).Icon
}

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
