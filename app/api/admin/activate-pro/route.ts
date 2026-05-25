import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST — manually activate or deactivate Pro for a user (admin only)
// Body: { email: string, isPro: boolean }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { email, isPro = true } = await req.json()
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (!user) return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 })

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        isPro,
        proSince: isPro ? (user.proSince ?? new Date()) : user.proSince,
        proCancelledAt: isPro ? null : new Date(),
      },
      select: { id: true, email: true, isPro: true, proSince: true, stripeSubscriptionId: true, stripeCustomerId: true },
    })

    console.log(`[Admin] Pro ${isPro ? 'activated' : 'deactivated'} for ${email} by admin`)
    return NextResponse.json({ ok: true, user: updated })
  } catch (err) {
    console.error('[Admin] activate-pro error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// GET — look up a user's Pro status by email
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email query param required' }, { status: 400 })

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, name: true, isPro: true, proSince: true, proCancelledAt: true, stripeCustomerId: true, stripeSubscriptionId: true, createdAt: true },
    })
    if (!user) return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 })
    return NextResponse.json(user)
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
