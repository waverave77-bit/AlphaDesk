import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  // Guests have no saved progress — return an empty shell so the path still renders.
  if (!session?.user?.id) {
    return NextResponse.json({
      authed: false,
      completed: [],
      xp: 0,
      streak: 0,
      longestStreak: 0,
      lastLearnDate: null,
    })
  }

  const [progress, user] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId: session.user.id },
      select: { lessonId: true, score: true, total: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { learnXP: true, learnStreak: true, learnLongestStreak: true, lastLearnDate: true },
    }),
  ])

  return NextResponse.json({
    authed: true,
    completed: progress,
    xp: user?.learnXP ?? 0,
    streak: user?.learnStreak ?? 0,
    longestStreak: user?.learnLongestStreak ?? 0,
    lastLearnDate: user?.lastLearnDate ?? null,
  })
}
