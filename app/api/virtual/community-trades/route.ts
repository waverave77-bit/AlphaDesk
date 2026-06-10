import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Recent trades across all users — powers the "What others are trading" feed
 * in the $100K Challenge. Returns up to 20 trades from the last 7 days.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const trades = await prisma.virtualTrade.findMany({
    where: { executedAt: { gte: since } },
    orderBy: { executedAt: 'desc' },
    take: 20,
    select: {
      ticker: true,
      shares: true,
      price: true,
      type: true,
      executedAt: true,
      portfolio: {
        select: {
          userId: true,
          user: { select: { username: true, name: true, isPro: true } },
        },
      },
    },
  })

  const myId = session.user.id

  const feed = trades.map((t) => ({
    ticker: t.ticker,
    shares: t.shares,
    price: t.price,
    type: t.type as 'BUY' | 'SELL',
    executedAt: t.executedAt.toISOString(),
    userName: t.portfolio.user.username || t.portfolio.user.name?.split(' ')[0] || 'Someone',
    isPro: t.portfolio.user.isPro ?? false,
    isMe: t.portfolio.userId === myId,
  }))

  return NextResponse.json({ feed })
}
