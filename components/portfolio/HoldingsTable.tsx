'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { Trash2, ExternalLink, TrendingUp, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatPercent, gainLossColor, cn } from '@/lib/utils'
import InfoTooltip from '@/components/InfoTooltip'

export interface HoldingWithQuote {
  id: string
  ticker: string
  companyName: string
  shares: number
  purchasePrice: number
  purchaseDate?: string
  sector: string
  currentPrice: number | null
  currentValue: number | null
  costBasis: number
  gainLoss: number | null
  gainLossPercent: number | null
  dayChange: number | null
  dayChangePercent: number | null
}

// Grouped view — one row per ticker
interface GroupedHolding {
  ticker: string
  companyName: string
  sector: string
  totalShares: number
  avgCost: number
  totalCost: number
  currentPrice: number | null
  currentValue: number | null
  gainLoss: number | null
  gainLossPercent: number | null
  dayChange: number | null
  dayChangePercent: number | null
  lots: HoldingWithQuote[]
}

function groupHoldings(holdings: HoldingWithQuote[]): GroupedHolding[] {
  const map = new Map<string, HoldingWithQuote[]>()
  for (const h of holdings) {
    if (!map.has(h.ticker)) map.set(h.ticker, [])
    map.get(h.ticker)!.push(h)
  }

  return Array.from(map.entries()).map(([ticker, lots]) => {
    const totalShares = lots.reduce((s, l) => s + l.shares, 0)
    const totalCost = lots.reduce((s, l) => s + l.costBasis, 0)
    const avgCost = totalCost / totalShares
    const currentPrice = lots[0].currentPrice
    const currentValue = currentPrice != null ? totalShares * currentPrice : null
    const gainLoss = currentValue != null ? currentValue - totalCost : null
    const gainLossPercent = gainLoss != null && totalCost ? (gainLoss / totalCost) * 100 : null
    return {
      ticker,
      companyName: lots[0].companyName,
      sector: lots[0].sector,
      totalShares,
      avgCost,
      totalCost,
      currentPrice,
      currentValue,
      gainLoss,
      gainLossPercent,
      dayChange: lots[0].dayChange,
      dayChangePercent: lots[0].dayChangePercent,
      lots,
    }
  })
}

interface HoldingsTableProps {
  holdings: HoldingWithQuote[]
  loading: boolean
  onDelete: (id: string) => void
}

export default function HoldingsTable({ holdings, loading, onDelete }: HoldingsTableProps) {
  const { toast } = useToast()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggleExpand = (ticker: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(ticker)) { next.delete(ticker) } else { next.add(ticker) }
      return next
    })

  const handleDelete = async (id: string, ticker: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'Lot removed', description: `${ticker} lot removed from portfolio` })
      onDelete(id)
    } catch {
      toast({ title: 'Error', description: 'Failed to remove lot', variant: 'destructive' })
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    )
  }

  if (!holdings.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No holdings yet. Add your first stock to get started.</p>
      </div>
    )
  }

  const grouped = groupHoldings(holdings)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm xl:text-base">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-3 xl:py-4 px-4 text-gray-400 font-medium w-6"></th>
            <th className="text-left py-3 xl:py-4 px-4 text-gray-400 font-medium">Stock</th>
            <th className="text-right py-3 xl:py-4 px-4 text-gray-400 font-medium"><span className="flex items-center justify-end gap-1">Shares <InfoTooltip text="How many units of this stock you own." /></span></th>
            <th className="text-right py-3 xl:py-4 px-4 text-gray-400 font-medium"><span className="flex items-center justify-end gap-1">Avg Cost <InfoTooltip text="Your average purchase price per share, accounting for all buy lots." /></span></th>
            <th className="text-right py-3 xl:py-4 px-4 text-gray-400 font-medium"><span className="flex items-center justify-end gap-1">Price <InfoTooltip text="Current live market price per share." /></span></th>
            <th className="text-right py-3 xl:py-4 px-4 text-gray-400 font-medium"><span className="flex items-center justify-end gap-1">Day <InfoTooltip text="Today's percentage change in the stock price since yesterday's close." /></span></th>
            <th className="text-right py-3 xl:py-4 px-4 text-gray-400 font-medium"><span className="flex items-center justify-end gap-1">Value <InfoTooltip text="Current market value of your position — shares × current price." /></span></th>
            <th className="text-right py-3 xl:py-4 px-4 text-gray-400 font-medium"><span className="flex items-center justify-end gap-1">P&amp;L <InfoTooltip text="Profit & Loss — how much money you've made or lost on this holding since you bought it." /></span></th>
            <th className="text-right py-3 xl:py-4 px-4 text-gray-400 font-medium"><span className="flex items-center justify-end gap-1">P&amp;L % <InfoTooltip text="Your gain or loss as a percentage of what you originally paid." /></span></th>
            <th className="py-3 xl:py-4 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {grouped.map((g) => {
            const isExpanded = expanded.has(g.ticker)
            const hasMultipleLots = g.lots.length > 1

            return (
              <React.Fragment key={g.ticker}>
                {/* ── Main grouped row ── */}
                <tr
                  className={cn(
                    'border-b border-gray-800/50 transition-colors',
                    hasMultipleLots ? 'hover:bg-gray-800/30 cursor-pointer' : 'hover:bg-gray-800/20',
                    isExpanded && 'bg-gray-800/20'
                  )}
                  onClick={() => hasMultipleLots && toggleExpand(g.ticker)}
                >
                  {/* Expand chevron */}
                  <td className="py-3 xl:py-5 pl-4 pr-1 text-gray-600 w-6">
                    {hasMultipleLots && (
                      isExpanded
                        ? <ChevronDown className="h-3.5 w-3.5 text-blue-400" />
                        : <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </td>

                  <td className="py-3 xl:py-5 px-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/research/${g.ticker}`}
                        className="font-semibold text-white hover:text-blue-400 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {g.ticker}
                      </Link>
                      <span className="text-gray-500 text-xs hidden md:block truncate max-w-[140px]">{g.companyName}</span>
                      {hasMultipleLots && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 text-gray-500 border-gray-700">
                          {g.lots.length} lots
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-600">{g.sector}</span>
                  </td>

                  <td className="py-3 xl:py-5 px-4 text-right text-gray-300">{g.totalShares.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                  <td className="py-3 xl:py-5 px-4 text-right text-gray-300">{formatCurrency(g.avgCost)}</td>
                  <td className="py-3 xl:py-5 px-4 text-right text-white font-medium">
                    {g.currentPrice != null ? formatCurrency(g.currentPrice) : <Skeleton className="h-4 w-16 ml-auto" />}
                  </td>
                  <td className="py-3 xl:py-5 px-4 text-right">
                    {g.dayChangePercent != null ? (
                      <span className={cn('text-xs', gainLossColor(g.dayChangePercent))}>
                        {g.dayChangePercent >= 0
                          ? <TrendingUp className="h-3 w-3 inline mr-0.5" />
                          : <TrendingDown className="h-3 w-3 inline mr-0.5" />}
                        {formatPercent(g.dayChangePercent)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-3 xl:py-5 px-4 text-right text-white font-medium">
                    {g.currentValue != null ? formatCurrency(g.currentValue) : '—'}
                  </td>
                  <td className={cn('py-3 xl:py-5 px-4 text-right font-medium', gainLossColor(g.gainLoss ?? 0))}>
                    {g.gainLoss != null ? (g.gainLoss >= 0 ? '+' : '') + formatCurrency(g.gainLoss) : '—'}
                  </td>
                  <td className={cn('py-3 xl:py-5 px-4 text-right font-medium', gainLossColor(g.gainLossPercent ?? 0))}>
                    {g.gainLossPercent != null ? formatPercent(g.gainLossPercent) : '—'}
                  </td>
                  <td className="py-3 xl:py-5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <Link href={`/research/${g.ticker}`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </td>
                </tr>

                {/* ── Purchase history rows (expanded) ── */}
                {isExpanded && (
                  <tr key={`${g.ticker}-history`} className="border-b border-gray-800/50">
                    <td colSpan={10} className="p-0">
                      <div className="bg-gray-900/60 border-l-2 border-blue-500/30 mx-4 mb-2 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] text-[10px] text-gray-600 uppercase tracking-wide px-4 py-2 border-b border-gray-800">
                          <span>Date</span>
                          <span className="text-right">Shares</span>
                          <span className="text-right">Price Paid</span>
                          <span className="text-right">Cost Basis</span>
                          <span className="text-right">P&amp;L</span>
                          <span className="w-8" />
                        </div>
                        {g.lots.map((lot) => {
                          const lotGainLoss = g.currentPrice != null ? lot.shares * g.currentPrice - lot.costBasis : null
                          const lotGainLossPct = lotGainLoss != null && lot.costBasis ? (lotGainLoss / lot.costBasis) * 100 : null
                          return (
                            <div
                              key={lot.id}
                              className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] items-center px-4 py-2 border-b border-gray-800/30 last:border-0 hover:bg-gray-800/30 text-xs"
                            >
                              <span className="text-gray-400">
                                {lot.purchaseDate
                                  ? new Date(lot.purchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                  : '—'}
                              </span>
                              <span className="text-right text-gray-300">{lot.shares.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                              <span className="text-right text-gray-300">{formatCurrency(lot.purchasePrice)}</span>
                              <span className="text-right text-gray-400">{formatCurrency(lot.costBasis)}</span>
                              <span className={cn('text-right font-medium', gainLossColor(lotGainLoss ?? 0))}>
                                {lotGainLoss != null
                                  ? `${lotGainLoss >= 0 ? '+' : ''}${formatCurrency(lotGainLoss)} (${formatPercent(lotGainLossPct ?? 0)})`
                                  : '—'}
                              </span>
                              <div className="flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:text-red-400 hover:bg-red-400/10"
                                  onClick={() => handleDelete(lot.id, lot.ticker)}
                                  disabled={deleting === lot.id}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
