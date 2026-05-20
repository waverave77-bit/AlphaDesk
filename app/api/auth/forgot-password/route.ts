import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (process.env.NEXTAUTH_URL ?? 'http://localhost:3001')
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    await resend.emails.send({
      from: 'Zains Game <onboarding@resend.dev>',
      to: normalised,
      subject: 'Reset your password',
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #fff;">
          <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #111;">Reset your password</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">
            Someone requested a password reset for your Zains Game account. If that was you, click the button below. This link expires in 1 hour.
          </p>
          <a href="${resetUrl}" style="display:inline-block; background:#2563eb; color:#fff; font-weight:600; font-size:15px; padding:14px 28px; border-radius:10px; text-decoration:none;">
            Reset Password
          </a>
          <p style="color: #999; font-size: 13px; margin-top: 32px; line-height: 1.5;">
            If you didn't request this, you can safely ignore this email. Your password won't change.
          </p>
          <p style="color: #ccc; font-size: 12px; margin-top: 16px;">
            Or copy this link: <a href="${resetUrl}" style="color:#2563eb;">${resetUrl}</a>
          </p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('forgot-password error:', e)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
