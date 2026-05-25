import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(email?: string | null) {
  return !!(email && process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL)
}

// GET — return all feature flags (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!isAdmin(session?.user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const flags = await prisma.featureFlag.findMany()
    const map: Record<string, boolean> = {}
    for (const f of flags) map[f.key] = f.enabled
    return NextResponse.json(map)
  } catch {
    return NextResponse.json({})
  }
}

// POST — toggle a flag (admin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const { key, enabled } = await req.json()
  await prisma.featureFlag.upsert({
    where: { key },
    update: { enabled },
    create: { key, enabled },
  })
  return NextResponse.json({ ok: true })
}
