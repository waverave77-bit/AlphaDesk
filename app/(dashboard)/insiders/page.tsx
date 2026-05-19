'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import InfoTooltip from '@/components/InfoTooltip'
import LastUpdated from '@/components/LastUpdated'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Trade {
  name: string
  title: string
  company: string
  ticker: string
  type: string
  shares: number
  price: number
  totalValue: number
  transactionDate: string
  filingDate: string
  chamber?: string
}

interface Holding {
  name: string
  value: number
  shares: number
}

interface Investor {
  name: string
  cik: string
  filingDate: string | null
  topHoldings: Holding[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function typeBadge(type: string) {
  const isPurchase = type === 'Purchase'
  return isPurchase
    ? <span className="text-[11px] font-semibold text-emerald-400">▲ Purchase</span>
    : <span className="text-[11px] font-semibold text-red-400">▼ Sale</span>
}

function fmtVal(n: number) {
  if (!n || n === 0) return '—'
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K'
  return '$' + n.toFixed(0)
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Insider Trades tab ───────────────────────────────────────────────────────

function InsiderTrades() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetch('/api/politicians')
      .then(r => r.json())
      .then(d => setTrades(d.trades ?? []))
      .finally(() => { setLoading(false); setLastUpdated(new Date()) })
  }, [])

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <Card key={i}><CardContent className="p-3">
            <div className="flex gap-3 items-center">
              <Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" /><Skeleton className="h-4 w-24 ml-auto" />
            </div>
          </CardContent></Card>
        ))}
      </div>
    )
  }

  if (trades.length === 0) return <p className="text-sm text-gray-500 text-center py-12">No insider trade data available.</p>

  const sorted = [...trades].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
  const purchases = sorted.filter(t => t.type === 'Purchase').slice(0, 20)
  const sales = sorted.filter(t => t.type === 'Sale').slice(0, 20)

  const TradeTable = ({ rows }: { rows: Trade[] }) => (
    <div className="space-y-2">
      <div className="hidden md:grid grid-cols-12 text-xs text-gray-500 uppercase tracking-wide px-5 pb-2 border-b border-gray-800 font-semibold">
        <span className="col-span-2">Insider</span>
        <span className="col-span-2">Title</span>
        <span className="col-span-2">Company</span>
        <span className="col-span-1">Ticker</span>
        <span className="col-span-1 text-right">Shares</span>
        <span className="col-span-1 text-right">Price</span>
        <span className="col-span-1 text-right">Value</span>
        <span className="col-span-2 text-right">Date</span>
      </div>
      {rows.map((trade, i) => (
        <Card key={i} className="hover:bg-gray-800/30 transition-colors">
          <CardContent className="p-4 md:px-5">
            <div className="flex flex-col gap-1.5 md:hidden">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-semibold text-white">{trade.name}</span>
                <Badge variant="outline" className="text-xs px-2 py-0.5">{trade.chamber || trade.title || 'Director'}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/research/${trade.ticker}`} className="text-base font-bold text-blue-400 hover:text-blue-300">{trade.ticker}</Link>
                <span className="text-sm text-gray-400">{trade.company}</span>
              </div>
              <div className="flex gap-3 text-sm text-gray-500">
                <span>{trade.shares.toLocaleString()} shares</span>
                <span>{fmtVal(trade.totalValue)}</span>
                <span>{formatDate(trade.transactionDate)}</span>
              </div>
            </div>
            <div className="hidden md:grid grid-cols-12 items-center gap-1">
              <div className="col-span-2 text-white truncate text-sm font-medium">{trade.name}</div>
              <div className="col-span-2 text-gray-400 truncate text-sm">{trade.chamber || trade.title || 'Director'}</div>
              <div className="col-span-2 text-gray-400 truncate text-sm">{trade.company}</div>
              <div className="col-span-1">
                <Link href={`/research/${trade.ticker}`} className="font-bold text-blue-400 hover:text-blue-300 text-base">{trade.ticker}</Link>
              </div>
              <div className="col-span-1 text-right text-sm text-gray-400 font-mono">{trade.shares.toLocaleString()}</div>
              <div className="col-span-1 text-right text-sm text-gray-400 font-mono">{trade.price > 0 ? '$' + trade.price.toFixed(2) : '—'}</div>
              <div className="col-span-1 text-right text-sm font-mono font-semibold text-white">{fmtVal(trade.totalValue)}</div>
              <div className="col-span-2 text-right text-sm text-gray-500">{formatDate(trade.transactionDate)}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Purchases */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-400" />
          <h2 className="text-base font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">Recent Purchases <InfoTooltip text="Congressional members buying shares of a stock. Some analysts watch this data, but purchasing activity can reflect many motivations and is not a reliable buy signal." /></h2>
          <LastUpdated time={lastUpdated} />
        </div>
        {purchases.length > 0 ? <TradeTable rows={purchases} /> : <p className="text-sm text-gray-600">No recent purchases.</p>}
      </div>

      {/* Sales */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <h2 className="text-base font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">Recent Sales <InfoTooltip text="Congressional members selling shares. Sales can happen for many reasons — diversification, personal expenses, tax planning — and are not necessarily a bearish signal on their own." /></h2>
        </div>
        {sales.length > 0 ? <TradeTable rows={sales} /> : <p className="text-sm text-gray-600">No recent sales.</p>}
      </div>

      <p className="text-xs text-gray-600 text-center pb-2">
        Congressional stock trades from House &amp; Senate financial disclosures filed under the STOCK Act. Disclosures may be up to 45 days after the trade date. Not financial advice.
      </p>
    </div>
  )
}

// ─── Top Investors tab ─────────────────────────────────────────────────────

function InvestorCard({ investor }: { investor: Investor }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-400 shrink-0" />
            <p className="text-sm font-semibold text-white leading-tight">{investor.name}</p>
          </div>
          {investor.filingDate && (
            <Badge variant="outline" className="text-[10px] text-gray-500 border-gray-700 shrink-0 ml-2">
              13F {investor.filingDate}
            </Badge>
          )}
        </div>

        {investor.topHoldings.length === 0 ? (
          <p className="text-xs text-gray-600">Holdings data unavailable</p>
        ) : (
          <div className="space-y-1.5">
            <div className="grid grid-cols-12 text-[10px] text-gray-600 pb-1 border-b border-gray-800">
              <span className="col-span-1">#</span>
              <span className="col-span-6">Company</span>
              <span className="col-span-3 text-right">Value</span>
              <span className="col-span-2 text-right">Shares</span>
            </div>
            {investor.topHoldings.slice(0, 5).map((h, i) => (
              <div key={i} className="grid grid-cols-12 text-xs items-center py-0.5">
                <span className="col-span-1 text-gray-600">{i + 1}</span>
                <span className="col-span-6 text-gray-300 truncate pr-2">{h.name}</span>
                <span className="col-span-3 text-right text-gray-400 font-mono">${(h.value / 1000).toFixed(1)}M</span>
                <span className="col-span-2 text-right text-gray-600 font-mono">
                  {h.shares > 1e6 ? (h.shares / 1e6).toFixed(1) + 'M' : h.shares.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FamousInvestors() {
  const [investors, setInvestors] = useState<Investor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/famousinvestors')
      .then(r => r.json())
      .then(d => setInvestors(d.investors ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {investors.map(investor => (
          <InvestorCard key={investor.cik} investor={investor} />
        ))}
      </div>
      <p className="text-xs text-gray-600 text-center pt-6 pb-2">
        Data from SEC 13F filings via EDGAR. Filed quarterly, up to 45 days after quarter-end — holdings shown may be 3–6 months old and may no longer reflect current positions. Not financial advice.
      </p>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'congress' | 'investors'

export default function InsidersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('congress')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-blue-600/15 border border-blue-600/20 flex items-center justify-center">
          <Users className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">Smart Money Tracker <InfoTooltip text="Tracks congressional stock trades (STOCK Act disclosures) and top fund manager holdings (SEC 13F filings). All data is publicly reported. This is informational only — not a buy or sell signal." /></h1>
          <p className="text-base text-gray-400 mt-0.5">Congressional stock trades and top investor quarterly 13F disclosures</p>
        </div>
      </div>

      {/* Why it matters */}
      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-5">
        <p className="text-base font-semibold text-emerald-300 mb-1.5">Why does this matter?</p>
        <p className="text-sm text-gray-400 leading-relaxed">
          The &quot;Insider Trades&quot; tab shows <strong className="text-gray-300">congressional stock trades</strong> — members of Congress are required to disclose trades within 45 days. The &quot;Top Investors&quot; tab shows quarterly 13F filings from well-known fund managers. Neither tab shows traditional corporate insider (CEO/CFO) trades. This data is for informational purposes only — it is not a buy or sell signal, and should not be the basis for any investment decision.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-900 rounded-lg w-fit border border-gray-800">
        <button
          onClick={() => setActiveTab('congress')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'congress'
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Congressional Trades <InfoTooltip text="Stock trades disclosed by members of Congress under the STOCK Act. Disclosures can be up to 45 days after the trade — data may not reflect the most current positions." />
        </button>
        <button
          onClick={() => setActiveTab('investors')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'investors'
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Top Investors <InfoTooltip text="Top holdings from notable fund managers, sourced from 13F filings with the SEC. 13Fs are filed quarterly and can be up to 45 days after quarter-end — holdings may be months old and may no longer reflect current positions." />
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'congress' ? <InsiderTrades /> : <FamousInvestors />}
    </div>
  )
}
