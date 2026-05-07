'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Trade {
  name: string
  chamber: 'House' | 'Senate'
  party: string
  ticker: string
  assetDescription: string
  type: string
  amount: string
  transactionDate: string
  disclosureDate: string
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

function partyBadge(party: string) {
  const p = (party ?? '').trim().toUpperCase()
  if (p === 'D' || p === 'DEMOCRAT' || p === 'DEMOCRATIC')
    return <Badge className="text-[10px] px-1.5 py-0 bg-blue-600/20 text-blue-400 border border-blue-600/30 font-medium">D</Badge>
  if (p === 'R' || p === 'REPUBLICAN')
    return <Badge className="text-[10px] px-1.5 py-0 bg-red-600/20 text-red-400 border border-red-600/30 font-medium">R</Badge>
  return <Badge className="text-[10px] px-1.5 py-0 bg-gray-700/40 text-gray-400 border border-gray-700 font-medium">I</Badge>
}

function chamberBadge(chamber: 'House' | 'Senate') {
  return chamber === 'Senate'
    ? <Badge className="text-[10px] px-1.5 py-0 bg-purple-600/20 text-purple-400 border border-purple-600/30">Senate</Badge>
    : <Badge className="text-[10px] px-1.5 py-0 bg-teal-600/20 text-teal-400 border border-teal-600/30">House</Badge>
}

function typeBadge(type: string) {
  const t = (type ?? '').toLowerCase()
  const isPurchase = t.includes('purchase') || t === 'buy'
  return isPurchase
    ? <span className="text-[11px] font-medium text-emerald-400">{type}</span>
    : <span className="text-[11px] font-medium text-red-400">{type}</span>
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Congress Trades tab ──────────────────────────────────────────────────────

function CongressTrades() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/politicians')
      .then(r => r.json())
      .then(d => setTrades(d.trades ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <div className="flex gap-3 items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24 ml-auto" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (trades.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-12">No trade data available.</p>
  }

  return (
    <div className="space-y-1.5">
      {/* Header row */}
      <div className="hidden md:grid grid-cols-12 text-[10px] text-gray-600 uppercase tracking-wide px-4 pb-1 border-b border-gray-800">
        <span className="col-span-3">Member</span>
        <span className="col-span-1">Chamber</span>
        <span className="col-span-1">Ticker</span>
        <span className="col-span-3">Asset</span>
        <span className="col-span-1">Type</span>
        <span className="col-span-2 text-right">Amount</span>
        <span className="col-span-1 text-right">Date</span>
      </div>

      {trades.map((trade, i) => (
        <Card key={i} className="hover:bg-gray-800/30 transition-colors">
          <CardContent className="p-3 md:px-4">
            {/* Mobile layout */}
            <div className="flex flex-col gap-1.5 md:hidden">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-white">{trade.name}</span>
                {partyBadge(trade.party)}
                {chamberBadge(trade.chamber)}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/research/${trade.ticker}`} className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">
                  {trade.ticker}
                </Link>
                <span className="text-xs text-gray-400 truncate">{trade.assetDescription}</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                {typeBadge(trade.type)}
                <span>{trade.amount}</span>
                <span>{formatDate(trade.transactionDate)}</span>
              </div>
            </div>

            {/* Desktop layout */}
            <div className="hidden md:grid grid-cols-12 items-center gap-1">
              <div className="col-span-3 flex items-center gap-1.5 min-w-0">
                <span className="text-sm text-white truncate">{trade.name}</span>
                {partyBadge(trade.party)}
              </div>
              <div className="col-span-1">
                {chamberBadge(trade.chamber)}
              </div>
              <div className="col-span-1">
                <Link href={`/research/${trade.ticker}`} className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">
                  {trade.ticker}
                </Link>
              </div>
              <div className="col-span-3 text-xs text-gray-400 truncate pr-2">{trade.assetDescription}</div>
              <div className="col-span-1">{typeBadge(trade.type)}</div>
              <div className="col-span-2 text-right text-xs text-gray-400 font-mono">{trade.amount}</div>
              <div className="col-span-1 text-right text-xs text-gray-500">{formatDate(trade.transactionDate)}</div>
            </div>
          </CardContent>
        </Card>
      ))}

      <p className="text-xs text-gray-600 text-center pt-4 pb-2">
        Data sourced from House Stock Watcher and Senate Stock Watcher. Reflects mandatory disclosures.
      </p>
    </div>
  )
}

// ─── Famous Investors tab ─────────────────────────────────────────────────────

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
        Data sourced from SEC 13F filings via EDGAR. Updated quarterly. Holdings as of most recent filing date.
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
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-blue-600/15 border border-blue-600/20 flex items-center justify-center">
          <Users className="h-4 w-4 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Smart Money Tracker</h1>
          <p className="text-sm text-gray-400 mt-0.5">Congress disclosures and top investor 13F filings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-900 rounded-lg w-fit border border-gray-800">
        <button
          onClick={() => setActiveTab('congress')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'congress'
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Congress Trades
        </button>
        <button
          onClick={() => setActiveTab('investors')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'investors'
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Famous Investors
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'congress' ? <CongressTrades /> : <FamousInvestors />}
    </div>
  )
}
