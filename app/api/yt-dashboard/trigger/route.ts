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
  const characterA = typeof body?.characterA === 'string' ? body.characterA : undefined
  const characterB = typeof body?.characterB === 'string' ? body.characterB : undefined
  const model = typeof body?.model === 'string' ? body.model : undefined
  const extraInput = body?.extraInput && typeof body.extraInput === 'object' ? body.extraInput : undefined
  // "singleshot" forces the old single-shot text2video path (see the 1-Clip
  // launcher in YTDashboard.tsx) — multishot is the default on the droplet
  // now whenever a matchup is eligible, so this is the only value worth
  // forwarding explicitly.
  const renderMode = body?.renderMode === 'singleshot' ? 'singleshot' : undefined

  try {
    const res = await fetch(`${base}/trigger`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterA, characterB, model, extraInput, renderMode }),
      signal: AbortSignal.timeout(8000),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Droplet unreachable' }, { status: 502 })
  }
}
