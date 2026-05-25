import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkAILimit } from '@/lib/pro'
import { ensembleAnalyzeStock, ensembleAnalyzePortfolio } from '@/lib/ai-ensemble'
import { prisma } from '@/lib/prisma'

export const maxDuration = 60

// Today's date in ET — cache key resets at midnight ET
function todayET() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) // "YYYY-MM-DD"
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { type, data } = body

    // ── Stock analysis — check cache first ──────────────────────────────────
    if (type === 'stock') {
      const ticker = (data?.ticker ?? '').toUpperCase().trim()
      const date   = todayET()
      const cacheId = `${ticker}-${date}`

      // Serve from cache — no AI tokens, no rate limit hit
      if (ticker) {
        const cached = await prisma.aIAnalysisCache.findUnique({ where: { id: cacheId } }).catch(() => null)
        if (cached) {
          return NextResponse.json({ ...JSON.parse(cached.data), fromCache: true })
        }
      }

      // Cache miss — enforce rate limit before running AI
      const limited = await checkAILimit('ai-analysis')
      if (limited) return limited

      const result = await ensembleAnalyzeStock(data)

      // Save to cache (fire and forget — don't block the response)
      if (ticker) {
        prisma.aIAnalysisCache.upsert({
          where: { id: cacheId },
          update: { data: JSON.stringify(result) },
          create: { id: cacheId, ticker, date, data: JSON.stringify(result) },
        }).catch(() => {})
      }

      return NextResponse.json(result)
    }

    // ── Portfolio analysis — always user-specific, never cache ──────────────
    if (type === 'portfolio') {
      const limited = await checkAILimit('ai-analysis')
      if (limited) return limited

      const result = await ensembleAnalyzePortfolio(data)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 })
  }
}
