'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Bell, Trash2, Plus, AlertTriangle, TrendingUp, TrendingDown, ChevronUp, ChevronDown, X, Check } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { GuestLock } from '@/components/GuestGate'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, cn } from '@/lib/utils'

interface PriceAlert {
  id: string
  ticker: string
  targetPrice: number
  condition: 'above' | 'below'
  type: 'alert' | 'stop_loss'
  note: string | null
  triggered: boolean
  createdAt: string
}

// ── Skeleton component ────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-800/60 ${className ?? ''}`} />
}

// ── Alert card ────────────────────────────────────────────────────────────────
function AlertCard({
  alert,
  onDelete,
}: {
  alert: PriceAlert
  onDelete: (id: string) => Promise<void>
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleFirstClick = () => setConfirmDelete(true)
  const handleCancel = () => setConfirmDelete(false)
  const handleConfirm = async () => {
    setDeleting(true)
    await onDelete(alert.id)
    setDeleting(false)
    setConfirmDelete(false)
  }

  const isAbove = alert.condition === 'above'
  const isStopLoss = alert.type === 'stop_loss'

  return (
    <Card
      className={cn(
        'transition-all group',
        alert.triggered
          ? 'border-green-800/50 bg-green-950/20 hover:border-green-700/60'
          : 'hover:border-gray-700 hover:bg-gray-800/30',
        deleting && 'opacity-50 scale-[0.99] pointer-events-none'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: icon + details */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn(
              'rounded-full p-2 shrink-0 mt-0.5',
              alert.triggered
                ? 'bg-green-500/15 border border-green-500/25'
                : isStopLoss
                  ? 'bg-red-500/15 border border-red-500/25'
                  : 'bg-blue-500/15 border border-blue-500/25'
            )}>
              {alert.triggered ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : isStopLoss ? (
                <AlertTriangle className="h-4 w-4 text-red-400" />
              ) : isAbove ? (
                <ChevronUp className="h-4 w-4 text-blue-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-blue-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/research/${alert.ticker}`}
                  className="font-semibold text-white hover:text-blue-400 transition-colors"
                >
                  {alert.ticker}
                </Link>
                <span className={cn(
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                  isStopLoss
                    ? 'bg-red-500/10 border-red-500/25 text-red-400'
                    : 'bg-blue-500/10 border-blue-500/25 text-blue-400'
                )}>
                  {isStopLoss ? 'Stop Loss' : 'Price Alert'}
                </span>
                {alert.triggered && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/25 text-green-400">
                    Triggered
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-300 mt-1">
                Alert when price goes{' '}
                <span className={cn(
                  'font-semibold',
                  isAbove ? 'text-green-400' : 'text-red-400'
                )}>
                  {isAbove ? 'above' : 'below'}
                </span>{' '}
                <span className="font-semibold text-white">{formatCurrency(alert.targetPrice)}</span>
              </p>

              {alert.note && (
                <p className="text-xs text-gray-500 mt-1 truncate">{alert.note}</p>
              )}

              <p className="text-[10px] text-gray-600 mt-1.5">
                Created {new Date(alert.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Right: condition badge + delete */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border',
              isAbove
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            )}>
              {isAbove
                ? <TrendingUp className="h-3 w-3" />
                : <TrendingDown className="h-3 w-3" />
              }
              {isAbove ? 'Above' : 'Below'} {formatCurrency(alert.targetPrice)}
            </div>

            {/* Two-step delete */}
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-gray-200 active:scale-95 transition-all"
                  onClick={handleCancel}
                  title="Cancel"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/15 active:scale-95 transition-all"
                  onClick={handleConfirm}
                  disabled={deleting}
                  title="Confirm delete"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-400/10 active:scale-95 transition-all"
                onClick={handleFirstClick}
                title="Delete alert"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Confirm banner */}
        {confirmDelete && (
          <div className="mt-3 pt-3 border-t border-red-800/40 flex items-center justify-between">
            <p className="text-xs text-red-400 font-medium">Delete this alert?</p>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCancel}
                className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={deleting}
                className="text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1 rounded hover:bg-red-500/10 transition-colors active:scale-95"
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AlertsPage() {
  const { data: session, status } = useSession()
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'triggered'>('all')
  const { toast } = useToast()

  if (status !== 'loading' && !session) return <GuestLock feature="your Price Alerts" />

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/alerts')
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts ?? [])
      }
    } catch {
      // silently fail — empty state will show
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAlerts() }, [fetchAlerts])

  const deleteAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setAlerts(prev => prev.filter(a => a.id !== id))
        toast({ title: 'Alert deleted' })
      } else {
        toast({ title: 'Failed to delete', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error deleting alert', variant: 'destructive' })
    }
  }

  const filtered = alerts.filter(a => {
    if (filter === 'active') return !a.triggered
    if (filter === 'triggered') return a.triggered
    return true
  })

  const activeCount = alerts.filter(a => !a.triggered).length
  const triggeredCount = alerts.filter(a => a.triggered).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-400" />
            Price Alerts
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Get notified when stocks hit your target prices</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 active:scale-95 transition-transform border-gray-700 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400"
          asChild
        >
          <Link href="/research">
            <Plus className="h-4 w-4 mr-1" />
            Add Alert
          </Link>
        </Button>
      </div>

      {/* Filter tabs */}
      {!loading && alerts.length > 0 && (
        <div className="flex gap-1 border-b border-gray-800">
          {([
            { key: 'all', label: `All (${alerts.length})` },
            { key: 'active', label: `Active (${activeCount})` },
            { key: 'triggered', label: `Triggered (${triggeredCount})` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                filter === key
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-5 animate-pulse">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-10 w-10 rounded-full bg-gray-800/60 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-40 rounded bg-gray-800/60" />
                    <div className="h-3 w-64 max-w-full rounded bg-gray-800/60" />
                    <div className="h-3 w-20 rounded bg-gray-800/60" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="h-6 w-24 rounded-full bg-gray-800/60" />
                  <div className="h-7 w-7 rounded-md bg-gray-800/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        /* Empty state — no alerts at all */
        <Card>
          <CardContent className="flex flex-col items-center py-20 text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl scale-150" />
              <div className="relative rounded-full bg-gray-800/80 p-5 border border-gray-700/50">
                <Bell className="h-10 w-10 text-gray-500" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-gray-300 font-semibold text-lg">No alerts yet</p>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Set a price target on any stock and we&apos;ll alert you when it gets there
              </p>
            </div>
            <Button
              variant="outline"
              className="mt-2 active:scale-95 transition-transform border-gray-700 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400"
              asChild
            >
              <Link href="/research">
                <Plus className="h-4 w-4 mr-1" />
                Find a Stock
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        /* Empty state — filter yields nothing */
        <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
          <AlertTriangle className="h-8 w-8 text-gray-600" />
          <p className="text-gray-400 font-medium">
            No {filter} alerts
          </p>
          <button
            onClick={() => setFilter('all')}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors active:scale-95"
          >
            View all alerts
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => (
            <AlertCard key={alert.id} alert={alert} onDelete={deleteAlert} />
          ))}
        </div>
      )}

      <p className="text-xs text-gray-600 text-center mt-6 pb-4 px-4">
        Price alerts are for informational purposes only. Not financial advice.
      </p>
    </div>
  )
}
