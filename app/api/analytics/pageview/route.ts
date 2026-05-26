import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Pages to ignore (admin/settings/auth pages not useful for analytics)
const IGNORED = ['/admin', '/analytics', '/settings', '/login', '/register', '/forgot-password', '/reset-password', '/insights']

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  try {
    const { page } = await req.json()
    if (!page || typeof page !== 'string') return NextResponse.json({ ok: false })

    // Normalize — strip query strings, collapse dynamic segments
    const clean = page.split('?')[0].replace(/\/research\/[^/]+/, '/research/[ticker]')
    if (IGNORED.some(p => clean.startsWith(p))) return NextResponse.json({ ok: false })

    const date = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

    if (session?.user?.email) {
      // Logged-in user: increment aggregate PageView + log individual UserActivity
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      })

      await Promise.all([
        prisma.pageView.upsert({
          where: { page_date: { page: clean, date } },
          create: { page: clean, date, count: 1 },
          update: { count: { increment: 1 } },
        }),
        user
          ? prisma.userActivity.create({ data: { userId: user.id, page: clean } })
          : Promise.resolve(),
      ])
    } else {
      // Guest: just tally the daily guest visit count
      await prisma.guestVisit.upsert({
        where: { date },
        create: { date, count: 1 },
        update: { count: { increment: 1 } },
      })
    }
  } catch {}

  return NextResponse.json({ ok: true })
}
