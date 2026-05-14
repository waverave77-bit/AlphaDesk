import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  const adminEmail = process.env.ADMIN_EMAIL
  const isAdmin = !!(session?.user?.email && adminEmail && session.user.email === adminEmail)
  return NextResponse.json({ isAdmin })
}
