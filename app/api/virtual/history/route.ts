import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Try to get portfolio snapshots if the model exists
    const portfolio = await prisma.virtualPortfolio.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    })

    if (!portfolio) return NextResponse.json({ points: [] })

    // Check if portfolioSnapshot table exists via Prisma
    // If it doesn't exist in the schema, we fall back gracefully
    let snapshots: { date: string; value: number }[] = []
    try {
      const raw = await (prisma as any).portfolioSnapshot?.findMany?.({
        where: { userId: session.user.id },
        orderBy: { date: 'asc' },
        select: { date: true, value: true },
      })
      if (raw && Array.isArray(raw)) {
        snapshots = raw.map((s: { date: Date | string; value: number }) => ({
          date: new Date(s.date).toLocaleDateString(),
          value: s.value,
        }))
      }
    } catch {
      // portfolioSnapshot table doesn't exist — that's fine
    }

    if (snapshots.length === 0) {
      snapshots = [{ date: 'Today', value: portfolio.totalValue }]
    }

    return NextResponse.json({ points: snapshots })
  } catch {
    return NextResponse.json({ points: [] })
  }
}
