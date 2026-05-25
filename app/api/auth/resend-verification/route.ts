import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { emailVerified: true },
  })

  if (user?.emailVerified) return NextResponse.json({ error: 'Already verified' }, { status: 400 })

  // Delete any existing tokens for this email
  await prisma.emailVerificationToken.deleteMany({ where: { email: session.user.email } })

  // Create new token
  const token = crypto.randomBytes(32).toString('hex')
  await prisma.emailVerificationToken.create({
    data: {
      email: session.user.email,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })

  const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`
  await sendVerificationEmail(session.user.email, verifyUrl).catch(() => {})

  return NextResponse.json({ ok: true })
}
