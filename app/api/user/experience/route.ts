import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { experienceLevel: true },
    })
    return NextResponse.json({ experienceLevel: user?.experienceLevel ?? 'beginner' })
  } catch (err) {
    console.error('GET experience error:', err)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  try {
    const { experienceLevel } = await req.json()
    const valid = ['beginner', 'some', 'experienced']
    if (!valid.includes(experienceLevel)) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 })
    }
    await prisma.user.update({
      where: { email: session.user.email },
      data: { experienceLevel },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH experience error:', err)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
