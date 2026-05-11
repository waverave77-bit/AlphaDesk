'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, DollarSign, BarChart2, RefreshCw, Brain, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import HoldingsTable, { HoldingWithQuote } from '@/components/portfolio/HoldingsTable'
import AddHoldingDialog from '@/components/portfolio/AddHoldingDialog'
import AIAnalysisPanel from '@/components/portfolio/AIAnalysisPanel'
import AllocationChart from '@/components/charts/AllocationChart'
import PortfolioPerformanceChart from '@/components/charts/PortfolioPerformanceChart'
import InfoTooltip from '@/components/InfoTooltip'
import { formatCurrency, formatPercent, cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  sub?: string
  positive?: boolean | null
  icon: React.ReactNode
  loading?: boolean
  tooltip?: string
}

function StatCard({ title, value, sub, positive, icon, loading, tooltip }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-xs text-slate-500 mb-1 font-medium">
              <span className="truncate uppercase tracking-wide">{title}</span>
              {tooltip && <InfoTooltip text={tooltip} />}
            </p>
            {loading ? (
              <Skeleton className="h-7 w-24 mb-1" />
            ) : (
              <p className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{value}</p>
            )}
            {sub && !loading && (
              <p className={cn('text-xs mt-0.5 font-medium', positive === true ? 'text-green-600' : positive === false ? 'text-red-500' : 'text-slate-500')}>
                {positive === true ? '▲' : positive === false ? '▼' : ''} {sub}
              </p>
            )}
          </div>
          <div className="rounded-lg bg-slate-100 p-2 shrink-0 ml-2">{icon}</div>
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
        purchaseDate: h.purchaseDate,
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
  // dayChange per share × shares owned = total dollar change today
  const dayChange = enrichedHoldings.reduce((s, h) => {
    if (h.dayChange != null && h.shares) return s + h.dayChange * h.shares
    return s
  }, 0)

  const grouped = Array.from(
    enrichedHoldings.reduce((map, h) => {
      const existing = map.get(h.ticker)
      if (!existing) {
        map.set(h.ticker, { ticker: h.ticker, companyName: h.companyName, sector: h.sector,
          totalShares: h.shares, totalCost: h.costBasis,
          currentValue: h.currentValue ?? h.costBasis,
          gainLoss: h.gainLoss ?? 0, gainLossPercent: h.gainLossPercent ?? 0,
          currentPrice: h.currentPrice, dayChangePercent: h.dayChangePercent })
      } else {
        existing.totalShares += h.shares
        existing.totalCost += h.costBasis
        existing.currentValue += h.currentValue ?? h.costBasis
        existing.gainLoss = existing.currentValue - existing.totalCost
        existing.gainLossPercent = existing.totalCost ? (existing.gainLoss / existing.totalCost) * 100 : 0
      }
      return map
    }, new Map<string, any>())
  ).map(([, v]) => v)

  const uniqueTickers = grouped.length
  const bestPerformer = grouped.length ? grouped.reduce((b: any, h: any) => h.gainLossPercent > b.gainLossPercent ? h : b) : null
  const worstPerformer = grouped.length ? grouped.reduce((w: any, h: any) => h.gainLossPercent < w.gainLossPercent ? h : w) : null

  const byHolding = grouped.map((h) => ({ name: h.ticker, value: totalValue ? (h.currentValue / totalValue) * 100 : 0 }))
  const bySector = Object.entries(
    enrichedHoldings.reduce((acc, h) => {
      acc[h.sector] = (acc[h.sector] || 0) + (h.currentValue ?? h.costBasis)
      return acc
    }, {} as Record<string, number>)
  ).map(([name, val]) => ({ name, value: totalValue ? (val / totalValue) * 100 : 0 }))

  const portfolioAIData = {
    totalValue, totalGainLoss, totalGainLossPercent,
    holdings: grouped.map((h) => ({
      ticker: h.ticker, companyName: h.companyName, shares: h.totalShares,
      currentValue: h.currentValue, gainLoss: h.gainLoss, gainLossPercent: h.gainLossPercent,
      sector: h.sector, weight: totalValue ? (h.currentValue / totalValue) * 100 : 0,
    })),
  }

  return (
    <div className="flex gap-6">
      {/* Left watchlist panel */}
      <aside className="hidden xl:flex flex-col w-64 shrink-0 gap-4">
        {/* Watchlist preview */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">My Holdings</p>
            <Link href="/watchlist" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {loadingHoldings ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : grouped.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No holdings yet — add some stocks!</p>
          ) : (
            <div className="space-y-0">
              {grouped.slice(0, 6).map((h) => (
                <Link
                  key={h.ticker}
                  href={`/research/${h.ticker}`}
                  className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 -mx-1 px-1 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{h.ticker}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[100px]">{h.companyName}</p>
                  </div>
                  <div className="text-right">
                    {h.currentPrice && <p className="text-sm font-medium text-slate-900">${h.currentPrice.toFixed(0)}</p>}
                    {h.dayChangePercent != null && (
                      <span className={cn(
                        'text-xs font-semibold px-1.5 py-0.5 rounded-full',
                        h.dayChangePercent >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                      )}>
                        {h.dayChangePercent >= 0 ? '+' : ''}{h.dayChangePercent.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Links</p>
          <div className="space-y-1">
            {[
              { label: '📅 Earnings Calendar', href: '/earnings' },
              { label: '🏦 Hedge Funds', href: '/hedgefunds' },
              { label: '👥 Smart Money', href: '/insiders' },
              { label: '📖 Dictionary', href: '/learn' },
              { label: '⚗️ Quant Strategy', href: '/quant' },
            ].map(({ label, href }) => (
              <Link key={href} href={href} className="block text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded-lg transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Good morning 👋</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Your portfolio is {totalGainLoss >= 0 ? 'up' : 'down'} today · Last updated just now
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => enrichWithPrices(holdings)} disabled={loadingPrices}>
              <RefreshCw className={cn('h-4 w-4', loadingPrices && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAI(!showAI)}>
              <Brain className="h-4 w-4 text-blue-600" />
              <span className="hidden sm:inline">AI Analysis</span>
              <span className="sm:hidden">AI</span>
            </Button>
            <AddHoldingDialog onAdded={fetchHoldings} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Total Value"
            value={formatCurrency(totalValue)}
            icon={<DollarSign className="h-4 w-4 text-blue-500" />}
            loading={loadingHoldings}
            tooltip="The total amount your stocks are worth right now if you sold everything today."
          />
          <StatCard
            title="Total Gain / Loss"
            value={`${totalGainLoss >= 0 ? '+' : ''}${formatCurrency(totalGainLoss)}`}
            sub={formatPercent(totalGainLossPercent)}
            positive={totalGainLoss >= 0 ? true : totalGainLoss < 0 ? false : null}
            icon={totalGainLoss >= 0
              ? <TrendingUp className="h-4 w-4 text-green-500" />
              : <TrendingDown className="h-4 w-4 text-red-500" />}
            loading={loadingHoldings || loadingPrices}
            tooltip="How much money you've made (or lost) compared to what you originally paid."
          />
          <StatCard
            title="Today's Change"
            value={`${dayChange >= 0 ? '+' : ''}${formatCurrency(dayChange)}`}
            positive={dayChange >= 0 ? true : dayChange < 0 ? false : null}
            icon={<BarChart2 className="h-4 w-4 text-purple-500" />}
            loading={loadingPrices}
            tooltip="How much your total portfolio went up or down just today."
          />
          <StatCard
            title="Holdings"
            value={`${uniqueTickers}`}
            sub={bestPerformer ? `Best: ${bestPerformer.ticker} ${formatPercent(bestPerformer.gainLossPercent ?? 0)}` : undefined}
            icon={<Calendar className="h-4 w-4 text-amber-500" />}
            loading={loadingHoldings}
            tooltip="The number of different companies you own shares in."
          />
        </div>

        {/* AI Panel */}
        {showAI && enrichedHoldings.length > 0 && (
          <AIAnalysisPanel type="portfolio" data={portfolioAIData} label="Portfolio Health Check" />
        )}

        {/* Best / Worst performers */}
        {grouped.length > 1 && !loadingPrices && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bestPerformer && (
              <Card className="border-green-100">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Best Performer</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{bestPerformer.ticker}</p>
                      <p className="text-xs text-slate-400">{bestPerformer.companyName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-600 font-semibold">{formatPercent(bestPerformer.gainLossPercent ?? 0)}</p>
                      <p className="text-xs text-green-500">{formatCurrency(bestPerformer.gainLoss ?? 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {worstPerformer && worstPerformer.ticker !== bestPerformer?.ticker && (
              <Card className="border-red-100">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Watch Out For</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{worstPerformer.ticker}</p>
                      <p className="text-xs text-slate-400">{worstPerformer.companyName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-500 font-semibold">{formatPercent(worstPerformer.gainLossPercent ?? 0)}</p>
                      <p className="text-xs text-red-400">{formatCurrency(worstPerformer.gainLoss ?? 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Charts */}
        {enrichedHoldings.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Performance chart */}
            <PortfolioPerformanceChart />

            {/* Allocation by holding */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wide">By Holdings</CardTitle>
              </CardHeader>
              <CardContent>
                <AllocationChart data={byHolding} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Holdings Table */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Holdings</CardTitle>
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
    </div>
  )
}
