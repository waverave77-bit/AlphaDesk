import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function assertAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user?.email === process.env.ADMIN_EMAIL
}

export async function GET() {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const base = process.env.POWERSCALE_STATUS_URL
  if (!base) {
    return NextResponse.json({ error: 'POWERSCALE_STATUS_URL not configured' }, { status: 500 })
  }
  try {
    const res = await fetch(`${base}/cron`, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Droplet unreachable' }, { status: 502 })
  }
}

export async function POST(req: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const base = process.env.POWERSCALE_STATUS_URL
  const secret = process.env.POWERSCALE_STATUS_SECRET
  if (!base || !secret) {
    return NextResponse.json({ error: 'Dashboard not fully configured' }, { status: 500 })
  }
  const body = await req.json().catch(() => ({}))
  try {
    const res = await fetch(`${base}/cron`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset: body?.preset }),
      signal: AbortSignal.timeout(8000),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Droplet unreachable' }, { status: 502 })
  }
}
