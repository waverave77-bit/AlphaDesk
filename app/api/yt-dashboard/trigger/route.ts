import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const base = process.env.POWERSCALE_STATUS_URL
  const secret = process.env.POWERSCALE_STATUS_SECRET
  if (!base || !secret) {
    return NextResponse.json({ error: 'Dashboard not fully configured' }, { status: 500 })
  }

  try {
    const res = await fetch(`${base}/trigger`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(8000),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Droplet unreachable' }, { status: 502 })
  }
}
