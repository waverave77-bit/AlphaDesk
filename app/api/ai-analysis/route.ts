import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { analyzeStock, analyzePortfolio } from '@/lib/claude'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { type } = body

    if (type === 'stock') {
      const analysis = await analyzeStock(body.data)
      return NextResponse.json({ analysis })
    }

    if (type === 'portfolio') {
      const analysis = await analyzePortfolio(body.data)
      return NextResponse.json({ analysis })
    }

    return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 })
  }
}
