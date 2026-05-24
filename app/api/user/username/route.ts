import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { username } = body

  if (!username || typeof username !== 'string') {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  }

  const trimmed = username.trim()

  // Validate: 3-20 chars, alphanumeric + underscore only
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
    return NextResponse.json(
      { error: 'Username must be 3–20 characters and can only contain letters, numbers, and underscores.' },
      { status: 400 }
    )
  }

  // Check uniqueness (case-insensitive)
  const existing = await prisma.user.findFirst({
    where: {
      username: { equals: trimmed, mode: 'insensitive' },
      NOT: { email: session.user.email },
    },
  })

  if (existing) {
    return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 })
  }

  await prisma.user.update({
    where: { email: session.user.email },
    data: { username: trimmed },
  })

  return NextResponse.json({ username: trimmed })
}
