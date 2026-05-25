import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { containsProfanity } from '@/lib/profanity'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { email, password, name, username } = await req.json()

    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Email, username, and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: 'Username must be between 3 and 20 characters' }, { status: 400 })
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: 'Username can only contain letters, numbers, and underscores' }, { status: 400 })
    }
    if (containsProfanity(username)) {
      return NextResponse.json({ error: 'That username is not allowed' }, { status: 400 })
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) {
      return NextResponse.json({ error: 'An account with that email already exists' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, password: hashed, name: name || username, username, emailVerified: false },
    })

    // Create verification token (expires in 24 hours)
    const token = crypto.randomBytes(32).toString('hex')
    await prisma.emailVerificationToken.create({
      data: {
        email,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`
    sendVerificationEmail(email, verifyUrl).catch(() => {})

    return NextResponse.json({ id: user.id, email: user.email, username: user.username }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
