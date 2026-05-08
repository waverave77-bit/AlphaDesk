export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const alerts = await prisma.priceAlert.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(alerts)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  let body: {
    ticker?: string
    targetPrice?: number
    condition?: string
    type?: string
    note?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { ticker, targetPrice, condition, type, note } = body

  if (!ticker || targetPrice === undefined || !condition || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!['above', 'below'].includes(condition)) {
    return NextResponse.json({ error: 'condition must be "above" or "below"' }, { status: 400 })
  }

  if (!['alert', 'stop_loss'].includes(type)) {
    return NextResponse.json({ error: 'type must be "alert" or "stop_loss"' }, { status: 400 })
  }

  const alert = await prisma.priceAlert.create({
    data: {
      userId: user.id,
      ticker: ticker.toUpperCase().trim(),
      targetPrice: Number(targetPrice),
      condition,
      type,
      note: note ?? null,
    },
  })

  return NextResponse.json(alert, { status: 201 })
}
