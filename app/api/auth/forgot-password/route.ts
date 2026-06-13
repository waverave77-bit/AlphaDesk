import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const normalised = email.trim().toLowerCase()

    // Always return success — never reveal whether email exists (security best practice)
    const user = await prisma.user.findUnique({ where: { email: normalised } })
    if (!user) {
      return NextResponse.json({ ok: true })
    }

    // Delete any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email: normalised } })

    // Create a secure token valid for 1 hour
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
      data: { email: normalised, token, expiresAt },
    })

    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3001'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    await sendPasswordResetEmail(normalised, resetUrl)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('forgot-password error:', e)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
