import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { levelFromXP } from '@/lib/progression'

export const dynamic = 'force-dynamic'

/** Top learners by total learn XP — social proof for the Learn rail. */
export async function GET() {
  const session = await getServerSession(authOptions)

  const top = await prisma.user.findMany({
    where: { learnXP: { gt: 0 } },
    orderBy: { learnXP: 'desc' },
    take: 10,
    select: { id: true, username: true, name: true, learnXP: true },
  })

  const rows = top.map((u, i) => ({
    rank: i + 1,
    name: u.username || u.name?.split(' ')[0] || 'Learner',
    xp: u.learnXP,
    level: levelFromXP(u.learnXP).level,
    isMe: !!session?.user?.id && u.id === session.user.id,
  }))

  return NextResponse.json({ leaderboard: rows })
}
