'use client'

import { useEffect, useState, useMemo } from 'react'
import { Calendar, Search, Clock, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/25 rounded px-1.5 py-0.5">
        <Clock size={9} /> BMO
      </span>
    )
  }
  if (t.includes('after') || t === 'amc') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/25 rounded px-1.5 py-0.5">
        <Clock size={9} /> AMC
      </span>
    )
  }
  return null
}

function formatDayLabel(iso: string, daysUntil: number) {
  const d = new Date(iso + 'T12:00:00Z')
  if (daysUntil === 0) return { day: 'Today', date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isToday: true }
  if (daysUntil === 1) return { day: 'Tomorrow', date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isToday: false }
  return {
    day: d.toLocaleDateString('en-US', { weekday: 'short' }),
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    isToday: false,
  }
}

function groupByDate(items: EarningsItem[]) {
  const map = new Map<string, EarningsItem[]>()
  for (const item of items) {
    if (!map.has(item.earningsDate)) map.set(item.earningsDate, [])
    map.get(item.earningsDate)!.push(item)
  }
  return map
}

function TimelineRow({ item }: { item: EarningsItem }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
      <span className="text-sm font-extrabold text-blue-500 w-14 shrink-0">{item.ticker}</span>
      <span className="text-sm text-gray-500 dark:text-gray-400 flex-1 truncate hidden sm:block">{item.companyName}</span>
      <div className="shrink-0">
        {item.time ? getTimeBadge(item.time) : null}
      </div>
    </div>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">{label}</span>
      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
      {[0, 1, 2].map((g) => (
        <div key={g}>
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-3 w-16 bg-gray-200 dark:bg-gray-800" />
            <Skeleton className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: g === 0 ? 3 : 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <Skeleton className="h-3 w-12 bg-gray-200 dark:bg-gray-800" />
                <Skeleton className="h-3 w-40 bg-gray-200 dark:bg-gray-800" />
                <Skeleton className="h-5 w-12 bg-gray-200 dark:bg-gray-800 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Timeline({ items }: { items: EarningsItem[] }) {
  const grouped = useMemo(() => groupByDate(items), [items])
  const dates = Array.from(grouped.keys()).sort()

  const nextWeekIdx = dates.findIndex((d) => (grouped.get(d)![0].daysUntil ?? 0) > 6)
  const laterIdx = dates.findIndex((d) => (grouped.get(d)![0].daysUntil ?? 0) > 13)

  return (
    <div className="space-y-0">
      {dates.map((dateKey, idx) => {
        const dayItems = grouped.get(dateKey)!
        const daysUntil = dayItems[0].daysUntil ?? 0
        const { day, date, isToday } = formatDayLabel(dateKey, daysUntil)
        const showNextWeek = idx === nextWeekIdx && nextWeekIdx > 0
        const showLater = idx === laterIdx && laterIdx > 0 && laterIdx !== nextWeekIdx

        return (
          <div key={dateKey}>
            {showNextWeek && <SectionDivider label="Next Week" />}
            {showLater && <SectionDivider label="Later" />}

            <div className="grid grid-cols-[88px_1fr] gap-x-4 mb-6">
              {/* Date label */}
              <div className="text-right pt-2 shrink-0">
                <div className={`text-xs font-bold ${isToday ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
                  {day}
                </div>
                <div className={`text-[10px] mt-0.5 ${isToday ? 'text-amber-400/70' : 'text-gray-400 dark:text-gray-600'}`}>
                  {date}
                </div>
              </div>

              {/* Companies */}
              <div className="relative">
                {/* Left border accent */}
                <div className={`absolute left-0 top-0 bottom-0 w-0.5 -ml-4 rounded-full ${isToday ? 'bg-amber-400' : 'bg-gray-200 dark:bg-gray-800'}`} />
                <div className="flex flex-col gap-2">
                  {dayItems.map((item) => (
                    <TimelineRow key={`${item.ticker}-${item.earningsDate}`} item={item} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}
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

  const isSearching = search.trim().length > 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center shrink-0">
          <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
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
          <span className="text-blue-500 font-medium">BMO</span> = Before Market Open
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={11} className="text-purple-400" />
          <span className="text-purple-500 font-medium">AMC</span> = After Market Close
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          placeholder="Search by ticker or company name..."
          className="pl-11 h-11 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {loading && <LoadingSkeleton />}

      {error && !loading && (
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-10 w-10 text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-gray-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* No search results */}
      {!loading && !error && isSearching && filtered.length === 0 && (
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <Search className="h-10 w-10 text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-gray-700 dark:text-gray-300 font-medium">No results for &quot;{search}&quot;</p>
            <p className="text-gray-500 text-sm mt-1">This company may not have earnings in the next 14 days.</p>
          </CardContent>
        </Card>
      )}

      {/* Search results */}
      {!loading && !error && isSearching && filtered.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-5">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
          <Timeline items={filtered} />
        </div>
      )}

      {/* Normal view */}
      {!loading && !error && !isSearching && earnings.length > 0 && (
        <Timeline items={earnings} />
      )}

      {!loading && !error && earnings.length === 0 && !isSearching && (
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-10 w-10 text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-gray-700 dark:text-gray-300 font-medium">No upcoming earnings</p>
            <p className="text-gray-500 text-sm mt-1">No earnings reported for the next 14 days.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
