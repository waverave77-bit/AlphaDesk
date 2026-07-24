import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const base = process.env.POWERSCALE_STATUS_URL
  if (!base) {
    return NextResponse.json({ error: 'POWERSCALE_STATUS_URL not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(`${base}/status`, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`droplet responded ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Droplet unreachable' }, { status: 502 })
  }
}
