import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const holdings = await prisma.holding.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ holdings })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { ticker, companyName, shares, purchasePrice, purchaseDate, sector } = await req.json()

    if (!ticker || !shares || !purchasePrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const holding = await prisma.holding.create({
      data: {
        userId: session.user.id,
        ticker: ticker.toUpperCase(),
        companyName: companyName || ticker.toUpperCase(),
        shares: parseFloat(shares),
        purchasePrice: parseFloat(purchasePrice),
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        sector: sector || 'Unknown',
      },
    })

    return NextResponse.json({ holding }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add holding' }, { status: 500 })
  }
}
