import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ticker, shares, type, portfolioId } = await req.json()
  if (!ticker || !shares || !type) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (shares <= 0) return NextResponse.json({ error: 'Shares must be positive' }, { status: 400 })

  // Get live price
  const priceRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/stock/${ticker.toUpperCase()}`, { cache: 'no-store' })
  const priceData = await priceRes.json()
  const price = priceData?.quote?.price
  const companyName = priceData?.quote?.companyName || ticker
  if (!price) return NextResponse.json({ error: 'Could not fetch price for ' + ticker }, { status: 400 })

  const portfolio = portfolioId
    ? await prisma.virtualPortfolio.findFirst({ where: { id: portfolioId, userId: session.user.id }, include: { holdings: true } })
    : await prisma.virtualPortfolio.findFirst({ where: { userId: session.user.id }, orderBy: { createdAt: 'asc' }, include: { holdings: true } })
  if (!portfolio) return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })

  const cost = price * shares

  if (type === 'BUY') {
    if (portfolio.cash < cost) return NextResponse.json({ error: `Insufficient cash. You have $${portfolio.cash.toFixed(2)} but need $${cost.toFixed(2)}` }, { status: 400 })

    const existing = portfolio.holdings.find(h => h.ticker === ticker.toUpperCase())
    if (existing) {
      const newShares = existing.shares + shares
      const newAvgCost = ((existing.avgCost * existing.shares) + cost) / newShares
      await prisma.virtualHolding.update({
        where: { id: existing.id },
        data: { shares: newShares, avgCost: newAvgCost },
      })
    } else {
      await prisma.virtualHolding.create({
        data: { portfolioId: portfolio.id, ticker: ticker.toUpperCase(), companyName, shares, avgCost: price },
      })
    }
    await prisma.virtualPortfolio.update({ where: { id: portfolio.id }, data: { cash: portfolio.cash - cost } })
  }

  if (type === 'SELL') {
    const existing = portfolio.holdings.find(h => h.ticker === ticker.toUpperCase())
    if (!existing) return NextResponse.json({ error: 'You don\'t own ' + ticker }, { status: 400 })
    if (existing.shares < shares) return NextResponse.json({ error: `You only own ${existing.shares} shares` }, { status: 400 })

    const newShares = existing.shares - shares
    if (newShares < 0.0001) {
      await prisma.virtualHolding.delete({ where: { id: existing.id } })
    } else {
      await prisma.virtualHolding.update({ where: { id: existing.id }, data: { shares: newShares } })
    }
    await prisma.virtualPortfolio.update({ where: { id: portfolio.id }, data: { cash: portfolio.cash + cost } })
  }

  // Log trade
  await prisma.virtualTrade.create({
    data: { portfolioId: portfolio.id, ticker: ticker.toUpperCase(), shares, price, type },
  })

  return NextResponse.json({ success: true, ticker: ticker.toUpperCase(), shares, price, type, total: cost })
}
