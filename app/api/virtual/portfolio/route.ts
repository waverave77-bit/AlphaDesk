import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const STARTING_CASH = 100_000
const MAX_PORTFOLIOS = 2
function startOfNextMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 1)
}

/**
 * Manage virtual portfolios. A 2nd portfolio is a Pro perk (capped at 2).
 * Body: { action: 'create' | 'rename' | 'reset' | 'delete', portfolioId?, name? }
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const { action, portfolioId, name } = await req.json().catch(() => ({}))

  if (action === 'create') {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { isPro: true } })
    if (!user?.isPro) {
      return NextResponse.json({ error: 'A 2nd portfolio is a Pro feature', upgrade: true }, { status: 403 })
    }
    const count = await prisma.virtualPortfolio.count({ where: { userId } })
    if (count >= MAX_PORTFOLIOS) {
      return NextResponse.json({ error: `You can have up to ${MAX_PORTFOLIOS} portfolios` }, { status: 400 })
    }
    const created = await prisma.virtualPortfolio.create({
      data: {
        userId,
        name: (typeof name === 'string' && name.trim() ? name.trim() : 'Portfolio 2').slice(0, 30),
        cash: STARTING_CASH,
        totalValue: STARTING_CASH,
        season: 1,
        resetAt: startOfNextMonth(),
        monthlyBaseline: STARTING_CASH,
        monthlyResetAt: new Date(),
      },
    })
    return NextResponse.json({ id: created.id })
  }

  // rename / reset / delete all require an owned portfolioId
  const portfolio = await prisma.virtualPortfolio.findFirst({ where: { id: portfolioId, userId } })
  if (!portfolio) return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })

  if (action === 'rename') {
    const clean = (typeof name === 'string' ? name.trim() : '').slice(0, 30)
    if (!clean) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    await prisma.virtualPortfolio.update({ where: { id: portfolio.id }, data: { name: clean } })
    return NextResponse.json({ ok: true })
  }

  if (action === 'reset') {
    await prisma.virtualHolding.deleteMany({ where: { portfolioId: portfolio.id } })
    await prisma.virtualTrade.deleteMany({ where: { portfolioId: portfolio.id } })
    await prisma.virtualPortfolio.update({
      where: { id: portfolio.id },
      data: { cash: STARTING_CASH, totalValue: STARTING_CASH, monthlyBaseline: STARTING_CASH, monthlyResetAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete') {
    const count = await prisma.virtualPortfolio.count({ where: { userId } })
    if (count <= 1) return NextResponse.json({ error: 'You need at least one portfolio' }, { status: 400 })
    await prisma.virtualPortfolio.delete({ where: { id: portfolio.id } })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
