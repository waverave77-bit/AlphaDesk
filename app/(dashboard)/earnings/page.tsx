'use client'

import { useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface EarningsItem {
  ticker: string
  companyName: string
  earningsDate: string
  daysUntil: number
}

function getDayBadge(daysUntil: number) {
  if (daysUntil === 0) {
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Today</Badge>
  }
  if (daysUntil === 1) {
    return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Tomorrow</Badge>
  }
  return (
    <Badge className="bg-gray-700/50 text-gray-400 border-gray-600/50">
      {daysUntil}d
    </Badge>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
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

function EarningsSection({
  title,
  items,
}: {
  title: string
  items: EarningsItem[]
}) {
  if (items.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {title}
      </h2>
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <div className="divide-y divide-gray-800">
            {items.map((item) => (
              <div
                key={`${item.ticker}-${item.earningsDate}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="min-w-[64px]">
                    <span className="text-sm font-bold text-blue-400">{item.ticker}</span>
                  </div>
                  <span className="text-sm text-gray-300 truncate max-w-[200px] md:max-w-xs">
                    {item.companyName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 hidden sm:block">
                    {formatDate(item.earningsDate)}
                  </span>
                  {getDayBadge(item.daysUntil)}
                </div>
              </div>
            ))}
          </div>
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
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-14 bg-gray-800" />
                    <Skeleton className="h-4 w-36 bg-gray-800" />
                  </div>
                  <Skeleton className="h-5 w-16 bg-gray-800" />
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

  useEffect(() => {
    fetch('/api/earnings')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEarnings(data)
        } else {
          setError('Failed to load earnings data.')
        }
      })
      .catch(() => setError('Failed to load earnings data.'))
      .finally(() => setLoading(false))
  }, [])

  const { thisWeek, nextWeek, later } = groupByWeek(earnings)

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
          <Calendar className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Earnings Calendar</h1>
          <p className="text-sm text-gray-500">Upcoming earnings for major S&amp;P 500 companies</p>
        </div>
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

      {!loading && !error && earnings.length === 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-10 w-10 text-gray-700 mb-3" />
            <p className="text-gray-300 font-medium">No upcoming earnings</p>
            <p className="text-gray-500 text-sm mt-1">
              No earnings reported for the next 30 days.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && earnings.length > 0 && (
        <>
          <EarningsSection title="This Week" items={thisWeek} />
          <EarningsSection title="Next Week" items={nextWeek} />
          <EarningsSection title="Later This Month" items={later} />
        </>
      )}
    </div>
  )
}
