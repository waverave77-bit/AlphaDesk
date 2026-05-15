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
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 600, color: '#60a5fa', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '4px', padding: '2px 7px' }}>
        <Clock size={9} /> BMO
      </span>
    )
  }
  if (t.includes('after') || t === 'amc') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 600, color: '#a78bfa', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '4px', padding: '2px 7px' }}>
        <Clock size={9} /> AMC
      </span>
    )
  }
  return null
}

function formatDayLabel(iso: string, daysUntil: number) {
  if (daysUntil === 0) return { day: 'Today', date: new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isToday: true }
  if (daysUntil === 1) return { day: 'Tomorrow', date: new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isToday: false }
  return {
    day: new Date(iso).toLocaleDateString('en-US', { weekday: 'short' }),
    date: new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    isToday: false,
  }
}

function groupByDate(items: EarningsItem[]) {
  const map = new Map<string, EarningsItem[]>()
  for (const item of items) {
    const key = item.earningsDate
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return map
}

function TimelineRow({ item }: { item: EarningsItem }) {
  return (
    <div style={{
      background: '#111827',
      border: '1px solid #1f2937',
      borderRadius: '10px',
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      transition: 'border-color 0.15s',
    }}
      className="hover:border-gray-600"
    >
      <span style={{ fontSize: '13px', fontWeight: 800, color: '#60a5fa', width: '52px', flexShrink: 0 }}>
        {item.ticker}
      </span>
      <span style={{ fontSize: '12px', color: '#9ca3af', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="hidden sm:block">
        {item.companyName}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {item.time && getTimeBadge(item.time)}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 0, maxWidth: '680px' }}>
      <div style={{ width: '2px', background: '#1f2937', margin: '6px 22px 0 82px', borderRadius: '2px', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, marginLeft: '-2px' }}>
        {[0, 1, 2].map((g) => (
          <div key={g} style={{ display: 'flex', gap: '16px', marginBottom: '24px', position: 'relative' }}>
            <div style={{ width: '72px', flexShrink: 0, paddingRight: '12px', paddingTop: '3px', textAlign: 'right' }}>
              <Skeleton className="h-3 w-10 ml-auto bg-gray-800 mb-1" />
              <Skeleton className="h-2.5 w-8 ml-auto bg-gray-800" />
            </div>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1f2937', flexShrink: 0, marginTop: '2px', position: 'relative', left: '-7px' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '-3px' }}>
              {Array.from({ length: g === 1 ? 2 : 1 }).map((_, i) => (
                <div key={i} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '10px', padding: '10px 14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Skeleton className="h-3 w-12 bg-gray-800" />
                  <Skeleton className="h-3 w-36 bg-gray-800" />
                  <Skeleton className="h-4 w-12 bg-gray-800 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Timeline({ items }: { items: EarningsItem[] }) {
  const grouped = useMemo(() => groupByDate(items), [items])
  const dates = Array.from(grouped.keys()).sort()

  // Find where "next week" starts (daysUntil > 6)
  const nextWeekIdx = dates.findIndex((d) => {
    const dayItems = grouped.get(d)!
    return dayItems[0].daysUntil > 6
  })
  const laterIdx = dates.findIndex((d) => {
    const dayItems = grouped.get(d)!
    return dayItems[0].daysUntil > 13
  })

  return (
    <div style={{ display: 'flex', gap: 0, maxWidth: '680px' }}>
      {/* Vertical line */}
      <div style={{ width: '2px', background: '#1f2937', margin: '6px 22px 0 82px', borderRadius: '2px', flexShrink: 0 }} />

      {/* Days */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, marginLeft: '-2px' }}>
        {dates.map((dateKey, idx) => {
          const dayItems = grouped.get(dateKey)!
          const { day, date, isToday } = formatDayLabel(dateKey, dayItems[0].daysUntil)

          const showNextWeekDivider = idx === nextWeekIdx && nextWeekIdx > 0
          const showLaterDivider = idx === laterIdx && laterIdx > 0 && laterIdx !== nextWeekIdx

          return (
            <div key={dateKey}>
              {showNextWeekDivider && (
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', paddingLeft: '3px' }}>
                  — Next Week —
                </div>
              )}
              {showLaterDivider && (
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', paddingLeft: '3px' }}>
                  — Later —
                </div>
              )}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', position: 'relative' }}>
                {/* Date label */}
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isToday ? '#fbbf24' : '#6b7280',
                  width: '72px',
                  flexShrink: 0,
                  paddingTop: '3px',
                  textAlign: 'right',
                  paddingRight: '12px',
                }}>
                  {day}
                  <br />
                  <span style={{ fontWeight: 500, fontSize: '10px', color: isToday ? '#92400e' : '#4b5563' }}>{date}</span>
                </div>

                {/* Dot */}
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: isToday ? '#f59e0b' : '#3b82f6',
                  boxShadow: isToday ? '0 0 0 4px rgba(245,158,11,0.2)' : 'none',
                  border: '2px solid #0a0a0f',
                  flexShrink: 0,
                  marginTop: '2px',
                  position: 'relative',
                  left: '-7px',
                }} />

                {/* Companies */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '-3px' }}>
                  {dayItems.map((item) => (
                    <TimelineRow key={`${item.ticker}-${item.earningsDate}`} item={item} />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
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
      <div className="relative mb-8">
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

      {/* Search results — flat timeline */}
      {!loading && !error && isSearching && filtered.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-5">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
          <Timeline items={filtered} />
        </div>
      )}

      {/* Normal timeline view */}
      {!loading && !error && !isSearching && earnings.length > 0 && (
        <Timeline items={earnings} />
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
