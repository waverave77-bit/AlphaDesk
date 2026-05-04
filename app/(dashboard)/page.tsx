'use client'
import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, DollarSign, BarChart2, RefreshCw, Brain } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import HoldingsTable, { HoldingWithQuote } from '@/components/portfolio/HoldingsTable'
import AddHoldingDialog from '@/components/portfolio/AddHoldingDialog'
import AIAnalysisPanel from '@/components/portfolio/AIAnalysisPanel'
import AllocationChart from '@/components/charts/AllocationChart'
import { formatCurrency, formatPercent, cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  sub?: string
  positive?: boolean | null
  icon: React.ReactNode
  loading?: boolean
}

function StatCard({ title, value, sub, positive, icon, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1">{title}</p>
            {loading ? (
              <Skeleton className="h-7 w-28 mb-1" />
            ) : (
              <p className="text-2xl font-bold text-white">{value}</p>
            )}
            {sub && !loading && (
              <p className={cn('text-xs mt-0.5', positive === true ? 'text-green-400' : positive === false ? 'text-red-400' : 'text-gray-400')}>
                {positive === true ? '▲' : positive === false ? '▼' : ''} {sub}
              </p>
            )}
          </div>
          <div className="rounded-lg bg-gray-800 p-2">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [holdings, setHoldings] = useState<any[]>([])
  const [enrichedHoldings, setEnrichedHoldings] = useState<HoldingWithQuote[]>([])
  const [loadingHoldings, setLoadingHoldings] = useState(true)
  const [loadingPrices, setLoadingPrices] = useState(false)
  const [showAI, setShowAI] = useState(false)

  const fetchHoldings = useCallback(async () => {
    setLoadingHoldings(true)
    try {
      const res = await fetch('/api/portfolio')
      const data = await res.json()
      setHoldings(data.holdings || [])
    } finally {
      setLoadingHoldings(false)
    }
  }, [])

  const enrichWithPrices = useCallback(async (rawHoldings: any[]) => {
    if (!rawHoldings.length) { setEnrichedHoldings([]); return }
    setLoadingPrices(true)
    const tickers = Array.from(new Set(rawHoldings.map((h: any) => h.ticker as string)))

    const quoteMap = new Map<string, any>()
    await Promise.allSettled(
      tickers.map(async (ticker) => {
        const res = await fetch(`/api/stock/${ticker}`)
        const d = await res.json()
        if (d.quote) quoteMap.set(ticker, d.quote)
      })
    )

    const enriched: HoldingWithQuote[] = rawHoldings.map((h) => {
      const q = quoteMap.get(h.ticker)
      const currentPrice = q?.price ?? null
      const costBasis = h.shares * h.purchasePrice
      const currentValue = currentPrice ? h.shares * currentPrice : null
      const gainLoss = currentValue !== null ? currentValue - costBasis : null
      const gainLossPercent = gainLoss !== null && costBasis ? (gainLoss / costBasis) * 100 : null
      return {
        id: h.id,
        ticker: h.ticker,
        companyName: h.companyName,
        shares: h.shares,
        purchasePrice: h.purchasePrice,
        sector: h.sector,
        currentPrice,
        currentValue,
        costBasis,
        gainLoss,
        gainLossPercent,
        dayChange: q?.change ?? null,
        dayChangePercent: q?.changePercent ?? null,
      }
    })

    setEnrichedHoldings(enriched)
    setLoadingPrices(false)
  }, [])

  useEffect(() => { fetchHoldings() }, [fetchHoldings])
  useEffect(() => { if (!loadingHoldings) enrichWithPrices(holdings) }, [holdings, loadingHoldings, enrichWithPrices])

  const totalValue = enrichedHoldings.reduce((s, h) => s + (h.currentValue ?? h.costBasis), 0)
  const totalCost = enrichedHoldings.reduce((s, h) => s + h.costBasis, 0)
  const totalGainLoss = totalValue - totalCost
  const totalGainLossPercent = totalCost ? (totalGainLoss / totalCost) * 100 : 0
  const dayChange = enrichedHoldings.reduce((s, h) => {
    if (h.dayChange && h.currentValue) return s + (h.dayChange / (h.currentPrice ?? 1)) * h.currentValue
    return s
  }, 0)

  const bestPerformer = enrichedHoldings.length ? enrichedHoldings.reduce((b, h) => (h.gainLossPercent ?? -Infinity) > (b.gainLossPercent ?? -Infinity) ? h : b) : null
  const worstPerformer = enrichedHoldings.length ? enrichedHoldings.reduce((w, h) => (h.gainLossPercent ?? Infinity) < (w.gainLossPercent ?? Infinity) ? h : w) : null

  // Allocation data
  const byHolding = enrichedHoldings.map((h) => ({
    name: h.ticker,
    value: totalValue ? ((h.currentValue ?? h.costBasis) / totalValue) * 100 : 0,
  }))

  const bySector = Object.entries(
    enrichedHoldings.reduce((acc, h) => {
      acc[h.sector] = (acc[h.sector] || 0) + (h.currentValue ?? h.costBasis)
      return acc
    }, {} as Record<string, number>)
  ).map(([name, val]) => ({ name, value: totalValue ? (val / totalValue) * 100 : 0 }))

  // AI portfolio data
  const portfolioAIData = {
    totalValue,
    totalGainLoss,
    totalGainLossPercent,
    holdings: enrichedHoldings.map((h) => ({
      ticker: h.ticker,
      companyName: h.companyName,
      shares: h.shares,
      currentValue: h.currentValue ?? h.costBasis,
      gainLoss: h.gainLoss ?? 0,
      gainLossPercent: h.gainLossPercent ?? 0,
      sector: h.sector,
      weight: totalValue ? ((h.currentValue ?? h.costBasis) / totalValue) * 100 : 0,
    })),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolio Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track your investments in real time</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => enrichWithPrices(holdings)} disabled={loadingPrices}>
            <RefreshCw className={cn('h-4 w-4', loadingPrices && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAI(!showAI)}>
            <Brain className="h-4 w-4 text-blue-400" />
            AI Analysis
          </Button>
          <AddHoldingDialog onAdded={fetchHoldings} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Portfolio Value"
          value={formatCurrency(totalValue)}
          icon={<DollarSign className="h-4 w-4 text-blue-400" />}
          loading={loadingHoldings}
        />
        <StatCard
          title="Total Gain / Loss"
          value={`${totalGainLoss >= 0 ? '+' : ''}${formatCurrency(totalGainLoss)}`}
          sub={formatPercent(totalGainLossPercent)}
          positive={totalGainLoss >= 0 ? true : totalGainLoss < 0 ? false : null}
          icon={totalGainLoss >= 0
            ? <TrendingUp className="h-4 w-4 text-green-400" />
            : <TrendingDown className="h-4 w-4 text-red-400" />}
          loading={loadingHoldings || loadingPrices}
        />
        <StatCard
          title="Today's Change"
          value={`${dayChange >= 0 ? '+' : ''}${formatCurrency(dayChange)}`}
          positive={dayChange >= 0 ? true : dayChange < 0 ? false : null}
          icon={<BarChart2 className="h-4 w-4 text-purple-400" />}
          loading={loadingPrices}
        />
        <StatCard
          title="Holdings"
          value={`${holdings.length}`}
          sub={enrichedHoldings.length > 0 && bestPerformer ? `Best: ${bestPerformer.ticker} ${formatPercent(bestPerformer.gainLossPercent ?? 0)}` : undefined}
          icon={<TrendingUp className="h-4 w-4 text-yellow-400" />}
          loading={loadingHoldings}
        />
      </div>

      {/* AI Panel */}
      {showAI && enrichedHoldings.length > 0 && (
        <AIAnalysisPanel type="portfolio" data={portfolioAIData} label="Portfolio Health Check" />
      )}

      {/* Charts Row */}
      {enrichedHoldings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">By Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <AllocationChart data={byHolding} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">By Sector</CardTitle>
            </CardHeader>
            <CardContent>
              <AllocationChart data={bySector} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performers Row */}
      {enrichedHoldings.length > 1 && !loadingPrices && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bestPerformer && (
            <Card className="border-green-800/30">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400 mb-1">Best Performer</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{bestPerformer.ticker}</p>
                    <p className="text-xs text-gray-500">{bestPerformer.companyName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-semibold">{formatPercent(bestPerformer.gainLossPercent ?? 0)}</p>
                    <p className="text-xs text-green-400/70">{bestPerformer.gainLoss != null ? formatCurrency(bestPerformer.gainLoss) : ''}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {worstPerformer && worstPerformer.id !== bestPerformer?.id && (
            <Card className="border-red-800/30">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400 mb-1">Worst Performer</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{worstPerformer.ticker}</p>
                    <p className="text-xs text-gray-500">{worstPerformer.companyName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 font-semibold">{formatPercent(worstPerformer.gainLossPercent ?? 0)}</p>
                    <p className="text-xs text-red-400/70">{worstPerformer.gainLoss != null ? formatCurrency(worstPerformer.gainLoss) : ''}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Holdings Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Holdings</CardTitle>
          <AddHoldingDialog onAdded={fetchHoldings} />
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <HoldingsTable
            holdings={enrichedHoldings}
            loading={loadingHoldings}
            onDelete={(id) => {
              setHoldings((h) => h.filter((x) => x.id !== id))
              setEnrichedHoldings((h) => h.filter((x) => x.id !== id))
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
