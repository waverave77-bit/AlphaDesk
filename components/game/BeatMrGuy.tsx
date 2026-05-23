'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Bot } from 'lucide-react'

// Mr. Guy's hardcoded portfolio — 5 equal-weight positions, $20k each
const MR_GUY_PICKS = [
  { ticker: 'NVDA', shares: 22.86, costBasis: 875 },  // $20k @ $875
  { ticker: 'AAPL', shares: 105.82, costBasis: 189 },  // $20k @ $189
  { ticker: 'META', shares: 37.95, costBasis: 527 },   // $20k @ $527
  { ticker: 'BRK-B', shares: 54.05, costBasis: 370 },  // $20k @ $370
  { ticker: 'SPY', shares: 36.56, costBasis: 547 },    // $20k @ $547
]
const MR_GUY_START = 100_000

interface Props {
  userGainLossPct: number | null
}

interface PickResult {
  ticker: string
  currentPrice: number | null
  currentValue: number
  gainLoss: number
}

function gainColor(n: number) { return n >= 0 ? 'text-green-500' : 'text-red-500' }

export default function BeatMrGuy({ userGainLossPct }: Props) {
  const [picks, setPicks] = useState<PickResult[]>([])
  const [loading, setLoading] = useState(true)
  const [mrGuyPct, setMrGuyPct] = useState<number | null>(null)

  useEffect(() => {
    const fetchPicks = async () => {
      setLoading(true)
      const results = await Promise.allSettled(
        MR_GUY_PICKS.map(p => fetch(`/api/stock/${p.ticker}`).then(r => r.json()))
      )

      const enriched: PickResult[] = MR_GUY_PICKS.map((p, i) => {
        const res = results[i]
        const price = res.status === 'fulfilled' && res.value?.quote?.price
          ? res.value.quote.price
          : p.costBasis // fallback to cost basis so P&L = 0
        const currentValue = price * p.shares
        const costValue = p.costBasis * p.shares
        return {
          ticker: p.ticker,
          currentPrice: price,
          currentValue,
          gainLoss: currentValue - costValue,
        }
      })

      const totalValue = enriched.reduce((s, p) => s + p.currentValue, 0)
      const pct = ((totalValue - MR_GUY_START) / MR_GUY_START) * 100
      setPicks(enriched)
      setMrGuyPct(pct)
      setLoading(false)
    }
    fetchPicks()
  }, [])

  const userWinning = userGainLossPct !== null && mrGuyPct !== null && userGainLossPct > mrGuyPct
  const userLosing = userGainLossPct !== null && mrGuyPct !== null && userGainLossPct < mrGuyPct

  const taunt = userLosing
    ? "Mr. Guy says: \"You call that a portfolio? 🤖 My circuits predicted this.\""
    : userWinning
    ? "You're beating Mr. Guy! 🎉 The robot is shaking."
    : "You're neck-and-neck with Mr. Guy. Make your move!"

  return (
    <Card className="border-purple-500/20 bg-purple-950/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
          <Bot className="h-4 w-4 text-purple-400" />
          Beat Mr. Guy 🤖
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
                <p className="text-xs text-gray-400 mb-1">Mr. Guy 🤖</p>
                <p className={cn('text-xl font-bold', mrGuyPct !== null ? gainColor(mrGuyPct) : 'text-gray-500')}>
                  {mrGuyPct !== null ? `${mrGuyPct >= 0 ? '+' : ''}${mrGuyPct.toFixed(2)}%` : '—'}
                </p>
              </div>
            </div>

            {/* Taunt message */}
            <p className={cn('text-xs text-center px-2 py-1.5 rounded-lg',
              userWinning ? 'text-green-400 bg-green-500/10' : userLosing ? 'text-purple-300 bg-purple-500/10' : 'text-gray-400 bg-gray-800')}>
              {taunt}
            </p>

            {/* Mr. Guy's picks */}
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Mr. Guy&apos;s Season Picks</p>
              {picks.map(p => (
                <div key={p.ticker} className="flex items-center justify-between text-xs py-1 border-b border-gray-800/60 last:border-0">
                  <span className="font-bold text-white w-16">{p.ticker}</span>
                  <span className="text-gray-400">{formatCurrency(p.currentPrice ?? 0)}</span>
                  <span className={gainColor(p.gainLoss)}>
                    {p.gainLoss >= 0 ? '+' : ''}{formatCurrency(p.gainLoss)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
