'use client'

import { useEffect, useState } from 'react'
import { Bell, Trash2, Plus, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

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

interface PriceMap {
  [ticker: string]: number
}

type TabType = 'alert' | 'stop_loss'

function getPriceStatus(
  currentPrice: number | undefined,
  targetPrice: number,
  condition: 'above' | 'below'
): { pctAway: number | null; color: string; triggered: boolean } {
  if (currentPrice === undefined) {
    return { pctAway: null, color: 'text-gray-400', triggered: false }
  }
  const pctAway = ((currentPrice - targetPrice) / targetPrice) * 100
  const triggered =
    (condition === 'above' && currentPrice >= targetPrice) ||
    (condition === 'below' && currentPrice <= targetPrice)

  const absAway = Math.abs(pctAway)

  if (triggered) {
    return {
      pctAway,
      color: condition === 'above' ? 'text-green-400' : 'text-red-400',
      triggered: true,
    }
  }
  if (absAway <= 2) {
    return { pctAway, color: 'text-yellow-400', triggered: false }
  }
  return { pctAway, color: 'text-gray-400', triggered: false }
}

function AlertRow({
  alert,
  currentPrice,
  onDelete,
}: {
  alert: PriceAlert
  currentPrice: number | undefined
  onDelete: (id: string) => void
}) {
  const { pctAway, color, triggered } = getPriceStatus(
    currentPrice,
    alert.targetPrice,
    alert.condition
  )

  return (
    <div
      className={`flex items-center justify-between px-5 py-4 border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition-colors ${
        triggered ? 'bg-green-500/5' : ''
      }`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="min-w-[72px]">
          <span className="text-sm font-bold text-blue-400">{alert.ticker}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {alert.condition === 'above' ? (
            <ChevronUp className="h-4 w-4 text-green-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-red-400 flex-shrink-0" />
          )}
          <span className="text-sm text-gray-300">
            {alert.condition === 'above' ? 'Above' : 'Below'}{' '}
            <span className="font-semibold text-white">${alert.targetPrice.toFixed(2)}</span>
          </span>
        </div>

        {alert.note && (
          <span className="text-xs text-gray-500 truncate hidden md:block max-w-[160px]">
            {alert.note}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        {currentPrice !== undefined ? (
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">${currentPrice.toFixed(2)}</p>
            {pctAway !== null && (
              <p className={`text-xs ${color}`}>
                {pctAway > 0 ? '+' : ''}
                {pctAway.toFixed(2)}% from target
              </p>
            )}
          </div>
        ) : (
          <Skeleton className="h-8 w-20 bg-gray-800" />
        )}

        {triggered && (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hidden sm:flex">
            Triggered
          </Badge>
        )}

        {!triggered && pctAway !== null && Math.abs(pctAway) <= 2 && (
          <AlertTriangle className="h-4 w-4 text-yellow-400 hidden sm:block" />
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(alert.id)}
          className="text-gray-500 hover:text-red-400 hover:bg-red-400/10 h-8 w-8 p-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [prices, setPrices] = useState<PriceMap>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('alert')

  // Form state
  const [ticker, setTicker] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [condition, setCondition] = useState<'above' | 'below'>('above')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function fetchAlerts() {
    try {
      const res = await fetch('/api/alerts')
      if (!res.ok) return
      const data: PriceAlert[] = await res.json()
      setAlerts(data)
      // Fetch prices for unique tickers
      const unique = Array.from(new Set(data.map((a) => a.ticker)))
      await fetchPrices(unique)
    } finally {
      setLoading(false)
    }
  }

  async function fetchPrices(tickers: string[]) {
    if (tickers.length === 0) return
    try {
      const results = await Promise.allSettled(
        tickers.map((t) =>
          fetch(`/api/stock/${t}`)
            .then((r) => r.json())
            .then((d) => ({
              ticker: t,
              price: d?.quote?.regularMarketPrice ?? d?.price ?? null,
            }))
        )
      )
      const map: PriceMap = {}
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.price !== null) {
          map[r.value.ticker] = r.value.price
        }
      }
      setPrices((prev) => ({ ...prev, ...map }))
    } catch {
      // silently fail price fetches
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  async function handleDelete(id: string) {
    // Optimistic remove
    setAlerts((prev) => prev.filter((a) => a.id !== id))
    try {
      const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        // Revert on failure
        await fetchAlerts()
      }
    } catch {
      await fetchAlerts()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const price = parseFloat(targetPrice)
    if (!ticker.trim()) return setFormError('Ticker is required.')
    if (isNaN(price) || price <= 0) return setFormError('Enter a valid target price.')

    setSubmitting(true)
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: ticker.trim().toUpperCase(),
          targetPrice: price,
          condition,
          type: activeTab,
          note: note.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setFormError(err.error ?? 'Failed to create alert.')
        return
      }

      const created: PriceAlert = await res.json()
      setAlerts((prev) => [created, ...prev])
      setTicker('')
      setTargetPrice('')
      setNote('')

      // Fetch price for new ticker if not already cached
      if (prices[created.ticker] === undefined) {
        fetchPrices([created.ticker])
      }
    } catch {
      setFormError('Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = alerts.filter((a) => a.type === activeTab)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
          <Bell className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Price Alerts &amp; Stop Losses</h1>
          <p className="text-sm text-gray-500">
            Get notified when a stock hits your target price
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
        {(['alert', 'stop_loss'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab === 'alert' ? 'Price Alerts' : 'Stop Losses'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert list */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-200">
                {activeTab === 'alert' ? 'Price Alerts' : 'Stop Losses'}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filtered.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="divide-y divide-gray-800">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-14 bg-gray-800" />
                        <Skeleton className="h-4 w-32 bg-gray-800" />
                      </div>
                      <Skeleton className="h-8 w-24 bg-gray-800" />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <Bell className="h-9 w-9 text-gray-700 mb-3" />
                  <p className="text-gray-400 font-medium">No {activeTab === 'alert' ? 'price alerts' : 'stop losses'} yet</p>
                  <p className="text-gray-600 text-sm mt-1">Add one using the form on the right.</p>
                </div>
              ) : (
                <div>
                  {filtered.map((alert) => (
                    <AlertRow
                      key={alert.id}
                      alert={alert}
                      currentPrice={prices[alert.ticker]}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add alert form */}
        <div>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-200 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add {activeTab === 'alert' ? 'Alert' : 'Stop Loss'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="alert-ticker" className="text-gray-400 text-xs">
                    Ticker Symbol
                  </Label>
                  <Input
                    id="alert-ticker"
                    placeholder="e.g. AAPL"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 uppercase"
                    maxLength={10}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="alert-price" className="text-gray-400 text-xs">
                    Target Price ($)
                  </Label>
                  <Input
                    id="alert-price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-gray-400 text-xs">Condition</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCondition('above')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        condition === 'above'
                          ? 'bg-green-500/20 border-green-500/50 text-green-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                      Above
                    </button>
                    <button
                      type="button"
                      onClick={() => setCondition('below')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        condition === 'below'
                          ? 'bg-red-500/20 border-red-500/50 text-red-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                      Below
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="alert-note" className="text-gray-400 text-xs">
                    Note <span className="text-gray-600">(optional)</span>
                  </Label>
                  <Input
                    id="alert-note"
                    placeholder="e.g. Support level"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
                    maxLength={200}
                  />
                </div>

                {formError && (
                  <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">
                    {formError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                >
                  {submitting ? 'Adding…' : `Add ${activeTab === 'alert' ? 'Alert' : 'Stop Loss'}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center mt-6 pb-4 px-4">
        Price alerts are for informational and notification purposes only. Reaching a price target is not a signal to buy or sell. Not financial advice. Always do your own research before making any investment decision.
      </p>
    </div>
  )
}
