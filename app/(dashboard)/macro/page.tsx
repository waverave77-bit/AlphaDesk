'use client'
import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Globe } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import InfoTooltip from '@/components/InfoTooltip'
import LastUpdated from '@/components/LastUpdated'

interface MacroData {
  dxy: { price: number; change: number; changePercent: number; history: { date: string; close: number }[] } | null
  m2: { date: string; value: number }[]
  stockImpact: string
  m2Impact: string
}

export default function MacroPage() {
  const [data, setData] = useState<MacroData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetch('/api/macro').then(r => r.json()).then(d => { setData(d); setLastUpdated(new Date()) }).finally(() => setLoading(false))
  }, [])

  const dxy = data?.dxy
  const dxyPositive = (dxy?.changePercent ?? 0) >= 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">Macro Dashboard <InfoTooltip text="Macroeconomics looks at the big picture, the dollar, money supply, interest rates, and how they affect the entire stock market." /></h1>
        <p className="text-sm text-gray-400 mt-1">US Dollar Index, money supply, and macro impact on equities</p>
        <LastUpdated time={lastUpdated} />
      </div>

      {/* DXY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-blue-400" />
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium flex items-center gap-1">US Dollar Index (DXY) <InfoTooltip text="The DXY measures how strong the US dollar is against 6 major foreign currencies. A rising DXY generally pressures stocks, especially global companies." /></p>
            </div>
            {loading ? <Skeleton className="h-16 w-full" /> : dxy ? (
              <div>
                <p className="text-4xl font-bold text-white">{dxy.price.toFixed(2)}</p>
                <div className="flex items-center gap-2 mt-1">
                  {dxyPositive ? <TrendingUp className="h-4 w-4 text-red-400" /> : <TrendingDown className="h-4 w-4 text-green-400" />}
                  <span className={cn('text-sm font-semibold', dxyPositive ? 'text-red-400' : 'text-green-400')}>
                    {dxy.change >= 0 ? '+' : ''}{dxy.change.toFixed(2)} ({dxy.changePercent >= 0 ? '+' : ''}{dxy.changePercent.toFixed(2)}%)
                  </span>
                  <span className="text-xs text-gray-500">Today</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">DX=F · CBOT Dollar Index Futures</p>
              </div>
            ) : <p className="text-sm text-gray-500">DXY data unavailable</p>}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-yellow-400" />
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium flex items-center gap-1">Impact on Stocks <InfoTooltip text="How today's dollar movement tends to affect equity markets. A stronger dollar is generally bearish for stocks; a weaker dollar is bullish." /></p>
            </div>
            {loading ? <Skeleton className="h-16 w-full" /> : (
              <div>
                <div className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium mb-3',
                  dxyPositive ? 'bg-red-400/10 text-red-400' : 'bg-green-400/10 text-green-400')}>
                  {dxyPositive ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                  {dxyPositive ? 'Bearish for equities' : 'Bullish for equities'}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{data?.stockImpact}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DXY History */}
      {!loading && dxy && dxy.history.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4">DXY, 30 Day History</p>
            <div className="overflow-x-auto">
              <div className="flex items-end gap-1 h-24 min-w-max">
                {(() => {
                  const vals = dxy.history.map(d => d.close)
                  const min = Math.min(...vals)
                  const max = Math.max(...vals)
                  const range = max - min || 1
                  return dxy.history.map((d, i) => {
                    const pct = ((d.close - min) / range) * 100
                    const isLast = i === dxy.history.length - 1
                    return (
                      <div key={i} className="flex flex-col items-center gap-1 group">
                        <div className={cn('w-3 rounded-sm transition-colors', isLast ? 'bg-blue-400' : 'bg-gray-700 group-hover:bg-gray-500')}
                          style={{ height: `${Math.max(4, pct)}%` }} title={`${d.date}: ${d.close}`} />
                        {i % 5 === 0 && <span className="text-[9px] text-gray-600 rotate-45 origin-left">{d.date}</span>}
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* M2 Money Supply */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-4 w-4 text-purple-400" />
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium flex items-center gap-1">M2 Money Supply <InfoTooltip text="M2 is the total amount of money in the US economy, cash, bank deposits, and savings. When it grows, more money chases stocks (bullish). When it shrinks, markets often fall." /></p>
          </div>
          {loading ? <Skeleton className="h-40 w-full" /> : data?.m2 && data.m2.length > 0 ? (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left text-gray-500 pb-2 font-medium">Date</th>
                      <th className="text-right text-gray-500 pb-2 font-medium">M2 ($B)</th>
                      <th className="text-right text-gray-500 pb-2 font-medium">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.m2.slice().reverse().map((row, i, arr) => {
                      const prev = arr[i + 1]
                      const change = prev ? row.value - prev.value : null
                      return (
                        <tr key={i} className="border-b border-gray-800/50 last:border-0">
                          <td className="py-2 text-gray-300">{row.date}</td>
                          <td className="py-2 text-right text-gray-200 font-mono">${(row.value / 1000).toFixed(2)}T</td>
                          <td className={cn('py-2 text-right font-mono', change === null ? '' : change >= 0 ? 'text-green-400' : 'text-red-400')}>
                            {change !== null ? `${change >= 0 ? '+' : ''}${change.toFixed(1)}B` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mt-4 p-3 bg-gray-800/50 rounded-lg">{data.m2Impact}</p>
            </div>
          ) : <p className="text-sm text-gray-500">M2 data unavailable</p>}
        </CardContent>
      </Card>

      {/* Key Relationships */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: DollarSign, color: 'text-blue-400', title: 'DXY vs Stocks', body: 'A rising dollar typically hurts US multinationals by reducing the USD value of foreign earnings. Emerging markets and commodities are especially sensitive to dollar strength.' },
          { icon: BarChart2, color: 'text-purple-400', title: 'M2 vs Markets', body: 'Expanding money supply (QE, rate cuts) historically inflates asset prices. Contracting M2 (QT, rate hikes) creates headwinds for equities and risk assets.' },
          { icon: Globe, color: 'text-yellow-400', title: 'Dollar vs Commodities', body: 'Commodities are priced in USD globally. A weaker dollar makes commodities cheaper in other currencies, boosting demand, and typically benefits energy, metals, and agricultural sectors.' },
        ].map(({ icon: Icon, color, title, body }) => (
          <Card key={title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('h-4 w-4', color)} />
                <p className="text-xs font-semibold text-gray-300">{title}</p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
