import { Search, TrendingUp, BarChart2 } from 'lucide-react'
import StockSearch from '@/components/research/StockSearch'

const POPULAR = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK-B', 'JPM', 'V']

export default function ResearchPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Stock Research</h1>
        <p className="text-sm text-gray-400 mt-0.5">Search any stock or ETF for live data and AI-powered analysis</p>
      </div>

      <div className="flex flex-col items-center py-12 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
            <Search className="h-6 w-6 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Search Any Stock</h2>
        </div>
        <div className="w-full max-w-2xl">
          <StockSearch placeholder="Search by ticker or company name (e.g. AAPL, Apple...)" />
        </div>
        <p className="text-xs text-gray-500">Press Enter to jump directly to a ticker</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
            <p className="text-sm font-medium text-white">AI-Powered Analysis</p>
          </div>
          <p className="text-xs text-gray-500">Get structured research reports with Buy/Hold/Sell recommendations powered by Claude AI.</p>
        </div>
      </div>
    </div>
  )
}
