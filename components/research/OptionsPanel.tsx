'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface OptionsData {
  error: boolean
  putCallRatio: number | null
  totalCallVolume: number
  totalPutVolume: number
  topCalls: Contract[]
  topPuts: Contract[]
  expirationDate: string | null
}

interface Contract {
  strike: number
  expiration: string
  volume: number
  openInterest: number
  impliedVolatility: string
  lastPrice: number
  inTheMoney: boolean
}

function ContractTable({ contracts, type }: { contracts: Contract[]; type: 'calls' | 'puts' }) {
  const color = type === 'calls' ? 'text-green-400' : 'text-red-400'
  return (
    <div className="flex-1 min-w-0">
      <p className={cn('text-xs font-semibold uppercase tracking-wider mb-2', color)}>Top {type}</p>
      <div className="space-y-1">
        <div className="grid grid-cols-4 text-[10px] text-gray-600 pb-1 border-b border-gray-800">
          <span>Strike</span><span className="text-center">Vol</span><span className="text-center">OI</span><span className="text-right">IV</span>
        </div>
        {contracts.map((c, i) => (
          <div key={i} className={cn('grid grid-cols-4 text-xs py-0.5', c.inTheMoney ? 'text-gray-200' : 'text-gray-400')}>
            <span className={c.inTheMoney ? color : ''}>${c.strike}</span>
            <span className="text-center">{c.volume?.toLocaleString()}</span>
            <span className="text-center">{c.openInterest?.toLocaleString()}</span>
            <span className="text-right">{c.impliedVolatility}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function OptionsPanel({ ticker }: { ticker: string }) {
  const [data, setData] = useState<OptionsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/options/${ticker}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) return (
    <Card><CardContent className="p-5 space-y-3">
      <Skeleton className="h-4 w-32" />
      <div className="flex gap-4"><Skeleton className="h-16 flex-1" /><Skeleton className="h-16 flex-1" /><Skeleton className="h-16 flex-1" /></div>
      <Skeleton className="h-32 w-full" />
    </CardContent></Card>
  )

  if (!data || data.error) return (
    <Card><CardContent className="p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Options Flow</p>
      <p className="text-sm text-gray-500">Options data unavailable for {ticker}.</p>
    </CardContent></Card>
  )

  const pcr = data.putCallRatio
  const pcrColor = !pcr ? 'text-gray-400' : pcr < 0.7 ? 'text-green-400' : pcr > 1.0 ? 'text-red-400' : 'text-yellow-400'
  const pcrLabel = !pcr ? '—' : pcr < 0.7 ? 'Positive' : pcr > 1.0 ? 'Negative' : 'Neutral'

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4">Options Flow</p>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Put/Call Ratio</p>
            <p className={cn('text-xl font-bold', pcrColor)}>{pcr ? pcr.toFixed(2) : '—'}</p>
            <p className={cn('text-xs', pcrColor)}>{pcrLabel}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Call Volume</p>
            <p className="text-xl font-bold text-green-400">{data.totalCallVolume.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Put Volume</p>
            <p className="text-xl font-bold text-red-400">{data.totalPutVolume.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex gap-6">
          <ContractTable contracts={data.topCalls} type="calls" />
          <div className="w-px bg-gray-800" />
          <ContractTable contracts={data.topPuts} type="puts" />
        </div>
      </CardContent>
    </Card>
  )
}
