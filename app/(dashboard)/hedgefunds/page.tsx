'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Building2, TrendingUp, TrendingDown, PlusCircle, MinusCircle, RefreshCw, Info, LayoutGrid, BarChart3, Trophy, List, Lock, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import HoldingsTreemap from '@/components/charts/HoldingsTreemap'
import InfoTooltip from '@/components/InfoTooltip'
import LastUpdated from '@/components/LastUpdated'
import { useIsPro } from '@/hooks/useIsPro'

interface Holding { name: string; value: number; shares: number }
interface Fund {
  name: string
  cik: string
  filingDate: string | null
  topHoldings: Holding[]
}
interface QoQ {
  new: number; exit: number; increase: number; decrease: number
  newNames: string[]; exitNames: string[]; increaseNames: string[]; decreaseNames: string[]
}
interface Detail {
  currentHoldings: Holding[]
  prevHoldings: Holding[]
  currentDate: string | null
  prevDate: string | null
  qoq: QoQ
}

function formatVal(v: number) {
  const d = v * 1000
  if (d >= 1e9) return `$${(d / 1e9).toFixed(1)}B`
  if (d >= 1e6) return `$${(d / 1e6).toFixed(0)}M`
  return `$${(d / 1e3).toFixed(0)}K`
}

function cleanName(raw: string) {
  return raw.replace(/ INC$/i,'').replace(/ CORP$/i,'').replace(/ LTD$/i,'')
    .replace(/ LLC$/i,'').replace(/ LP$/i,'').replace(/ CO$/i,'')
    .replace(/ COM INC/i,'').replace(/ HLDGS/i,'').replace(/ HOLDINGS/i,'').trim()
}

function QoQCard({ icon, label, count, names, color, bg, desc }: {
  icon: React.ReactNode; label: string; count: number; names?: string[]; color: string; bg: string; desc: string
}) {
  const [open, setOpen] = useState(false)
  const hasNames = !!names?.length
  return (
    <div
      className={`rounded-xl border p-4 ${bg} ${hasNames ? 'cursor-pointer' : ''}`}
      onClick={() => hasNames && setOpen(!open)}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className={`text-xs font-semibold uppercase tracking-wide ${color}`}>{label}</span>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{count}</p>
      <p className="text-xs text-slate-500 mt-1">{desc}</p>
      {open && names && names.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-200 space-y-0.5">
          {names.map(n => (
            <p key={n} className="text-xs text-slate-600 truncate">• {cleanName(n)}</p>
          ))}
        </div>
      )}
      {hasNames && (
        <p className="text-[10px] text-slate-400 mt-1">{open ? 'tap to hide' : 'tap to see examples'}</p>
      )}
    </div>
  )
}

export default function HedgeFundsPage() {
  const { isPro } = useIsPro()
  const [funds, setFunds] = useState<Fund[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedCik, setSelectedCik] = useState<string | null>(null)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetch('/api/hedgefunds')
      .then(r => r.json())
      .then(d => {
        const f = d.funds ?? []
        setFunds(f)
        if (f.length) setSelectedCik(f[0].cik ?? String(f[0].name))
      })
      .finally(() => { setLoading(false); setLastUpdated(new Date()) })
  }, [])

  useEffect(() => {
    if (!selectedCik) return
    setDetail(null)
    setDetailLoading(true)
    fetch(`/api/hedgefunds/detail?cik=${selectedCik}`)
      .then(r => r.json())
      .then(d => setDetail(d))
      .finally(() => setDetailLoading(false))
  }, [selectedCik])

  const selectedFund = funds.find(f => (f.cik ?? f.name) === selectedCik)

  const crowded = useMemo(() => {
    const map = new Map<string, { count: number; totalValue: number; funds: string[] }>()
    for (const fund of funds) {
      for (const h of fund.topHoldings) {
        const key = h.name
        const existing = map.get(key)
        if (existing) {
          existing.count++
          existing.totalValue += h.value
          existing.funds.push(fund.name)
        } else {
          map.set(key, { count: 1, totalValue: h.value, funds: [fund.name] })
        }
      }
    }
    return Array.from(map.entries())
      .filter(([, v]) => v.count >= 2)
      .sort((a, b) => b[1].count - a[1].count || b[1].totalValue - a[1].totalValue)
      .slice(0, 10)
      .map(([name, v]) => ({ name, ...v }))
  }, [funds])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          Hedge Fund Tracker
          <InfoTooltip text="Hedge funds are large professional investment firms. By law they must publicly report all their stock positions every 3 months, so we can see exactly what they own." />
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">See what the world's top money managers are buying</p>
        <LastUpdated time={lastUpdated} />
      </div>

      {/* Explainer */}
      <div className="bg-blue-600/8 border border-blue-500/15 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-400 mb-1 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5" /> What is this?
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          Every 3 months, big investment firms must tell the government every stock they own.
          These reports are called <strong className="text-gray-300">quarterly government filings</strong>. We pull those reports so you can see exactly what
          the pros owned as of their last quarterly filing — like peeking at a professional investor's most recent portfolio snapshot.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="flex gap-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-9 w-32 rounded-lg" />)}</div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Fund selector tabs */}
          <div className="flex flex-wrap gap-2">
            {funds.map((f, idx) => {
              const locked = !isPro && idx > 0
              const key = f.cik ?? f.name
              const shortName = f.name.replace(' Associates', '').replace(' Technologies', '').replace(' Advisors', '')
                .replace(' Capital Management', '').replace(' Asset Management', '').replace(' Global Investors', '')
              if (locked) {
                return (
                  <Link
                    key={key}
                    href="/upgrade"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border bg-white text-slate-400 border-slate-200 cursor-pointer hover:border-yellow-400 hover:text-yellow-600 transition-colors"
                    title="Upgrade to Pro to unlock"
                  >
                    <Lock className="h-3 w-3" />
                    {shortName}
                  </Link>
                )
              }
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCik(key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    selectedCik === key
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {shortName}
                </button>
              )
            })}
          </div>

          {/* Selected fund detail */}
          {selectedFund && (
            <div className="space-y-4">
              {/* Fund header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedFund.name}</h2>
                  {detail?.currentDate && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Latest filing: {detail.currentDate}
                      {detail.prevDate && ` · Previous: ${detail.prevDate}`}
                    </p>
                  )}
                </div>
                {detailLoading && <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />}
              </div>

              {/* Treemap */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-slate-400" />
                    What They Own Most
                    <InfoTooltip text="Each box represents a stock, bigger box means more money invested. Think of it like a visual breakdown of the fund's portfolio." />
                  </CardTitle>
                  <p className="text-xs text-slate-400">Bigger tile = more money invested. Hover to see details.</p>
                </CardHeader>
                <CardContent className="pt-0">
                  {detailLoading ? (
                    <Skeleton className="h-72 w-full rounded-lg" />
                  ) : detail?.currentHoldings.length ? (
                    <HoldingsTreemap holdings={detail.currentHoldings} />
                  ) : selectedFund.topHoldings.length ? (
                    <HoldingsTreemap holdings={selectedFund.topHoldings} />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No data available</div>
                  )}
                </CardContent>
              </Card>

              {/* QoQ Changes */}
              {(detailLoading || detail?.qoq) && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-slate-400" />
                    What Changed This Quarter?
                    <InfoTooltip text="Compares the fund's current holdings to last quarter's, showing which stocks they added, removed, bought more of, or sold some of." />
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    Comparing their top 20 positions this quarter vs last quarter. Tap any card to see which stocks.
                  </p>
                  {detailLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                    </div>
                  ) : detail?.qoq && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <QoQCard
                        icon={<PlusCircle className="h-4 w-4 text-green-600" />}
                        label="New Positions"
                        count={detail.qoq.new}
                        names={detail.qoq.newNames}
                        color="text-green-600"
                        bg="bg-green-50 border-green-100"
                        desc="Stocks they bought for the first time"
                      />
                      <QoQCard
                        icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
                        label="Added To"
                        count={detail.qoq.increase}
                        names={detail.qoq.increaseNames}
                        color="text-blue-600"
                        bg="bg-blue-50 border-blue-100"
                        desc="Existing positions they bought more of"
                      />
                      <QoQCard
                        icon={<TrendingDown className="h-4 w-4 text-orange-500" />}
                        label="Reduced"
                        count={detail.qoq.decrease}
                        names={detail.qoq.decreaseNames}
                        color="text-orange-500"
                        bg="bg-orange-50 border-orange-100"
                        desc="Positions they sold some of"
                      />
                      <QoQCard
                        icon={<MinusCircle className="h-4 w-4 text-red-500" />}
                        label="Sold Out"
                        count={detail.qoq.exit}
                        names={detail.qoq.exitNames}
                        color="text-red-500"
                        bg="bg-red-50 border-red-100"
                        desc="Positions they exited completely"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-slate-100 pt-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-slate-400" />
              Stocks Every Fund Owns
              <InfoTooltip text="Stocks held by 2 or more of the tracked funds. The more funds that own a stock, the stronger the professional agreement behind it." />
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              These stocks appeared across multiple fund portfolios in their latest 13F filings. This reflects past holdings, not current positions or recommendations.
            </p>

            {crowded.length > 0 ? (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">#</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Company</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Funds holding it</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Combined value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crowded.map((item, i) => (
                        <tr key={item.name} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900">{cleanName(item.name)}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[200px]">{item.funds.slice(0, 2).join(', ')}{item.funds.length > 2 ? ` +${item.funds.length - 2} more` : ''}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                              {item.count} fund{item.count > 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700">{formatVal(item.totalValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <p className="text-sm text-slate-400">Loading cross-fund data...</p>
            )}
          </div>

          {/* All funds quick view */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <List className="h-4 w-4 text-slate-400" />
              All Funds at a Glance
            </h3>
            {/* Free: show 1, blur rest. Pro: show all. */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(isPro ? funds : funds.slice(0, 1)).map(fund => (
                  <Card
                    key={fund.cik ?? fund.name}
                    className={`cursor-pointer transition-all hover:border-blue-200 ${selectedCik === (fund.cik ?? fund.name) ? 'border-blue-300 ring-1 ring-blue-200' : ''}`}
                    onClick={() => { setSelectedCik(fund.cik ?? fund.name); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
                          <p className="text-sm font-semibold text-slate-900 leading-tight">{fund.name}</p>
                        </div>
                        {fund.filingDate && (
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2">Filed {fund.filingDate}</span>
                        )}
                      </div>
                      {fund.topHoldings.length === 0 ? (
                        <p className="text-xs text-slate-400">Holdings data unavailable</p>
                      ) : (
                        <div className="space-y-2">
                          {fund.topHoldings.slice(0, 3).map((h, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                <span className="text-sm text-slate-700 truncate">{cleanName(h.name)}</span>
                              </div>
                              <span className="text-xs font-medium text-slate-500 shrink-0 ml-2">{formatVal(h.value)}</span>
                            </div>
                          ))}
                          <p className="text-xs text-blue-500 mt-1">Click to see full breakdown</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Locked preview for free users */}
              {!isPro && funds.length > 1 && (
                <div className="relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 blur-sm pointer-events-none select-none" aria-hidden>
                    {funds.slice(1, 3).map(fund => (
                      <Card key={fund.cik ?? fund.name}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
                            <p className="text-sm font-semibold text-slate-900">{fund.name}</p>
                          </div>
                          {fund.topHoldings.slice(0, 3).map((h, i) => (
                            <div key={i} className="flex items-center justify-between mb-1">
                              <span className="text-sm text-slate-700 truncate">{cleanName(h.name)}</span>
                              <span className="text-xs text-slate-500">{formatVal(h.value)}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl"
                    style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(248,250,252,0.9) 40%)' }}>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 shadow-sm">
                      <Lock className="h-3.5 w-3.5 text-yellow-500" />
                      <span className="text-sm text-slate-600 font-medium">{funds.length - 1} more funds locked</span>
                    </div>
                    <Link
                      href="/upgrade"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-gray-950 text-sm font-bold transition-colors shadow-lg"
                    >
                      <Zap className="h-4 w-4" />
                      Unlock with Pro — $4.99/mo
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <p className="text-xs text-slate-400 text-center pb-4">
        Data from SEC EDGAR quarterly 13F filings. Holdings may be 3–6 months old and may no longer reflect current positions. For informational purposes only. Not financial advice. Do not make investment decisions based solely on fund holdings data.
      </p>
    </div>
  )
}
