import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const record = await prisma.emailVerificationToken.findUnique({ where: { token } })

  if (!record) return NextResponse.json({ error: 'Invalid or already used token' }, { status: 400 })
  if (new Date() > record.expiresAt) {
    await prisma.emailVerificationToken.delete({ where: { token } }).catch(() => {})
    return NextResponse.json({ error: 'Token expired' }, { status: 400 })
  }

  // Mark user as verified
  await prisma.user.update({
    where: { email: record.email },
    data: { emailVerified: true },
  })

  // Delete the used token
  await prisma.emailVerificationToken.delete({ where: { token } }).catch(() => {})

  // Redirect to dashboard with success flag
  return NextResponse.redirect(new URL('/dashboard?verified=1', req.url))
}
