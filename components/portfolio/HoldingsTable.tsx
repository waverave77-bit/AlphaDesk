'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Trash2, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatPercent, gainLossColor } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface HoldingWithQuote {
  id: string
  ticker: string
  companyName: string
  shares: number
  purchasePrice: number
  sector: string
  currentPrice: number | null
  currentValue: number | null
  costBasis: number
  gainLoss: number | null
  gainLossPercent: number | null
  dayChange: number | null
  dayChangePercent: number | null
}

interface HoldingsTableProps {
  holdings: HoldingWithQuote[]
  loading: boolean
  onDelete: (id: string) => void
}

export default function HoldingsTable({ holdings, loading, onDelete }: HoldingsTableProps) {
  const { toast } = useToast()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string, ticker: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'Holding removed', description: `${ticker} removed from portfolio` })
      onDelete(id)
    } catch {
      toast({ title: 'Error', description: 'Failed to remove holding', variant: 'destructive' })
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Stock</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Shares</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Avg Cost</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Price</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Day</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Value</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">P&L</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">P&L %</th>
            <th className="py-3 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Link href={`/research/${h.ticker}`} className="hover:text-blue-400 transition-colors">
                    <span className="font-semibold text-white">{h.ticker}</span>
                  </Link>
                  <span className="text-gray-500 text-xs hidden md:block truncate max-w-[140px]">{h.companyName}</span>
                </div>
                <span className="text-xs text-gray-600">{h.sector}</span>
              </td>
              <td className="py-3 px-4 text-right text-gray-300">{h.shares.toLocaleString()}</td>
              <td className="py-3 px-4 text-right text-gray-300">{formatCurrency(h.purchasePrice)}</td>
              <td className="py-3 px-4 text-right text-white font-medium">
                {h.currentPrice != null ? formatCurrency(h.currentPrice) : <Skeleton className="h-4 w-16 ml-auto" />}
              </td>
              <td className="py-3 px-4 text-right">
                {h.dayChangePercent != null ? (
                  <span className={cn('text-xs', gainLossColor(h.dayChangePercent))}>
                    {h.dayChangePercent >= 0 ? <TrendingUp className="h-3 w-3 inline mr-0.5" /> : <TrendingDown className="h-3 w-3 inline mr-0.5" />}
                    {formatPercent(h.dayChangePercent)}
                  </span>
                ) : '—'}
              </td>
              <td className="py-3 px-4 text-right text-white font-medium">
                {h.currentValue != null ? formatCurrency(h.currentValue) : '—'}
              </td>
              <td className={cn('py-3 px-4 text-right font-medium', gainLossColor(h.gainLoss ?? 0))}>
                {h.gainLoss != null ? (h.gainLoss >= 0 ? '+' : '') + formatCurrency(h.gainLoss) : '—'}
              </td>
              <td className={cn('py-3 px-4 text-right font-medium', gainLossColor(h.gainLossPercent ?? 0))}>
                {h.gainLossPercent != null ? formatPercent(h.gainLossPercent) : '—'}
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                    <Link href={`/research/${h.ticker}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:text-red-400 hover:bg-red-400/10"
                    onClick={() => handleDelete(h.id, h.ticker)}
                    disabled={deleting === h.id}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
