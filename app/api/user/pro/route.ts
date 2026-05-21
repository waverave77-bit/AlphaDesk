import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ isPro: false })

  // Admin is always pro
  if (session.user.email === process.env.ADMIN_EMAIL) return NextResponse.json({ isPro: true })

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isPro: true },
  })
  return NextResponse.json({ isPro: user?.isPro ?? false })
}
