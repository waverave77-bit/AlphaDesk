import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Called by ActivityTracker every 60s to mark user as "live"
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ ok: false })

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { lastActiveAt: new Date() },
    })
  } catch {}

  return NextResponse.json({ ok: true })
}
