'use client'

import { useEffect, useState } from 'react'
import { Activity, ChevronRight } from 'lucide-react'
import LastUpdated from '@/components/LastUpdated'
import { Skeleton } from '@/components/ui/skeleton'
import InfoTooltip from '@/components/InfoTooltip'
import { cn } from '@/lib/utils'

// ─── Arcade style tokens ──────────────────────────────────────────────────────
const CARD = 'rounded-2xl border-2 border-[#16130a] shadow-[4px_4px_0_#16130a] dark:border-gray-700 dark:shadow-none bg-white dark:bg-gray-900'
const LABEL = 'font-mono font-bold text-[11px] uppercase tracking-widest text-[#16130a]/50 dark:text-gray-400 flex items-center gap-1.5'

// ─── Fear & Greed ─────────────────────────────────────────────────────────────

interface HistoryPoint { value: number; rating: string; timestamp: number }
interface FngResponse { score?: number; rating?: string; history?: HistoryPoint[] }

function getFngColor(value: number): string {
  if (value <= 25) return 'text-red-600 dark:text-red-400'
  if (value <= 45) return 'text-orange-600 dark:text-orange-400'
  if (value <= 55) return 'text-yellow-600 dark:text-yellow-400'
  if (value <= 75) return 'text-green-600 dark:text-green-400'
  return 'text-emerald-600 dark:text-emerald-400'
}

function getFngPill(value: number): string {
  if (value <= 25) return 'bg-red-500/15 border-red-500 text-red-600 dark:text-red-400'
  if (value <= 45) return 'bg-orange-500/15 border-orange-500 text-orange-600 dark:text-orange-400'
  if (value <= 55) return 'bg-yellow-500/15 border-yellow-500 text-yellow-600 dark:text-yellow-400'
  if (value <= 75) return 'bg-green-500/15 border-green-500 text-green-600 dark:text-green-400'
  return 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400'
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
    return 'Investors are broadly pessimistic. Extreme fear has sometimes preceded recoveries, but also prolonged downturns. A sentiment gauge, not a buy signal.'
  if (value <= 45)
    return 'Fear is elevated and investors are cautious. Sentiment alone is not a reliable timing tool — conditions can stay fearful for a while.'
  if (value <= 55)
    return 'Sentiment is roughly neutral — no strong directional signal from the crowd. A sentiment gauge, not a forecast.'
  if (value <= 75)
    return 'Greed is building and investors are optimistic. Elevated greed has sometimes meant higher valuations and pullback risk, but timing on sentiment is unreliable.'
  return 'Market sentiment is euphoric. Extreme greed has sometimes preceded corrections, but markets can stay greedy for a long time. A sentiment gauge only.'
}

function FearGreedHero() {
  const [value, setValue] = useState<number | null>(null)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetch('/api/fear-greed')
      .then((r) => r.json())
      .then((d: FngResponse) => {
        if (typeof d?.score === 'number') {
          setValue(Math.round(d.score))
          setHistory(d.history ?? [])
          setLastUpdated(new Date())
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={cn(CARD, 'p-5 sm:p-6')}>
      <p className={cn(LABEL, 'mb-4')}>
        Fear &amp; Greed Index
        <InfoTooltip text="A score from 0–100 measuring overall investor sentiment — fearful (selling) or greedy (buying). A sentiment gauge only, not a buy or sell signal." />
        <LastUpdated time={lastUpdated} className="ml-auto" />
      </p>

      {loading ? (
        <div className="flex items-center gap-6">
          <Skeleton className="h-16 w-20" />
          <Skeleton className="h-14 flex-1" />
        </div>
      ) : value === null ? (
        <p className="text-[#16130a]/50 dark:text-gray-500 text-sm">Unable to load Fear &amp; Greed data.</p>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Big number + label */}
          <div className="text-center shrink-0">
            <div className={cn('font-mono font-bold text-5xl sm:text-6xl leading-none', getFngColor(value))}>{value}</div>
            <span className={cn('inline-block mt-2 font-mono font-bold text-[11px] uppercase tracking-widest px-3 py-0.5 rounded-full border-2', getFngPill(value))}>
              {getFngLabel(value)}
            </span>
          </div>

          {/* Scale bar + read + trend */}
          <div className="flex-1 min-w-0">
            <div className="relative pt-2.5">
              <div className="absolute top-0" style={{ left: `${value}%` }}>
                <div className="-translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-[#16130a] dark:border-t-white" />
              </div>
              <div className="flex h-3.5 rounded-full overflow-hidden border-2 border-[#16130a] dark:border-gray-600">
                <span className="flex-1 bg-red-500" /><span className="flex-1 bg-orange-500" /><span className="flex-1 bg-yellow-400" /><span className="flex-1 bg-green-500" /><span className="flex-1 bg-emerald-500" />
              </div>
            </div>
            <p className="text-sm text-[#16130a]/70 dark:text-gray-400 leading-relaxed mt-3">{getFngTradeNote(value)}</p>

            {history.length > 0 && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {history.slice(-7).map((p, i) => {
                  const date = new Date(p.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  return (
                    <div key={i} className="flex flex-col items-center rounded-lg border-2 border-[#16130a]/10 dark:border-gray-700 px-2 py-1 min-w-[44px]" title={`${date}: ${p.rating}`}>
                      <span className={cn('font-mono font-bold text-xs', getFngColor(p.value))}>{p.value}</span>
                      <span className="text-[9px] text-[#16130a]/40 dark:text-gray-600">{date}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sector Heatmap tile ──────────────────────────────────────────────────────

interface SectorData { symbol: string; name: string; changePercent: number; price: number }

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

function SectorTile() {
  const [sectors, setSectors] = useState<SectorData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetch('/api/sectorheatmap')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) { setSectors(d); setLastUpdated(new Date()) } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={cn(CARD, 'p-4')}>
      <p className={cn(LABEL, 'mb-3')}>
        Sectors today
        <InfoTooltip text="How each sector performed today. Green = up, red = down. Darker = bigger move." />
        <LastUpdated time={lastUpdated} className="ml-auto" />
      </p>
      {loading ? (
        <div className="grid grid-cols-3 gap-2">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
      ) : sectors.length === 0 ? (
        <p className="text-[#16130a]/50 dark:text-gray-500 text-sm py-6 text-center">Unable to load sector data.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {sectors.map((s) => (
            <div key={s.symbol} className={cn('rounded-lg border-2 px-2 py-1.5 text-center', getSectorBg(s.changePercent))}>
              <div className="text-[10px] font-bold text-[#16130a]/80 dark:text-gray-300 leading-tight truncate" title={s.name}>{s.name}</div>
              <div className={cn('font-mono font-bold text-xs mt-0.5', getSectorTextColor(s.changePercent))}>
                {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Economic Calendar (Up Next tile) ─────────────────────────────────────────

interface EconEvent { date: string; name: string; importance: 'High' | 'Medium'; impact: string }

const ECON_EVENTS: EconEvent[] = [
  { date: '2026-05-01', name: 'Jobs Report (April)', importance: 'High', impact: 'Non-Farm Payrolls; key labor market indicator affecting Fed policy.' },
  { date: '2026-05-05', name: 'FOMC Meeting (Day 1)', importance: 'High', impact: 'Federal Reserve begins two-day policy meeting.' },
  { date: '2026-05-06', name: 'FOMC Decision', importance: 'High', impact: 'Fed rate decision and press conference. Markets move sharply on surprises.' },
  { date: '2026-05-13', name: 'CPI (April)', importance: 'High', impact: 'Consumer Price Index; primary inflation gauge influencing Fed rate path.' },
  { date: '2026-06-05', name: 'Jobs Report (May)', importance: 'High', impact: 'Non-Farm Payrolls; labor market health indicator.' },
  { date: '2026-06-10', name: 'CPI (May)', importance: 'High', impact: 'Inflation data; heavily watched by the Fed and bond markets.' },
  { date: '2026-06-16', name: 'FOMC Meeting (Day 1)', importance: 'High', impact: 'Federal Reserve begins two-day policy meeting.' },
  { date: '2026-06-17', name: 'FOMC Decision', importance: 'High', impact: 'Fed rate decision and updated dot plot projections.' },
  { date: '2026-07-03', name: 'Jobs Report (June)', importance: 'High', impact: 'Non-Farm Payrolls; labor market data.' },
  { date: '2026-07-15', name: 'CPI (June)', importance: 'High', impact: 'Mid-year inflation check; critical for second-half rate expectations.' },
  { date: '2026-07-28', name: 'FOMC Meeting (Day 1)', importance: 'High', impact: 'Federal Reserve begins two-day policy meeting.' },
  { date: '2026-07-29', name: 'FOMC Decision', importance: 'High', impact: 'Fed rate decision. Mid-year inflection point for markets.' },
  { date: '2026-08-07', name: 'Jobs Report (July)', importance: 'High', impact: 'Non-Farm Payrolls; summer labor market reading.' },
  { date: '2026-08-12', name: 'CPI (July)', importance: 'High', impact: 'Inflation data ahead of Jackson Hole symposium.' },
  { date: '2026-09-04', name: 'Jobs Report (August)', importance: 'High', impact: 'Non-Farm Payrolls; pre-September FOMC data.' },
  { date: '2026-09-10', name: 'CPI (August)', importance: 'High', impact: 'Final inflation print before September FOMC meeting.' },
  { date: '2026-09-15', name: 'FOMC Meeting (Day 1)', importance: 'High', impact: 'Federal Reserve begins two-day policy meeting.' },
  { date: '2026-09-16', name: 'FOMC Decision', importance: 'High', impact: 'September rate decision; new economic projections released.' },
  { date: '2026-10-02', name: 'Jobs Report (September)', importance: 'High', impact: 'Non-Farm Payrolls; Q3 labor market summary.' },
  { date: '2026-10-14', name: 'CPI (September)', importance: 'High', impact: 'Q3 inflation summary; shapes Q4 rate expectations.' },
  { date: '2026-10-27', name: 'FOMC Meeting (Day 1)', importance: 'High', impact: 'Federal Reserve begins two-day policy meeting.' },
  { date: '2026-10-28', name: 'FOMC Decision', importance: 'High', impact: 'October rate decision heading into year-end.' },
  { date: '2026-11-06', name: 'Jobs Report (October)', importance: 'High', impact: 'Non-Farm Payrolls; early Q4 labor market data.' },
  { date: '2026-11-12', name: 'CPI (October)', importance: 'High', impact: 'Inflation data; sets tone for December FOMC.' },
  { date: '2026-12-04', name: 'Jobs Report (November)', importance: 'High', impact: 'Non-Farm Payrolls; final major labor print of 2026.' },
  { date: '2026-12-08', name: 'FOMC Meeting (Day 1)', importance: 'High', impact: 'Federal Reserve begins final two-day meeting of the year.' },
  { date: '2026-12-09', name: 'FOMC Decision', importance: 'High', impact: 'Final rate decision of 2026; year-end dot plot and projections.' },
  { date: '2026-12-11', name: 'CPI (November)', importance: 'High', impact: 'Final CPI print of 2026; follows December FOMC decision.' },
]

function UpNextTile() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000

  const upcoming = ECON_EVENTS
    .filter((e) => new Date(e.date + 'T00:00:00') >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  function fmt(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }
  function soon(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').getTime() - today.getTime() <= sevenDaysMs
  }

  const [first, ...rest] = upcoming

  return (
    <div className={cn(CARD, 'p-4')}>
      <p className={cn(LABEL, 'mb-3')}>
        Up next
        <InfoTooltip text="Upcoming events that can move markets — jobs reports, inflation data (CPI), and Fed rate decisions. Dates are estimates; verify at federalreserve.gov or bls.gov." />
      </p>
      {!first ? (
        <p className="text-[#16130a]/50 dark:text-gray-500 text-sm py-6 text-center">No upcoming events.</p>
      ) : (
        <>
          <div className="rounded-xl border-2 border-[#16130a] bg-[#fff8e1] dark:bg-gray-800 dark:border-gray-700 p-3 mb-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-display uppercase text-[#16130a] dark:text-white text-sm">{first.name}</span>
              {soon(first.date) && (
                <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 border-2 border-yellow-500/60 text-yellow-700 dark:text-yellow-400 shrink-0">Soon</span>
              )}
            </div>
            <p className="font-mono text-xs text-[#16130a]/60 dark:text-gray-400 mt-1">{fmt(first.date)} · {first.impact.split(';')[0]}</p>
          </div>
          {rest.map((e) => (
            <div key={`${e.date}-${e.name}`} className="flex items-center justify-between py-2 border-b-2 border-[#16130a]/8 dark:border-gray-800 last:border-0">
              <span className="text-sm font-bold text-[#16130a] dark:text-white">{e.name}</span>
              <span className="font-mono text-xs text-[#16130a]/55 dark:text-gray-500 shrink-0">{fmt(e.date)}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ─── Market News strip ────────────────────────────────────────────────────────

interface NewsArticle { title: string; link: string; pubDate: string; source: string }

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

function MarketNewsTile() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetch('/api/news/market')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d?.articles)) { setArticles(d.articles.slice(0, 8)); setLastUpdated(new Date()) } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={cn(CARD, 'p-4')}>
      <p className={cn(LABEL, 'mb-2')}>
        Live market news
        <InfoTooltip text="Latest financial news from major sources. May be cached for a few minutes." />
        <LastUpdated time={lastUpdated} className="ml-auto" />
      </p>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}</div>
      ) : articles.length === 0 ? (
        <p className="text-[#16130a]/50 dark:text-gray-500 text-sm py-6 text-center">Unable to load market news.</p>
      ) : (
        <div>
          {articles.map((item, i) => (
            <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 py-2.5 border-b-2 border-[#16130a]/8 dark:border-gray-800 last:border-0 group">
              <span className="text-sm text-[#16130a]/80 dark:text-gray-200 group-hover:text-[#16130a] dark:group-hover:text-white transition-colors leading-snug line-clamp-1 flex-1 min-w-0">
                {item.title}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 border-2 border-[#16130a]/15 dark:border-gray-700 text-[#16130a]/60 dark:text-gray-400 whitespace-nowrap hidden sm:inline">{item.source}</span>
                <span className="font-mono text-[10px] text-[#16130a]/40 dark:text-gray-600 whitespace-nowrap">{relativeTime(item.pubDate)}</span>
                <ChevronRight className="h-3.5 w-3.5 text-[#16130a]/30 dark:text-gray-600 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="grid place-items-center h-11 w-11 rounded-xl bg-[#2563eb] border-2 border-[#16130a] shadow-[3px_3px_0_#16130a] dark:shadow-none shrink-0">
          <Activity className="h-6 w-6 text-white" />
        </span>
        <div>
          <h1 className="font-display uppercase text-2xl sm:text-3xl text-[#16130a] dark:text-white leading-none">Markets</h1>
          <p className="font-mono text-xs text-[#16130a]/60 dark:text-gray-400 mt-1">The market&apos;s mood, at a glance</p>
        </div>
      </div>

      <FearGreedHero />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectorTile />
        <UpNextTile />
      </div>

      <MarketNewsTile />

      <p className="text-xs text-[#16130a]/50 dark:text-gray-500 text-center pt-2 pb-4 px-4">
        Market data, sentiment, and news come from third-party providers and are for informational purposes only. Fear &amp; Greed and sector data may be delayed. Not financial advice.
      </p>
    </div>
  )
}
