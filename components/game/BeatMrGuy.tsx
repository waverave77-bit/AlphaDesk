'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatCurrency } from '@/lib/utils'
import { Bot } from 'lucide-react'
import type { MrGuyPortfolioResult } from '@/app/api/mr-guy/portfolio/route'

interface Props {
  userGainLossPct: number | null
}

function gainColor(n: number) { return n >= 0 ? 'text-green-500' : 'text-red-500' }

export default function BeatMrGuy({ userGainLossPct }: Props) {
  const [data, setData] = useState<MrGuyPortfolioResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/mr-guy/portfolio')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const mrGuyPct = data?.gainLossPct ?? null
  const userWinning = userGainLossPct !== null && mrGuyPct !== null && userGainLossPct > mrGuyPct
  const userLosing = userGainLossPct !== null && mrGuyPct !== null && userGainLossPct < mrGuyPct

  const taunt = userLosing
    ? "Mr. Guy says: \"You call that a portfolio? My circuits predicted this.\""
    : userWinning
    ? "You're beating Mr. Guy! The robot is shaking."
    : "You're neck-and-neck with Mr. Guy. Make your move!"

  return (
    <Card className="border-purple-500/20 bg-purple-950/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
          <Bot className="h-4 w-4 text-purple-400" />
          Beat Mr. Guy
          {data?.source === 'hot-takes' && (
            <span className="text-xs text-purple-400 font-normal ml-auto">
              {data.pickCount} AI picks
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <>
            {/* Comparison bar */}
            <div className="grid grid-cols-2 gap-3">
              <div className={cn('rounded-lg p-3 border text-center', userWinning ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-800 border-gray-700')}>
                <p className="text-xs text-gray-400 mb-1">You</p>
                <p className={cn('text-xl font-bold', userGainLossPct !== null ? gainColor(userGainLossPct) : 'text-gray-500')}>
                  {userGainLossPct !== null ? `${userGainLossPct >= 0 ? '+' : ''}${userGainLossPct.toFixed(2)}%` : '—'}
                </p>
              </div>
              <div className={cn('rounded-lg p-3 border text-center', userLosing ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-800 border-gray-700')}>
                <p className="text-xs text-gray-400 mb-1">Mr. Guy</p>
                <p className={cn('text-xl font-bold', mrGuyPct !== null ? gainColor(mrGuyPct) : 'text-gray-500')}>
                  {mrGuyPct !== null ? `${mrGuyPct >= 0 ? '+' : ''}${mrGuyPct.toFixed(2)}%` : '—'}
                </p>
              </div>
            </div>

            {/* Taunt */}
            <p className={cn('text-xs text-center px-2 py-1.5 rounded-lg',
              userWinning ? 'text-green-400 bg-green-500/10' : userLosing ? 'text-purple-300 bg-purple-500/10' : 'text-gray-400 bg-gray-800')}>
              {taunt}
            </p>

            {/* Mr. Guy's holdings */}
            {data?.holdings && data.holdings.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Mr. Guy&apos;s {data.source === 'hot-takes' ? 'AI-Picked' : 'Season'} Portfolio
                </p>
                {data.holdings.map(h => (
                  <div key={h.ticker} className="flex items-center justify-between text-xs py-1 border-b border-gray-800/60 last:border-0">
                    <span className="font-bold text-white w-16">{h.ticker}</span>
                    <span className="text-gray-400">{formatCurrency(h.currentPrice)}</span>
                    <span className={gainColor(h.gainLoss)}>
                      {h.gainLoss >= 0 ? '+' : ''}{formatCurrency(h.gainLoss)}
                    </span>
                    {data.source === 'hot-takes' && h.timesPickedByMrGuy > 1 && (
                      <span className="text-purple-400">×{h.timesPickedByMrGuy}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
