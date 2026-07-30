import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const base = process.env.POWERSCALE_STATUS_URL
  const secret = process.env.POWERSCALE_STATUS_SECRET
  if (!base || !secret) {
    return NextResponse.json({ error: 'Dashboard not fully configured' }, { status: 500 })
  }
  const body = await req.json().catch(() => ({}))
  const videoIds = Array.isArray(body?.videoIds) ? body.videoIds.filter((id: unknown) => typeof id === 'string') : undefined
  if (!videoIds || videoIds.length === 0) {
    return NextResponse.json({ error: 'videoIds (non-empty array) required' }, { status: 400 })
  }
  try {
    const res = await fetch(`${base}/drafts/reorder`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoIds }),
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Droplet unreachable' }, { status: 502 })
  }
}
