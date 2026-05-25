import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DEMO_EMAIL = 'demo@preview.internal'

async function clearDemoData() {
  try {
    const demo = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
    if (!demo) return
    await prisma.holding.deleteMany({ where: { userId: demo.id } })
    await prisma.watchlistItem.deleteMany({ where: { userId: demo.id } })
    await prisma.priceAlert.deleteMany({ where: { userId: demo.id } })
    await prisma.virtualPortfolio.deleteMany({ where: { userId: demo.id } })
    await prisma.virtualSeasonRecord.deleteMany({ where: { userId: demo.id } })
  } catch {}
}

// POST: enter demo mode
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }
    if (session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (session.user.email === DEMO_EMAIL) {
      return NextResponse.json({ error: 'Already in demo mode' }, { status: 400 })
    }

    // Ensure demo user exists
    const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
    if (!existing) {
      await prisma.user.create({
        data: {
          email: DEMO_EMAIL,
          username: 'preview_user',
          password: '',
          name: 'Preview User',
        },
      })
    }

    // Wipe any leftover demo data
    await clearDemoData()

    const secret = process.env.DEMO_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'DEMO_SECRET env var not set on Vercel' }, { status: 500 })
    }

    return NextResponse.json({ demoToken: secret })
  } catch (err: any) {
    console.error('Demo POST error:', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

// DELETE: exit and wipe demo data
export async function DELETE() {
  try {
    await clearDemoData()
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
