'use client'
import { useState, useEffect } from 'react'
import { Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface Holding {
  name: string
  value: number
  shares: number
}

interface Fund {
  name: string
  cik: number
  filingDate: string | null
  topHoldings: Holding[]
}

function FundCard({ fund }: { fund: Fund }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-400 shrink-0" />
            <p className="text-sm font-semibold text-white leading-tight">{fund.name}</p>
          </div>
          {fund.filingDate && (
            <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-700 shrink-0 ml-2">
              13F {fund.filingDate}
            </Badge>
          )}
        </div>

        {fund.topHoldings.length === 0 ? (
          <p className="text-xs text-gray-600">Holdings data unavailable</p>
        ) : (
          <div className="space-y-1.5">
            <div className="grid grid-cols-12 text-[10px] text-gray-600 pb-1 border-b border-gray-800">
              <span className="col-span-1">#</span>
              <span className="col-span-6">Company</span>
              <span className="col-span-3 text-right">Value</span>
              <span className="col-span-2 text-right">Shares</span>
            </div>
            {fund.topHoldings.slice(0, 5).map((h, i) => (
              <div key={i} className="grid grid-cols-12 text-xs items-center py-0.5">
                <span className="col-span-1 text-gray-600">{i + 1}</span>
                <span className="col-span-6 text-gray-300 truncate pr-2">{h.name}</span>
                <span className="col-span-3 text-right text-gray-400 font-mono">${(h.value / 1000).toFixed(1)}M</span>
                <span className="col-span-2 text-right text-gray-600 font-mono">{h.shares > 1e6 ? (h.shares / 1e6).toFixed(1) + 'M' : h.shares.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function HedgeFundsPage() {
  const [funds, setFunds] = useState<Fund[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/hedgefunds')
      .then(r => r.json())
      .then(d => setFunds(d.funds ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Hedge Fund Tracker</h1>
        <p className="text-sm text-gray-400 mt-1">Latest 13F filings from top institutional investors</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}><CardContent className="p-5 space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {funds.map(fund => <FundCard key={fund.cik} fund={fund} />)}
        </div>
      )}

      <p className="text-xs text-gray-600 text-center pb-4">
        Data sourced from SEC 13F filings via EDGAR. Updated quarterly. Holdings as of most recent filing date.
      </p>
    </div>
  )
}
