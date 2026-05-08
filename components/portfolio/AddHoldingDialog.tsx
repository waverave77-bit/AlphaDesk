'use client'
import { useState } from 'react'
import { Plus, Loader2, Trash2, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const SECTORS = [
  'Technology', 'Healthcare', 'Financials', 'Consumer Discretionary',
  'Consumer Staples', 'Energy', 'Industrials', 'Materials',
  'Real Estate', 'Utilities', 'Communication Services', 'Unknown',
]

interface Lot {
  id: number
  shares: string
  purchasePrice: string
  purchaseDate: string
}

interface AddHoldingDialogProps {
  onAdded: () => void
}

let lotId = 0
function newLot(): Lot {
  return { id: ++lotId, shares: '', purchasePrice: '', purchaseDate: '' }
}

export default function AddHoldingDialog({ onAdded }: AddHoldingDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ticker, setTicker] = useState('')
  const [sector, setSector] = useState('Technology')
  const [lots, setLots] = useState<Lot[]>([newLot()])
  const { toast } = useToast()

  const addLot = () => setLots((prev) => [...prev, newLot()])
  const removeLot = (id: number) => setLots((prev) => prev.length > 1 ? prev.filter((l) => l.id !== id) : prev)
  const updateLot = (id: number, field: keyof Lot, value: string) =>
    setLots((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l))

  const totalShares = lots.reduce((sum, l) => sum + (parseFloat(l.shares) || 0), 0)
  const avgPrice = lots.reduce((sum, l) => {
    const s = parseFloat(l.shares) || 0
    const p = parseFloat(l.purchasePrice) || 0
    return sum + s * p
  }, 0) / (totalShares || 1)

  const reset = () => {
    setTicker('')
    setSector('Technology')
    setLots([newLot()])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticker || lots.some((l) => !l.shares || !l.purchasePrice)) return

    setLoading(true)
    try {
      // Fetch company name once
      let companyName = ticker.toUpperCase()
      try {
        const res = await fetch(`/api/stock/${ticker.toUpperCase()}`)
        const data = await res.json()
        if (data.quote?.companyName) companyName = data.quote.companyName
      } catch {}

      // Submit all lots in parallel
      const results = await Promise.all(
        lots.map((lot) =>
          fetch('/api/portfolio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticker: ticker.toUpperCase(),
              companyName,
              sector,
              shares: lot.shares,
              purchasePrice: lot.purchasePrice,
              purchaseDate: lot.purchaseDate || new Date().toISOString().split('T')[0],
            }),
          })
        )
      )

      const failed = results.filter((r) => !r.ok).length
      if (failed > 0) throw new Error(`${failed} lot(s) failed`)

      toast({
        title: `${lots.length} lot${lots.length > 1 ? 's' : ''} added`,
        description: `${ticker.toUpperCase()} — ${totalShares.toLocaleString()} shares @ avg $${avgPrice.toFixed(2)}`,
      })
      setOpen(false)
      reset()
      onAdded()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to add holding', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Add Holding
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Stock Holding</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Ticker + Sector */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Ticker Symbol</Label>
              <Input
                placeholder="e.g. AAL"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sector</Label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="flex h-9 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
              >
                {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Lots */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-gray-400 text-xs uppercase tracking-wider">Purchase Lots</Label>
              {lots.length > 1 && (
                <span className="text-xs text-gray-500">
                  {totalShares.toLocaleString()} total shares · avg ${avgPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-[10px] text-gray-600 uppercase tracking-wide px-1">
              <span>Shares</span>
              <span>Price Paid ($)</span>
              <span>Date</span>
              <span className="w-8" />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {lots.map((lot, idx) => (
                <div key={lot.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                  <Input
                    type="number"
                    placeholder="100"
                    min="0.001"
                    step="any"
                    value={lot.shares}
                    onChange={(e) => updateLot(lot.id, 'shares', e.target.value)}
                    required
                    className="h-8 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="12.50"
                    min="0.01"
                    step="any"
                    value={lot.purchasePrice}
                    onChange={(e) => updateLot(lot.id, 'purchasePrice', e.target.value)}
                    required
                    className="h-8 text-sm"
                  />
                  <Input
                    type="date"
                    value={lot.purchaseDate}
                    onChange={(e) => updateLot(lot.id, 'purchaseDate', e.target.value)}
                    className="h-8 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeLot(lot.id)}
                    className="h-8 w-8 flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addLot}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors mt-1"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Add another lot
            </button>
          </div>

          {/* Summary when multiple lots */}
          {lots.length > 1 && totalShares > 0 && (
            <div className="rounded-lg bg-gray-800/60 border border-gray-700 px-4 py-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Shares</p>
                <p className="text-sm font-semibold text-white">{totalShares.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Avg Cost Basis</p>
                <p className="text-sm font-semibold text-white">${avgPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Invested</p>
                <p className="text-sm font-semibold text-white">${(totalShares * avgPrice).toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => { setOpen(false); reset() }}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Saving...' : `Save ${lots.length} Lot${lots.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
