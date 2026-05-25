import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST — save a new onboarding response
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { experience, goals } = await req.json()
    if (!experience) return NextResponse.json({ error: 'Missing experience' }, { status: 400 })

    // Mark user as onboarded in DB so it persists across all devices
    await prisma.user.update({
      where: { email: session.user.email },
      data: { hasOnboarded: true },
    })

    await prisma.onboardingResponse.create({
      data: { experience, goals: JSON.stringify(goals ?? []) },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Onboarding save error:', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

// GET — return aggregate stats (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.email !== process.env.ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const all = await prisma.onboardingResponse.findMany()
    const total = all.length

    // Experience breakdown
    const experienceCounts: Record<string, number> = {}
    // Goals breakdown
    const goalCounts: Record<string, number> = {}

    for (const r of all) {
      experienceCounts[r.experience] = (experienceCounts[r.experience] ?? 0) + 1
      try {
        const goals: string[] = JSON.parse(r.goals)
        for (const g of goals) {
          goalCounts[g] = (goalCounts[g] ?? 0) + 1
        }
      } catch {}
    }

    return NextResponse.json({ total, experienceCounts, goalCounts })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
