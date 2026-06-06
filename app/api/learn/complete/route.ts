import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getLesson, XP_PER_CORRECT, XP_LESSON_BONUS } from '@/lib/curriculum'
import { etDateString, nextStreak } from '@/lib/learn-streak'

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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { learnXP: true, learnStreak: true, learnLongestStreak: true, lastLearnDate: true },
  })

  const today = etDateString(0)
  const streak = nextStreak(user?.learnStreak ?? 0, user?.lastLearnDate ?? null)
  const longestStreak = Math.max(user?.learnLongestStreak ?? 0, streak)
  const xpGain = isFirst ? clampedScore * XP_PER_CORRECT + XP_LESSON_BONUS : 0

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      learnXP: { increment: xpGain },
      learnStreak: streak,
      learnLongestStreak: longestStreak,
      lastLearnDate: today,
    },
    select: { learnXP: true, learnStreak: true, learnLongestStreak: true },
  })

  return NextResponse.json({
    ok: true,
    xpGain,
    xp: updated.learnXP,
    streak: updated.learnStreak,
    longestStreak: updated.learnLongestStreak,
    score: clampedScore,
    total,
  })
}
