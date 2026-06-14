import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/user/preferences — returns theme + streak for the logged-in user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { themeDark: true, themeAccent: true, themeSkin: true, themeOutfit: true, loginStreak: true, lastStreakDate: true, experienceLevel: true },
    })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(user)
  } catch (err) {
    console.error('[preferences GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/user/preferences — update theme and/or streak fields
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only allow whitelisted fields to be updated
  const allowed = ['themeDark', 'themeAccent', 'themeSkin', 'themeOutfit', 'loginStreak', 'lastStreakDate']
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  try {
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data,
      select: { themeDark: true, themeAccent: true, themeSkin: true, themeOutfit: true, loginStreak: true, lastStreakDate: true },
    })
    return NextResponse.json(user)
  } catch (err) {
    console.error('[preferences PATCH]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
