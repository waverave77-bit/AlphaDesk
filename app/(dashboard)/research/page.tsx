'use client'
import { Search, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StockSearch from '@/components/research/StockSearch'
import { cn } from '@/lib/utils'

const POPULAR = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK-B', 'JPM', 'V']

interface Mover {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
}

function MoverRow({ m }: { m: Mover }) {
  const router = useRouter()
  const pos = m.changePercent >= 0
  return (
    <div
      onClick={() => router.push(`/research/${m.ticker}`)}
      className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-800 cursor-pointer transition-colors border border-transparent hover:border-gray-700"
    >
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', pos ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400')}>
          {pos ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        </div>
        <div>
          <p className="text-base font-bold text-white">{m.ticker}</p>
          <p className="text-sm text-gray-500 truncate max-w-[180px]">{m.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-base font-semibold text-white">${m.price.toFixed(2)}</p>
        <p className={cn('text-sm font-bold', pos ? 'text-green-400' : 'text-red-400')}>
          {pos ? '+' : ''}{m.changePercent.toFixed(2)}%
        </p>
      </div>
    </div>
  )
}

export default function ResearchPage() {
  const [gainers, setGainers] = useState<Mover[]>([])
  const [losers, setLosers] = useState<Mover[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/movers')
      .then(r => r.json())
      .then(d => { setGainers(d.gainers || []); setLosers(d.losers || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Stock Research</h1>
        <p className="text-base text-gray-400 mt-1">Search any stock or ETF for live data, analyst ratings, and more</p>
      </div>

      <div className="flex flex-col items-center py-12 space-y-5">
        <div className="flex items-center gap-4 mb-2">
          <div className="h-16 w-16 rounded-2xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
            <Search className="h-8 w-8 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">Search Any Stock</h2>
        </div>
        <div className="w-full max-w-3xl">
          <StockSearch placeholder="Search by ticker or company name (e.g. AAPL, Apple...)" className="h-14 text-base" />
        </div>
        <p className="text-sm text-gray-500">Press Enter to jump directly to a ticker</p>
      </div>

      {/* Top Movers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Gainers */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <p className="text-base font-semibold text-white">Top Gainers Today</p>
            <span className="ml-auto text-sm text-gray-600">Yahoo Finance</span>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : gainers.length > 0 ? (
            <div className="space-y-1">
              {gainers.map(m => <MoverRow key={m.ticker} m={m} />)}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">No data available</p>
          )}
        </div>

        {/* Losers */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="h-5 w-5 text-red-400" />
            <p className="text-base font-semibold text-white">Top Losers Today</p>
            <span className="ml-auto text-sm text-gray-600">Yahoo Finance</span>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : losers.length > 0 ? (
            <div className="space-y-1">
              {losers.map(m => <MoverRow key={m.ticker} m={m} />)}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">No data available</p>
          )}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-400 mb-3">Popular Stocks</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR.map((t) => (
            <a
              key={t}
              href={`/research/${t}`}
              className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-sm font-medium text-gray-300 hover:border-blue-600 hover:text-blue-400 hover:bg-blue-600/10 transition-colors"
            >
              {t}
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <p className="text-sm font-medium text-white">Live Market Data</p>
          </div>
          <p className="text-xs text-gray-500">Real-time prices, P/E ratios, market cap, 52-week range, and more — powered by Yahoo Finance.</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="h-4 w-4 text-purple-400" />
            <p className="text-sm font-medium text-white">Analyst Consensus</p>
          </div>
          <p className="text-xs text-gray-500">Wall Street analyst ratings, price targets, and reasoning from professional research coverage.</p>
        </div>
      </div>
    </div>
  )
}
