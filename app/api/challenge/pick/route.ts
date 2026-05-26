import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function getWeekKey(): string {
  const now = new Date()
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - now.getDay())
  const y = sunday.getFullYear()
  const m = String(sunday.getMonth() + 1).padStart(2, '0')
  const d = String(sunday.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// GET /api/challenge/pick — return this week's pick for the logged-in user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ pick: null })
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ pick: null })

    const weekKey = getWeekKey()
    const pick = await prisma.weeklyUserPick.findUnique({
      where: { userId_weekKey: { userId: user.id, weekKey } },
    })

    if (!pick) return NextResponse.json({ pick: null })

    return NextResponse.json({
      pick: {
        weekKey: pick.weekKey,
        ticker: pick.ticker,
        companyName: pick.companyName,
        entryPrice: pick.entryPrice,
        direction: pick.direction as 'up' | 'down',
        submittedAt: pick.submittedAt.toISOString(),
      },
    })
  } catch (err) {
    console.error('[challenge/pick GET]', err)
    return NextResponse.json({ pick: null })
  }
}

// POST /api/challenge/pick — save / upsert this week's pick
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { ticker: string; companyName: string; entryPrice: number; direction: 'up' | 'down' }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { ticker, companyName, entryPrice, direction } = body
  if (!ticker || !companyName || !entryPrice || !direction) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const weekKey = getWeekKey()
    const pick = await prisma.weeklyUserPick.upsert({
      where: { userId_weekKey: { userId: user.id, weekKey } },
      update: { ticker, companyName, entryPrice, direction },
      create: { userId: user.id, weekKey, ticker, companyName, entryPrice, direction },
    })

    return NextResponse.json({
      pick: {
        weekKey: pick.weekKey,
        ticker: pick.ticker,
        companyName: pick.companyName,
        entryPrice: pick.entryPrice,
        direction: pick.direction as 'up' | 'down',
        submittedAt: pick.submittedAt.toISOString(),
      },
    })
  } catch (err) {
    console.error('[challenge/pick POST]', err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
