'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { BarChart2 } from 'lucide-react'

interface Props {
  userGainLossPct: number | null
}

function gainColor(n: number) { return n >= 0 ? 'text-green-500' : 'text-red-500' }
function gainBg(n: number) { return n >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30' }

export default function VsMarketCard({ userGainLossPct }: Props) {
  const [spyChange, setSpyChange] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stock/SPY')
      .then(r => r.json())
      .then(d => {
        if (d?.quote?.changePercent !== undefined) setSpyChange(d.quote.changePercent)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const beating = userGainLossPct !== null && spyChange !== null && userGainLossPct > spyChange

  return (
    <Card className="border-gray-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="h-4 w-4 text-blue-400" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">You vs Market Today</p>
        </div>
        {loading ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div className={cn('rounded-lg p-3 border text-center', userGainLossPct !== null ? gainBg(userGainLossPct) : 'bg-gray-900 border-gray-800')}>
              <p className="text-xs text-gray-500 mb-1">Your Season Return</p>
              <p className={cn('text-lg font-bold', userGainLossPct !== null ? gainColor(userGainLossPct) : 'text-gray-500')}>
                {userGainLossPct !== null ? `${userGainLossPct >= 0 ? '+' : ''}${userGainLossPct.toFixed(2)}%` : '—'}
              </p>
            </div>
            <div className={cn('rounded-lg p-3 border text-center', spyChange !== null ? gainBg(spyChange) : 'bg-gray-900 border-gray-800')}>
              <p className="text-xs text-gray-500 mb-1">SPY Today</p>
              <p className={cn('text-lg font-bold', spyChange !== null ? gainColor(spyChange) : 'text-gray-500')}>
                {spyChange !== null ? `${spyChange >= 0 ? '+' : ''}${spyChange.toFixed(2)}%` : '—'}
              </p>
            </div>
          </div>
        )}
        {!loading && userGainLossPct !== null && spyChange !== null && (
          <p className={cn('text-xs text-center mt-2', beating ? 'text-green-400' : 'text-gray-500')}>
            {beating ? '🚀 You\'re beating the market!' : `📉 SPY is ahead by ${(spyChange - userGainLossPct).toFixed(2)}%`}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
