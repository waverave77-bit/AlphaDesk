import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const holding = await prisma.holding.findUnique({ where: { id: params.id } })
    if (!holding || holding.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.holding.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const holding = await prisma.holding.findUnique({ where: { id: params.id } })
    if (!holding || holding.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await req.json()

    let sharesVal: number | undefined
    let purchasePriceVal: number | undefined

    if (body.shares !== undefined) {
      sharesVal = parseFloat(body.shares)
      if (isNaN(sharesVal) || sharesVal <= 0) {
        return NextResponse.json({ error: 'Invalid shares' }, { status: 400 })
      }
    }

    if (body.purchasePrice !== undefined) {
      purchasePriceVal = parseFloat(body.purchasePrice)
      if (isNaN(purchasePriceVal) || purchasePriceVal <= 0) {
        return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
      }
    }

    const updated = await prisma.holding.update({
      where: { id: params.id },
      data: {
        shares: sharesVal,
        purchasePrice: purchasePriceVal,
      },
    })
    return NextResponse.json({ holding: updated })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
