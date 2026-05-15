'use client'

import { useEffect, useState, useMemo } from 'react'
import { Calendar, Search, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react'
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
}

// ─── helpers ────────────────────────────────────────────────────────────────

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function getTimeBadge(time?: string) {
  if (!time) return null
  const t = time.toLowerCase()
  if (t.includes('before') || t === 'bmo')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/25 rounded px-1.5 py-0.5">
        <Clock size={9} /> BMO
      </span>
    )
  if (t.includes('after') || t === 'amc')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/25 rounded px-1.5 py-0.5">
        <Clock size={9} /> AMC
      </span>
    )
  return null
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

// ─── calendar grid ──────────────────────────────────────────────────────────

function CalendarGrid({
  year, month, earningsMap, selectedDate, onSelect,
}: {
  year: number
  month: number
  earningsMap: Map<string, EarningsItem[]>
  selectedDate: string | null
  onSelect: (d: string) => void
}) {
  const today = todayStr()
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[11px] font-semibold text-gray-400 dark:text-gray-500 py-2 uppercase tracking-wider">
            {w}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />

          const dateStr = toDateStr(year, month, day)
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate
          const items = earningsMap.get(dateStr)
          const hasEarnings = !!items?.length
          const isPast = dateStr < today
          const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6

          return (
            <button
              key={dateStr}
              onClick={() => hasEarnings ? onSelect(isSelected ? '' : dateStr) : undefined}
              disabled={!hasEarnings}
              className={[
                'relative flex flex-col items-center rounded-xl py-2.5 px-1 transition-all select-none',
                hasEarnings ? 'cursor-pointer' : 'cursor-default',
                isSelected
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105'
                  : isToday
                    ? 'bg-amber-500/15 ring-1 ring-amber-500/40 text-amber-600 dark:text-amber-400'
                    : hasEarnings
                      ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200'
                      : isPast || isWeekend
                        ? 'text-gray-300 dark:text-gray-700'
                        : 'text-gray-400 dark:text-gray-500',
              ].join(' ')}
            >
              <span className={`text-sm font-semibold leading-none ${isSelected ? 'text-white' : ''}`}>
                {day}
              </span>

              {/* Earnings dots */}
              {hasEarnings && (
                <div className="flex items-center gap-0.5 mt-1.5">
                  {(items!.length <= 3
                    ? items!
                    : items!.slice(0, 2)
                  ).map((item) => (
                    <div
                      key={item.ticker}
                      className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/80' : isToday ? 'bg-amber-500' : 'bg-blue-500'}`}
                    />
                  ))}
                  {items!.length > 3 && (
                    <span className={`text-[8px] font-bold ml-0.5 ${isSelected ? 'text-white/80' : 'text-blue-500'}`}>
                      +{items!.length - 2}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── detail panel ────────────────────────────────────────────────────────────

function DetailPanel({ date, items, onClose }: { date: string; items: EarningsItem[]; onClose: () => void }) {
  const d = new Date(date + 'T12:00:00Z')
  const isToday = date === todayStr()
  const label = isToday
    ? 'Today'
    : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 ${isToday ? 'bg-amber-50 dark:bg-amber-500/5' : ''}`}>
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${isToday ? 'text-amber-500' : 'text-gray-400'}`}>
            {isToday ? '🔔 Earnings Today' : 'Earnings'}
          </p>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{label}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{items.length} compan{items.length === 1 ? 'y' : 'ies'} reporting</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Company list */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {items.map((item) => (
          <div key={item.ticker} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <span className="text-sm font-extrabold text-blue-500 w-14 shrink-0">{item.ticker}</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 flex-1 truncate">{item.companyName}</span>
            <div className="shrink-0">{getTimeBadge(item.time)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── loading ─────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 35 }).map((_, i) => (
        <Skeleton key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800" />
      ))}
    </div>
  )
}

// ─── search results ───────────────────────────────────────────────────────────

function SearchResults({ items }: { items: EarningsItem[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, EarningsItem[]>()
    for (const item of items) {
      if (!map.has(item.earningsDate)) map.set(item.earningsDate, [])
      map.get(item.earningsDate)!.push(item)
    }
    return map
  }, [items])
  const dates = Array.from(grouped.keys()).sort()

  return (
    <div className="space-y-3">
      {dates.map((date) => {
        const d = new Date(date + 'T12:00:00Z')
        const isToday = date === todayStr()
        const dateLabel = isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        return (
          <div key={date}>
            <p className={`text-xs font-semibold mb-2 ${isToday ? 'text-amber-500' : 'text-gray-400'}`}>{dateLabel}</p>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              {grouped.get(date)!.map((item) => (
                <div key={item.ticker} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <span className="text-sm font-extrabold text-blue-500 w-14 shrink-0">{item.ticker}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex-1 truncate">{item.companyName}</span>
                  <div className="shrink-0">{getTimeBadge(item.time)}</div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<EarningsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const now = new Date()
  const [calMonth, setCalMonth] = useState({ year: now.getFullYear(), month: now.getMonth() })

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

  const earningsMap = useMemo(() => {
    const map = new Map<string, EarningsItem[]>()
    for (const item of earnings) {
      if (!map.has(item.earningsDate)) map.set(item.earningsDate, [])
      map.get(item.earningsDate)!.push(item)
    }
    return map
  }, [earnings])

  const filtered = useMemo(() => {
    if (!search.trim()) return earnings
    const q = search.trim().toLowerCase()
    return earnings.filter(
      (e) => e.ticker.toLowerCase().includes(q) || e.companyName.toLowerCase().includes(q)
    )
  }, [earnings, search])

  const isSearching = search.trim().length > 0
  const selectedItems = selectedDate ? (earningsMap.get(selectedDate) ?? []) : []

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
          <p className="text-sm text-gray-500">Click any highlighted date to see who's reporting</p>
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
        <span className="flex items-center gap-1.5">
          <span className="flex gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
          </span>
          = earnings on that day
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          placeholder="Search by ticker or company name..."
          className="pl-11 h-11 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 text-sm"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelectedDate(null) }}
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

      {/* Search results */}
      {isSearching && (
        <>
          {filtered.length === 0 ? (
            <Card className="border-gray-200 dark:border-gray-800">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                <Search className="h-10 w-10 text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-gray-700 dark:text-gray-300 font-medium">No results for &quot;{search}&quot;</p>
                <p className="text-gray-500 text-sm mt-1">This company may not have earnings in the next 14 days.</p>
              </CardContent>
            </Card>
          ) : (
            <div>
              <p className="text-xs text-gray-400 mb-4">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
              <SearchResults items={filtered} />
            </div>
          )}
        </>
      )}

      {/* Calendar */}
      {!isSearching && (
        <div className={`grid gap-6 ${selectedDate && selectedItems.length > 0 ? 'grid-cols-1 lg:grid-cols-[1fr_320px]' : 'grid-cols-1'}`}>
          {/* Calendar panel */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setCalMonth((m) => {
                  const d = new Date(m.year, m.month - 1)
                  return { year: d.getFullYear(), month: d.getMonth() }
                })}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {MONTHS[calMonth.month]} {calMonth.year}
              </h2>
              <button
                onClick={() => setCalMonth((m) => {
                  const d = new Date(m.year, m.month + 1)
                  return { year: d.getFullYear(), month: d.getMonth() }
                })}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : error ? (
              <p className="text-center text-gray-500 py-10">{error}</p>
            ) : (
              <CalendarGrid
                year={calMonth.year}
                month={calMonth.month}
                earningsMap={earningsMap}
                selectedDate={selectedDate}
                onSelect={(d) => setSelectedDate(d || null)}
              />
            )}

            {!loading && !error && (
              <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">
                {earningsMap.size} days with earnings in the next 14 trading days
              </p>
            )}
          </div>

          {/* Detail panel */}
          {selectedDate && selectedItems.length > 0 && (
            <DetailPanel
              date={selectedDate}
              items={selectedItems}
              onClose={() => setSelectedDate(null)}
            />
          )}
        </div>
      )}
    </div>
  )
}
