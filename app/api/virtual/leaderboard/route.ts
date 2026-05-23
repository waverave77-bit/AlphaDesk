import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const portfolios = await prisma.virtualPortfolio.findMany({
    include: {
      user: { select: { name: true, email: true } },
      holdings: { select: { ticker: true, companyName: true, shares: true, avgCost: true } },
    },
    orderBy: { totalValue: 'desc' },
    take: 50,
  })

  const STARTING_CASH = 100_000
  const board = portfolios.map((p, i) => ({
    rank: i + 1,
    name: p.user.name || p.user.email.split('@')[0],
    totalValue: p.totalValue,
    gainLoss: p.totalValue - STARTING_CASH,
    gainLossPct: ((p.totalValue - STARTING_CASH) / STARTING_CASH) * 100,
    isMe: p.userId === session!.user!.id,
    holdings: p.holdings.map(h => ({
      ticker: h.ticker,
      companyName: h.companyName,
      shares: h.shares,
      avgCost: h.avgCost,
    })),
  }))

  return NextResponse.json({ board })
}
