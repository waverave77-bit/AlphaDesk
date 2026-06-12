'use client'

import { useEffect, useState } from 'react'
import { Activity, Info } from 'lucide-react'
import LastUpdated from '@/components/LastUpdated'
import { Skeleton } from '@/components/ui/skeleton'
import InfoTooltip from '@/components/InfoTooltip'
import { cn } from '@/lib/utils'

// ─── Arcade style tokens ──────────────────────────────────────────────────────
const CARD = 'rounded-2xl border-2 border-[#16130a] shadow-[4px_4px_0_#16130a] dark:border-gray-700 dark:shadow-none bg-white dark:bg-gray-900'
const H2 = 'font-display uppercase text-lg lg:text-xl text-[#16130a] dark:text-white mb-4 flex items-center gap-2 flex-wrap'
const LABEL = 'font-mono font-bold text-[10px] uppercase tracking-widest text-[#16130a]/40 dark:text-gray-500'

// ─── Fear & Greed ─────────────────────────────────────────────────────────────

interface HistoryPoint { value: number; rating: string; timestamp: number }

interface FngResponse {
  score?: number
  rating?: string
  history?: HistoryPoint[]
}

function getFngColor(value: number): string {
  if (value <= 25) return 'text-red-600 dark:text-red-400'
  if (value <= 45) return 'text-orange-600 dark:text-orange-400'
  if (value <= 55) return 'text-yellow-600 dark:text-yellow-400'
  if (value <= 75) return 'text-green-600 dark:text-green-400'
  return 'text-emerald-600 dark:text-emerald-400'
}

function getFngRing(value: number): string {
  if (value <= 25) return 'border-red-500 bg-red-500/10'
  if (value <= 45) return 'border-orange-500 bg-orange-500/10'
  if (value <= 55) return 'border-yellow-500 bg-yellow-500/10'
  if (value <= 75) return 'border-green-500 bg-green-500/10'
  return 'border-emerald-500 bg-emerald-500/10'
}

function getFngLabel(value: number): string {
  if (value <= 25) return 'Extreme Fear'
  if (value <= 45) return 'Fear'
  if (value <= 55) return 'Neutral'
  if (value <= 75) return 'Greed'
  return 'Extreme Greed'
}

function getFngTradeNote(value: number): string {
  if (value <= 25)
    return 'Markets are in extreme fear — investors are broadly pessimistic. Historically, extreme fear has sometimes preceded recoveries, but it has also coincided with prolonged downturns. This is not a buy signal.'
  if (value <= 45)
    return 'Fear is elevated. Investors are cautious and selling pressure has been notable. Sentiment alone is not a reliable timing tool — market conditions can stay fearful for extended periods.'
  if (value <= 55)
    return 'Sentiment is roughly neutral. No strong directional signal from the crowd. This is a quantitative sentiment gauge, not a forecast.'
  if (value <= 75)
    return 'Greed is building. Investors are generally optimistic. Elevated greed has historically been associated with higher valuations and sometimes increased pullback risk, though timing any move based on sentiment is unreliable.'
  return 'Extreme greed. Market sentiment is highly euphoric. Historically, extreme greed has sometimes preceded corrections, but markets can remain in greed territory for extended periods. This is a sentiment gauge only — not a recommendation to buy or sell.'
}

function FearGreedSection() {
  const [latestValue, setLatestValue] = useState<number | null>(null)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetch('/api/fear-greed')
      .then((r) => r.json())
      .then((d: FngResponse) => {
        if (typeof d?.score === 'number') {
          setLatestValue(Math.round(d.score))
          setHistory(d.history ?? [])
          setLastUpdated(new Date())
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="mb-10">
      <h2 className={H2}>Fear &amp; Greed Index <InfoTooltip text="A score from 0–100 measuring overall investor sentiment — whether the crowd is fearful (selling) or greedy (buying). It is a sentiment gauge only, not a buy or sell signal. Extreme readings have sometimes preceded reversals, but timing the market based on sentiment alone is unreliable." /><LastUpdated time={lastUpdated} className="ml-2" /></h2>
      <div className={cn(CARD, 'p-6')}>
        {loading ? (
          <div className="flex items-center gap-6">
            <Skeleton className="h-28 w-28 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        ) : latestValue === null ? (
          <p className="text-[#16130a]/50 dark:text-gray-500 text-sm">Unable to load Fear &amp; Greed data.</p>
        ) : (
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Big gauge circle */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={cn('h-28 w-28 rounded-full border-[6px] flex flex-col items-center justify-center', getFngRing(latestValue))}>
                <span className={cn('font-mono font-bold text-4xl', getFngColor(latestValue))}>
                  {latestValue}
                </span>
                <span className="font-mono text-[10px] text-[#16130a]/40 dark:text-gray-500 mt-0.5">/ 100</span>
              </div>
              <span className={cn('mt-2 font-mono font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-full border-2', getFngRing(latestValue), getFngColor(latestValue))}>
                {getFngLabel(latestValue)}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <p className="text-sm text-[#16130a]/70 dark:text-gray-400 leading-relaxed mb-4">
                {getFngTradeNote(latestValue)}
              </p>

              {/* 7-day trend */}
              {history.length > 0 && (
                <div>
                  <p className={cn(LABEL, 'mb-2')}>Last 7 days</p>
                  <div className="flex gap-2 flex-wrap">
                    {history.map((p, i) => {
                      const date = new Date(p.timestamp * 1000).toLocaleDateString(
                        'en-US',
                        { month: 'short', day: 'numeric' }
                      )
                      return (
                        <div
                          key={i}
                          className="flex flex-col items-center rounded-lg border-2 border-[#16130a]/10 dark:border-gray-700 px-2 py-1.5 min-w-[48px]"
                          title={`${date}: ${p.rating}`}
                        >
                          <span className={cn('font-mono font-bold text-sm', getFngColor(p.value))}>
                            {p.value}
                          </span>
                          <span className="text-[10px] text-[#16130a]/40 dark:text-gray-600">{date}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Scale legend */}
            <div className="flex-shrink-0 hidden lg:block">
              <p className={cn(LABEL, 'mb-2')}>Scale</p>
              <div className="space-y-1.5 text-xs">
                {[
                  { range: '0–25', label: 'Extreme Fear', cls: 'text-red-600 dark:text-red-400' },
                  { range: '26–45', label: 'Fear', cls: 'text-orange-600 dark:text-orange-400' },
                  { range: '46–55', label: 'Neutral', cls: 'text-yellow-600 dark:text-yellow-400' },
                  { range: '56–75', label: 'Greed', cls: 'text-green-600 dark:text-green-400' },
                  { range: '76–100', label: 'Extreme Greed', cls: 'text-emerald-600 dark:text-emerald-400' },
                ].map(({ range, label, cls }) => (
                  <div key={range} className="flex items-center gap-2">
                    <span className="font-mono text-[#16130a]/40 dark:text-gray-600 w-12">{range}</span>
                    <span className={cn('font-mono font-bold', cls)}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Sector Heatmap ───────────────────────────────────────────────────────────

interface SectorData {
  symbol: string
  name: string
  changePercent: number
  price: number
}

function getSectorBg(pct: number): string {
  if (pct >= 2) return 'bg-green-500/30 border-green-600/50 dark:border-green-500/40'
  if (pct >= 1) return 'bg-green-500/20 border-green-600/40 dark:border-green-500/30'
  if (pct >= 0.25) return 'bg-green-500/12 border-green-600/30 dark:border-green-500/20'
  if (pct > -0.25) return 'bg-[#16130a]/5 dark:bg-gray-800 border-[#16130a]/15 dark:border-gray-700'
  if (pct > -1) return 'bg-red-500/12 border-red-600/30 dark:border-red-500/20'
  if (pct > -2) return 'bg-red-500/20 border-red-600/40 dark:border-red-500/30'
  return 'bg-red-500/30 border-red-600/50 dark:border-red-500/40'
}

function getSectorTextColor(pct: number): string {
  if (pct >= 0.25) return 'text-green-700 dark:text-green-400'
  if (pct > -0.25) return 'text-[#16130a]/60 dark:text-gray-400'
  return 'text-red-700 dark:text-red-400'
}

function SectorHeatmapSection() {
  const [sectors, setSectors] = useState<SectorData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetch('/api/sectorheatmap')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) { setSectors(d); setLastUpdated(new Date()) }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="mb-10">
      <h2 className={H2}>Sector Heat Map <InfoTooltip text="Shows how each sector of the stock market performed today. Green = up, Red = down. Darker color = bigger move." /><LastUpdated time={lastUpdated} className="ml-2" /></h2>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 11 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : sectors.length === 0 ? (
        <div className={cn(CARD, 'py-10 text-center')}>
          <p className="text-[#16130a]/50 dark:text-gray-500 text-sm">Unable to load sector data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {sectors.map((s) => (
            <div
              key={s.symbol}
              className={cn('rounded-xl border-2 px-3 py-3 flex flex-col justify-between', getSectorBg(s.changePercent))}
            >
              <span className="text-xs font-bold text-[#16130a]/80 dark:text-gray-300 leading-tight">{s.name}</span>
              <div className="mt-2">
                <p className={cn('font-mono font-bold text-base', getSectorTextColor(s.changePercent))}>
                  {s.changePercent >= 0 ? '+' : ''}
                  {s.changePercent.toFixed(2)}%
                </p>
                <p className="font-mono text-xs text-[#16130a]/40 dark:text-gray-600">${s.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ─── Economic Calendar ────────────────────────────────────────────────────────

interface EconEvent {
  date: string // YYYY-MM-DD
  name: string
  importance: 'High' | 'Medium'
  impact: string
}

const ECON_EVENTS: EconEvent[] = [
  // May events (already past — filtered out by date logic)
  { date: '2026-05-01', name: 'Jobs Report (April) · Est.', importance: 'High', impact: 'Non-Farm Payrolls; key labor market indicator affecting Fed policy.' },
  { date: '2026-05-05', name: 'FOMC Meeting (Day 1) · Est.', importance: 'High', impact: 'Federal Reserve begins two-day policy meeting.' },
  { date: '2026-05-06', name: 'FOMC Meeting (Day 2 + Decision) · Est.', importance: 'High', impact: 'Fed rate decision and press conference. Markets move sharply on surprises.' },
  { date: '2026-05-13', name: 'CPI (April) · Est.', importance: 'High', impact: 'Consumer Price Index; primary inflation gauge influencing Fed rate path.' },
  // June
  { date: '2026-06-05', name: 'Jobs Report (May) · Est.', importance: 'High', impact: 'Non-Farm Payrolls; labor market health indicator.' },
  { date: '2026-06-10', name: 'CPI (May) · Est.', importance: 'High', impact: 'Inflation data; heavily watched by the Fed and bond markets.' },
  { date: '2026-06-16', name: 'FOMC Meeting (Day 1) · Est.', importance: 'High', impact: 'Federal Reserve begins two-day policy meeting.' },
  { date: '2026-06-17', name: 'FOMC Meeting (Day 2 + Decision) · Est.', importance: 'High', impact: 'Fed rate decision and updated dot plot projections.' },
  // July
  { date: '2026-07-03', name: 'Jobs Report (June) · Est.', importance: 'High', impact: 'Non-Farm Payrolls; labor market data.' },
  { date: '2026-07-15', name: 'CPI (June) · Est.', importance: 'High', impact: 'Mid-year inflation check; critical for second-half rate expectations.' },
  { date: '2026-07-28', name: 'FOMC Meeting (Day 1) · Est.', importance: 'High', impact: 'Federal Reserve begins two-day policy meeting.' },
  { date: '2026-07-29', name: 'FOMC Meeting (Day 2 + Decision) · Est.', importance: 'High', impact: 'Fed rate decision. Mid-year inflection point for markets.' },
  // August
  { date: '2026-08-07', name: 'Jobs Report (July) · Est.', importance: 'High', impact: 'Non-Farm Payrolls; summer labor market reading.' },
  { date: '2026-08-12', name: 'CPI (July) · Est.', importance: 'High', impact: 'Inflation data ahead of Jackson Hole symposium.' },
  // September
  { date: '2026-09-04', name: 'Jobs Report (August) · Est.', importance: 'High', impact: 'Non-Farm Payrolls; pre-September FOMC data.' },
  { date: '2026-09-10', name: 'CPI (August) · Est.', importance: 'High', impact: 'Final inflation print before September FOMC meeting.' },
  { date: '2026-09-15', name: 'FOMC Meeting (Day 1) · Est.', importance: 'High', impact: 'Federal Reserve begins two-day policy meeting.' },
  { date: '2026-09-16', name: 'FOMC Meeting (Day 2 + Decision) · Est.', importance: 'High', impact: 'September rate decision; new economic projections released.' },
  // October
  { date: '2026-10-02', name: 'Jobs Report (September) · Est.', importance: 'High', impact: 'Non-Farm Payrolls; Q3 labor market summary.' },
  { date: '2026-10-14', name: 'CPI (September) · Est.', importance: 'High', impact: 'Q3 inflation summary; shapes Q4 rate expectations.' },
  { date: '2026-10-27', name: 'FOMC Meeting (Day 1) · Est.', importance: 'High', impact: 'Federal Reserve begins two-day policy meeting.' },
  { date: '2026-10-28', name: 'FOMC Meeting (Day 2 + Decision) · Est.', importance: 'High', impact: 'October rate decision heading into year-end.' },
  // November
  { date: '2026-11-06', name: 'Jobs Report (October) · Est.', importance: 'High', impact: 'Non-Farm Payrolls; early Q4 labor market data.' },
  { date: '2026-11-12', name: 'CPI (October) · Est.', importance: 'High', impact: 'Inflation data; sets tone for December FOMC.' },
  // December
  { date: '2026-12-04', name: 'Jobs Report (November) · Est.', importance: 'High', impact: 'Non-Farm Payrolls; final major labor print of 2026.' },
  { date: '2026-12-08', name: 'FOMC Meeting (Day 1) · Est.', importance: 'High', impact: 'Federal Reserve begins final two-day meeting of the year.' },
  { date: '2026-12-09', name: 'FOMC Meeting (Day 2 + Decision) · Est.', importance: 'High', impact: 'Final rate decision of 2026; year-end dot plot and projections.' },
  { date: '2026-12-11', name: 'CPI (November) · Est.', importance: 'High', impact: 'Final CPI print of 2026; follows December FOMC decision.' },
]

function EconCalendarSection() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000

  const upcoming = ECON_EVENTS.filter((e) => {
    const d = new Date(e.date + 'T00:00:00')
    return d >= today
  }).sort((a, b) => a.date.localeCompare(b.date))

  function formatEventDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function isWithinWeek(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.getTime() - today.getTime() <= sevenDaysMs
  }

  return (
    <section className="mb-10">
      <h2 className={cn(H2, 'mb-2')}>Economic Calendar 2026 <InfoTooltip text="Upcoming events that can move stock prices, like jobs reports, inflation data, and interest rate decisions by the Federal Reserve. Dates are estimates based on historical scheduling and may shift — verify exact dates at federalreserve.gov or bls.gov before trading around them." /></h2>
      <p className="text-xs text-[#16130a]/50 dark:text-gray-600 mb-4">Dates are approximate. Verify at <a href="https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#16130a] dark:hover:text-gray-400">federalreserve.gov</a> · <a href="https://www.bls.gov/schedule/2026/home.htm" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#16130a] dark:hover:text-gray-400">bls.gov</a></p>
      <div className={cn(CARD, 'p-0 overflow-hidden')}>
        {upcoming.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[#16130a]/50 dark:text-gray-500 text-sm">No upcoming economic events.</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-[#16130a]/8 dark:divide-gray-800">
            {upcoming.map((event) => {
              const soon = isWithinWeek(event.date)
              return (
                <div
                  key={`${event.date}-${event.name}`}
                  className={cn('flex items-start justify-between px-5 py-4 hover:bg-[#fff8e1] dark:hover:bg-gray-800/30 transition-colors',
                    soon ? 'bg-yellow-500/10 dark:bg-yellow-500/5' : '')}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 min-w-[140px]">
                      <p className={cn('font-mono font-bold text-sm', soon ? 'text-yellow-700 dark:text-yellow-400' : 'text-[#16130a]/70 dark:text-gray-300')}>
                        {formatEventDate(event.date)}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-[#16130a] dark:text-white">{event.name}</p>
                        {soon && (
                          <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 border-2 border-yellow-500/50 text-yellow-700 dark:text-yellow-400">
                            Soon
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#16130a]/55 dark:text-gray-500 mt-0.5 leading-relaxed">
                        {event.impact}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <span className={cn('font-mono font-bold text-[10px] px-2 py-0.5 rounded-full border-2',
                      event.importance === 'High'
                        ? 'bg-red-500/15 border-red-600/40 text-red-600 dark:text-red-400'
                        : 'bg-blue-500/15 border-blue-600/40 text-[#2563eb] dark:text-blue-400')}>
                      {event.importance}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Market News ──────────────────────────────────────────────────────────────

interface NewsArticle {
  title: string
  link: string
  pubDate: string
  source: string
}

function relativeTime(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function MarketNewsSection() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetch('/api/news/market')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.articles)) { setArticles(d.articles.slice(0, 20)); setLastUpdated(new Date()) }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="mb-10">
      <h2 className={H2}>
        Live Market News{' '}
        <InfoTooltip text="Latest financial news from major sources. May be cached for a few minutes." />
        <LastUpdated time={lastUpdated} className="ml-2" />
      </h2>
      <div className={cn(CARD, 'p-0 overflow-hidden')}>
        {loading ? (
          <div className="divide-y-2 divide-[#16130a]/8 dark:divide-gray-800">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[#16130a]/50 dark:text-gray-500 text-sm">Unable to load market news.</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-[#16130a]/8 dark:divide-gray-800">
            {articles.map((item, i) => (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between px-5 py-3.5 hover:bg-[#fff8e1] dark:hover:bg-gray-800/30 transition-colors gap-4 group"
              >
                <p className="text-sm text-[#16130a]/80 dark:text-gray-200 group-hover:text-[#16130a] dark:group-hover:text-white transition-colors leading-snug line-clamp-2 flex-1 min-w-0">
                  {item.title}
                </p>
                <div className="flex-shrink-0 flex flex-col items-end gap-1 pt-0.5">
                  <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 border-2 border-[#16130a]/15 dark:border-gray-700 text-[#16130a]/60 dark:text-gray-400 whitespace-nowrap">
                    {item.source}
                  </span>
                  <span className="text-xs text-[#16130a]/40 dark:text-gray-600 whitespace-nowrap">
                    {relativeTime(item.pubDate)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <span className="grid place-items-center h-11 w-11 lg:h-12 lg:w-12 rounded-xl bg-[#2563eb] border-2 border-[#16130a] shadow-[3px_3px_0_#16130a] dark:shadow-none shrink-0">
          <Activity className="h-6 w-6 text-white" />
        </span>
        <div>
          <h1 className="font-display uppercase text-2xl lg:text-3xl text-[#16130a] dark:text-white leading-none">Markets Overview</h1>
          <p className="font-mono text-xs text-[#16130a]/60 dark:text-gray-400 mt-1">
            Sentiment, sector performance, and economic events
          </p>
        </div>
      </div>

      {/* Explainer */}
      <div className="bg-[#2563eb]/8 dark:bg-blue-600/8 border-2 border-[#2563eb]/30 dark:border-blue-500/15 rounded-2xl p-4 mb-6">
        <p className="font-mono font-bold text-sm text-[#2563eb] dark:text-blue-400 mb-1 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5" /> What is this?
        </p>
        <p className="text-sm text-[#16130a]/70 dark:text-gray-400 leading-relaxed">
          A live snapshot of overall market health. See how fearful or greedy investors are, which sectors are gaining or losing, and upcoming economic events that could move the market.
        </p>
      </div>

      <FearGreedSection />
      <SectorHeatmapSection />
      <EconCalendarSection />
      <MarketNewsSection />

      <p className="text-xs text-[#16130a]/50 dark:text-gray-500 text-center mt-6 pb-4 px-4">
        Market data, sentiment indicators, and news are sourced from third-party providers and are for informational purposes only. Fear &amp; Greed and sector data may be delayed. Not financial advice. Do not make investment decisions based solely on this data.
      </p>
    </div>
  )
}
