'use client'

import { useEffect, useState, useMemo } from 'react'
import { Calendar, Search, Clock, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import InfoTooltip from '@/components/InfoTooltip'
import LastUpdated from '@/components/LastUpdated'

interface EarningsItem {
  ticker: string
  companyName: string
  earningsDate: string
  daysUntil: number
  time?: string
  epsForecast?: string
  marketCap?: string
}

function getTimeBadge(time: string) {
  if (!time) return null
  const t = time.toLowerCase()
  if (t.includes('before') || t === 'bmo') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 600, color: '#60a5fa', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '4px', padding: '1px 6px' }}>
        <Clock size={9} /> BMO
      </span>
    )
  }
  if (t.includes('after') || t === 'amc') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 600, color: '#a78bfa', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '4px', padding: '1px 6px' }}>
        <Clock size={9} /> AMC
      </span>
    )
  }
  return null
}

function getDayBadge(daysUntil: number) {
  if (daysUntil === 0) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Today 🔔</Badge>
  if (daysUntil === 1) return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Tomorrow</Badge>
  if (daysUntil <= 7) return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">In {daysUntil} days</Badge>
  return <Badge className="bg-gray-700/50 text-gray-400 border-gray-600/50">In {daysUntil} days</Badge>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function groupByWeek(items: EarningsItem[]) {
  const thisWeek: EarningsItem[] = []
  const nextWeek: EarningsItem[] = []
  const later: EarningsItem[] = []
  for (const item of items) {
    if (item.daysUntil <= 6) thisWeek.push(item)
    else if (item.daysUntil <= 13) nextWeek.push(item)
    else later.push(item)
  }
  return { thisWeek, nextWeek, later }
}

function EarningsRow({ item }: { item: EarningsItem }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-800/40 transition-colors border-b border-gray-800 last:border-0">
      <div className="flex items-center gap-4 min-w-0">
        <span className="text-sm font-bold text-blue-400 w-16 shrink-0">{item.ticker}</span>
        <span className="text-sm text-gray-300 truncate hidden sm:block">{item.companyName}</span>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        {item.time && getTimeBadge(item.time)}
        <span className="text-xs text-gray-500 hidden md:block">{formatDate(item.earningsDate)}</span>
        {getDayBadge(item.daysUntil)}
      </div>
    </div>
  )
}

function EarningsSection({ title, items }: { title: string; items: EarningsItem[] }) {
  if (items.length === 0) return null
  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h2>
      <Card className="bg-gray-900 border-gray-800 overflow-hidden">
        <CardContent className="p-0">
          {items.map((item) => <EarningsRow key={`${item.ticker}-${item.earningsDate}`} item={item} />)}
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1].map((g) => (
        <div key={g}>
          <Skeleton className="h-4 w-24 mb-3 bg-gray-800" />
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-14 bg-gray-800" />
                    <Skeleton className="h-4 w-36 bg-gray-800" />
                  </div>
                  <Skeleton className="h-5 w-20 bg-gray-800" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<EarningsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/earnings')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) { setEarnings(data); setLastUpdated(new Date()) }
        else setError('Failed to load earnings data.')
      })
      .catch(() => setError('Failed to load earnings data.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return earnings
    const q = search.trim().toLowerCase()
    return earnings.filter(
      (e) => e.ticker.toLowerCase().includes(q) || e.companyName.toLowerCase().includes(q)
    )
  }, [earnings, search])

  const { thisWeek, nextWeek, later } = groupByWeek(filtered)
  const isSearching = search.trim().length > 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center shrink-0">
          <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-2">
            Earnings Calendar
            <InfoTooltip text="Every quarter, public companies release their financial results. These announcements often move stocks 10%+ in a single day." />
          </h1>
          <p className="text-sm text-gray-500">Upcoming earnings for the next 14 trading days</p>
          <LastUpdated time={lastUpdated} />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-5 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <Clock size={11} className="text-blue-400" />
          <span className="text-blue-400 font-medium">BMO</span> = Before Market Open
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={11} className="text-purple-400" />
          <span className="text-purple-400 font-medium">AMC</span> = After Market Close
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
        <Input
          placeholder="Search by ticker or company name..."
          className="pl-11 h-11 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {loading && <LoadingSkeleton />}

      {error && !loading && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-10 w-10 text-gray-700 mb-3" />
            <p className="text-gray-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* No search results */}
      {!loading && !error && isSearching && filtered.length === 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <Search className="h-10 w-10 text-gray-700 mb-3" />
            <p className="text-gray-300 font-medium">No results for &quot;{search}&quot;</p>
            <p className="text-gray-500 text-sm mt-1">
              This company may not have earnings in the next 14 days.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Search results — flat list, no grouping */}
      {!loading && !error && isSearching && filtered.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-3">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
          <Card className="bg-gray-900 border-gray-800 overflow-hidden">
            <CardContent className="p-0">
              {filtered.map((item) => <EarningsRow key={`${item.ticker}-${item.earningsDate}`} item={item} />)}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Normal grouped view */}
      {!loading && !error && !isSearching && earnings.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8 items-start">
          <div>
            <EarningsSection title="This Week" items={thisWeek} />
            <EarningsSection title="Next Week" items={nextWeek} />
          </div>
          <div>
            <EarningsSection title="Later" items={later} />
          </div>
        </div>
      )}

      {!loading && !error && earnings.length === 0 && !isSearching && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-10 w-10 text-gray-700 mb-3" />
            <p className="text-gray-300 font-medium">No upcoming earnings</p>
            <p className="text-gray-500 text-sm mt-1">No earnings reported for the next 14 days.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
