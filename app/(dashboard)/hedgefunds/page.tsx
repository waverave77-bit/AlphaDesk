'use client'
import { useState, useEffect, useMemo } from 'react'
import { Building2, TrendingUp, TrendingDown, PlusCircle, MinusCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import HoldingsTreemap from '@/components/charts/HoldingsTreemap'
import InfoTooltip from '@/components/InfoTooltip'
import LastUpdated from '@/components/LastUpdated'

interface Holding { name: string; value: number; shares: number }
interface Fund {
  name: string
  cik: string
  filingDate: string | null
  topHoldings: Holding[]
}
interface QoQ { new: number; exit: number; increase: number; decrease: number; newNames: string[]; exitNames: string[] }
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
  return (
    <div className={`rounded-xl border p-4 ${bg} cursor-pointer`} onClick={() => names?.length && setOpen(!open)}>
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
      {names && names.length > 0 && (
        <p className="text-[10px] text-slate-400 mt-1">{open ? 'tap to hide' : 'tap to see examples'}</p>
      )}
    </div>
  )
}

export default function HedgeFundsPage() {
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

  // Load detail when a fund is selected
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

  // Most-crowded names: stocks held by 2+ funds
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
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">Hedge Fund Tracker <InfoTooltip text="Hedge funds are professional investment firms that manage billions of dollars. By law they must publicly disclose their stock holdings every 3 months — so we can see exactly what they're buying." /></h1>
        <p className="text-sm text-slate-500 mt-0.5">See what the world's smartest money managers are buying</p>
        <LastUpdated time={lastUpdated} />
      </div>

      {/* Explainer */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-700 mb-1">💡 What is this?</p>
        <p className="text-sm text-blue-600 leading-relaxed">
          Every 3 months, big investment firms (hedge funds) must tell the government every stock they own.
          These reports are called <strong>13F filings</strong>. We pull those reports so you can see exactly what
          the pros are betting on — think of it like peeking at the best poker players' hands. 🃏
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
            {funds.map(f => (
              <button
                key={f.cik ?? f.name}
                onClick={() => setSelectedCik(f.cik ?? f.name)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  selectedCik === (f.cik ?? f.name)
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {f.name.replace(' Associates', '').replace(' Technologies', '').replace(' Advisors', '')
                  .replace(' Capital Management', '').replace(' Asset Management', '').replace(' Global Investors', '')}
              </button>
            ))}
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
                    🗺️ What They Own Most <InfoTooltip text="A treemap where each box represents a stock — bigger box = more money invested. Think of it like a visual pie chart of the fund's portfolio." />
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
                  <h3 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">📊 What Changed This Quarter? <InfoTooltip text="Compares the fund's current holdings to last quarter's — showing which stocks they added, removed, bought more of, or sold some of." /></h3>
                  <p className="text-xs text-slate-400 mb-3">
                    Comparing their top 20 positions this quarter vs last quarter. Tap any card to see examples.
                  </p>
                  {detailLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                    </div>
                  ) : detail?.qoq && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <QoQCard
                        icon={<PlusCircle className="h-4 w-4 text-green-600" />}
                        label="Fresh Bets 🆕"
                        count={detail.qoq.new}
                        names={detail.qoq.newNames}
                        color="text-green-600"
                        bg="bg-green-50 border-green-100"
                        desc="New positions they opened"
                      />
                      <QoQCard
                        icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
                        label="Doubled Down 📈"
                        count={detail.qoq.increase}
                        color="text-blue-600"
                        bg="bg-blue-50 border-blue-100"
                        desc="Positions they bought more of"
                      />
                      <QoQCard
                        icon={<TrendingDown className="h-4 w-4 text-orange-500" />}
                        label="Trimmed ✂️"
                        count={detail.qoq.decrease}
                        color="text-orange-500"
                        bg="bg-orange-50 border-orange-100"
                        desc="Positions they sold some of"
                      />
                      <QoQCard
                        icon={<MinusCircle className="h-4 w-4 text-red-500" />}
                        label="Bailed On 🚪"
                        count={detail.qoq.exit}
                        names={detail.qoq.exitNames}
                        color="text-red-500"
                        bg="bg-red-50 border-red-100"
                        desc="Positions they sold completely"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-slate-100 pt-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">🏆 What Every Hedge Fund Owns <InfoTooltip text="Stocks held by 2 or more of the tracked funds — the more funds that own a stock, the stronger the professional consensus behind it." /></h3>
            <p className="text-xs text-slate-400 mb-4">
              Stocks that show up in multiple fund portfolios — the pros all agree on these.
            </p>

            {crowded.length > 0 ? (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">#</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Company</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Funds that own it</th>
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
              <p className="text-sm text-slate-400">Loading cross-fund data…</p>
            )}
          </div>

          {/* All funds quick view */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">📋 All Funds — Top Picks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {funds.map(fund => (
                <Card
                  key={fund.cik ?? fund.name}
                  className={`cursor-pointer transition-all hover:border-blue-200 ${selectedCik === (fund.cik ?? fund.name) ? 'border-blue-300 ring-1 ring-blue-200' : ''}`}
                  onClick={() => { setSelectedCik(fund.cik ?? fund.name); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
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
                        <p className="text-xs text-blue-500 mt-1">Click to see full treemap →</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      <p className="text-xs text-slate-400 text-center pb-4">
        Data from SEC EDGAR 13F filings. Updated quarterly. Holdings shown are top positions only.
      </p>
    </div>
  )
}
