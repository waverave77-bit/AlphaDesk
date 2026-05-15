import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: enter demo mode — returns the demo secret so frontend can sign in as demo user
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only non-demo users (real admin) can enter demo mode
  if ((session.user as any).isDemo) return NextResponse.json({ error: 'Already in demo mode' }, { status: 400 })

  // Clear any existing demo user data so it's a fresh experience
  const demo = await prisma.user.findFirst({ where: { isDemo: true } })
  if (demo) {
    await prisma.holding.deleteMany({ where: { userId: demo.id } })
    await prisma.watchlistItem.deleteMany({ where: { userId: demo.id } })
    await prisma.priceAlert.deleteMany({ where: { userId: demo.id } })
    await prisma.virtualPortfolio.deleteMany({ where: { userId: demo.id } })
    await prisma.virtualSeasonRecord.deleteMany({ where: { userId: demo.id } })
  }

  return NextResponse.json({ demoToken: process.env.DEMO_SECRET })
}

// DELETE: exit demo mode — wipes demo data
export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const demo = await prisma.user.findFirst({ where: { isDemo: true } })
  if (demo) {
    await prisma.holding.deleteMany({ where: { userId: demo.id } })
    await prisma.watchlistItem.deleteMany({ where: { userId: demo.id } })
    await prisma.priceAlert.deleteMany({ where: { userId: demo.id } })
    await prisma.virtualPortfolio.deleteMany({ where: { userId: demo.id } })
    await prisma.virtualSeasonRecord.deleteMany({ where: { userId: demo.id } })
  }

  return NextResponse.json({ ok: true })
}
