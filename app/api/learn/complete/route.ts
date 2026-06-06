import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getLesson, XP_PER_CORRECT, XP_LESSON_BONUS } from '@/lib/curriculum'
import { etDateString, nextStreak } from '@/lib/learn-streak'
import { levelFromXP, PERFECT_BONUS, ACHIEVEMENTS, unlockedAchievements } from '@/lib/progression'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign up to save your progress', authed: false }, { status: 401 })
  }
  const userId = session.user.id

  const body = await req.json().catch(() => null)
  const lessonId: string | undefined = body?.lessonId
  const score = Math.max(0, Math.floor(Number(body?.score) || 0))

  // Validate the lesson exists and clamp the score to its real term count.
  const lesson = lessonId ? getLesson(lessonId) : undefined
  if (!lesson) {
    return NextResponse.json({ error: 'Unknown lesson' }, { status: 400 })
  }
  const total = lesson.terms.length
  const clampedScore = Math.min(score, total)

  // First completion earns XP; replays update the best score but don't re-farm XP.
  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
  })
  const isFirst = !existing

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
    create: { userId, lessonId: lesson.id, score: clampedScore, total },
    update: { score: Math.max(existing?.score ?? 0, clampedScore), total, completedAt: new Date() },
  })

  const [user, allProgress] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { learnXP: true, learnStreak: true, learnLongestStreak: true, lastLearnDate: true, claimedAchievements: true },
    }),
    prisma.lessonProgress.findMany({ where: { userId }, select: { lessonId: true, score: true, total: true } }),
  ])

  const today = etDateString(0)
  const streak = nextStreak(user?.learnStreak ?? 0, user?.lastLearnDate ?? null)
  const longestStreak = Math.max(user?.learnLongestStreak ?? 0, streak)
  const perfect = total > 0 && clampedScore === total
  const baseXP = clampedScore * XP_PER_CORRECT + XP_LESSON_BONUS
  const lessonXP = isFirst ? baseXP + (perfect ? PERFECT_BONUS : 0) : 0

  const beforeXP = user?.learnXP ?? 0

  // Newly-unlocked achievements award bonus XP (once each).
  const claimed = new Set(user?.claimedAchievements ?? [])
  const unlocked = unlockedAchievements({ completed: allProgress, xp: beforeXP + lessonXP, streak, longestStreak })
  const newAchievements = ACHIEVEMENTS.filter((a) => unlocked.has(a.id) && !claimed.has(a.id))
  const achievementXP = newAchievements.reduce((s, a) => s + a.xp, 0)

  const totalGain = lessonXP + achievementXP
  const afterXP = beforeXP + totalGain

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      learnXP: { increment: totalGain },
      learnStreak: streak,
      learnLongestStreak: longestStreak,
      lastLearnDate: today,
      ...(newAchievements.length ? { claimedAchievements: [...claimed, ...newAchievements.map((a) => a.id)] } : {}),
    },
    select: { learnXP: true, learnStreak: true, learnLongestStreak: true },
  })

  // Detect a level-up so the UI can celebrate.
  const before = levelFromXP(beforeXP)
  const after = levelFromXP(afterXP)
  const leveledUp = after.level > before.level

  return NextResponse.json({
    ok: true,
    xpGain: lessonXP,
    achievementXP,
    newAchievements: newAchievements.map((a) => ({ id: a.id, title: a.title, emoji: a.emoji, xp: a.xp })),
    perfect: perfect && isFirst,
    perfectBonus: perfect && isFirst ? PERFECT_BONUS : 0,
    xp: updated.learnXP,
    streak: updated.learnStreak,
    longestStreak: updated.learnLongestStreak,
    score: clampedScore,
    total,
    leveledUp,
    level: after.level,
    levelTitle: after.title,
    levelEmoji: after.emoji,
  })
}
