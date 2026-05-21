import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkAILimit } from '@/lib/pro'
import { ensembleAnalyzeStock, ensembleAnalyzePortfolio } from '@/lib/ai-ensemble'

// Vercel Pro allows up to 300s — Hobby is capped at 10s regardless
export const maxDuration = 60

export async function POST(req: Request) {
  const limited = await checkAILimit('ai-analysis')
  if (limited) return limited

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { type, data } = body

    if (type === 'stock') {
      const result = await ensembleAnalyzeStock(data)
      return NextResponse.json(result)
    }

    if (type === 'portfolio') {
      const result = await ensembleAnalyzePortfolio(data)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 })
  }
}
