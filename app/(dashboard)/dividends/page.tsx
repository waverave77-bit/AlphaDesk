'use client'
import { useState, useEffect, useRef } from 'react'
import { Search, DollarSign, TrendingUp, Calendar, Award, ChevronRight, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const TABS = ['Calculator', 'Top Stocks', 'Calendar'] as const
type Tab = typeof TABS[number]

const YIELD_FILTERS = ['All', '2-4%', '4-6%', '6%+', 'Aristocrats'] as const
type YieldFilter = typeof YIELD_FILTERS[number]

function formatCurrency(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}
function pct(n: number) { return `${(n * 100).toFixed(2)}%` }

// ─── Calculator Tab ─────────────────────────────────────────────────────────

function Calculator() {
  const [query, setQuery] = useState('')
  const [amount, setAmount] = useState('10000')
  const [searchResults, setSearchResults] = useState<{ ticker: string; name: string }[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [selectedTicker, setSelectedTicker] = useState('')
  const [divData, setDivData] = useState<any>(null)
  const [divLoading, setDivLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Search debounce
  useEffect(() => {
    if (!query || query.length < 2) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const r = await fetch(`/api/stock/search?q=${encodeURIComponent(query)}`)
        const d = await r.json()
        setSearchResults((d.results || []).slice(0, 6))
      } catch { setSearchResults([]) }
      setSearchLoading(false)
    }, 350)
    return () => clearTimeout(t)
  }, [query])

  // Fetch dividend data when ticker selected
  useEffect(() => {
    if (!selectedTicker) { setDivData(null); return }
    setDivLoading(true)
    fetch(`/api/dividends/ticker?symbol=${selectedTicker}`)
      .then(r => r.json())
      .then(d => { setDivData(d); setDivLoading(false) })
      .catch(() => setDivLoading(false))
  }, [selectedTicker])

  const investAmount = parseFloat(amount) || 0
  const shares = divData?.price ? investAmount / divData.price : 0

  // Use the best available annual dividend rate: forward rate > trailing rate > yield * price
  const bestAnnualRate: number = divData
    ? (divData.dividendRate ?? divData.trailingDividendRate ?? ((divData.dividendYield ?? divData.trailingDividendYield ?? 0) * (divData.price ?? 0)))
    : 0
  const annualIncome = bestAnnualRate * shares
  const monthlyIncome = annualIncome / 12
  const quarterlyIncome = annualIncome / 4
  const yieldOnCost = investAmount > 0 ? (annualIncome / investAmount) * 100 : 0

  const noPays = divData && !divData.paysDividend

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stock search */}
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Search a stock</label>
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              value={selectedTicker || query}
              onChange={e => { const v = e.target.value; setQuery(v); setSelectedTicker(''); setDivData(null); setShowSearch(true) }}
              onFocus={() => setShowSearch(true)}
              placeholder="e.g. Coca-Cola or KO"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            {selectedTicker && (
              <button onClick={() => { setSelectedTicker(''); setQuery(''); setDivData(null) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs">✕</button>
            )}
            {searchLoading && !selectedTicker && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 animate-pulse">...</span>
            )}
            {showSearch && !selectedTicker && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                {searchResults.map(r => (
                  <button key={r.ticker} onClick={() => { setSelectedTicker(r.ticker); setQuery(''); setShowSearch(false) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 transition-colors text-left">
                    <span className="text-xs font-bold text-blue-400 w-14 shrink-0">{r.ticker}</span>
                    <span className="text-sm text-gray-300 truncate">{r.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Investment amount */}
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Investment amount</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="number" min="1" value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="10000"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          {/* Quick amounts */}
          <div className="flex gap-2 mt-2">
            {['1000', '5000', '10000', '25000', '50000'].map(a => (
              <button key={a} onClick={() => setAmount(a)}
                className={cn('text-xs px-2.5 py-1 rounded-full border transition-colors',
                  amount === a ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-500 hover:text-gray-300')}>
                ${parseInt(a).toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {divLoading && <Skeleton className="h-48 w-full" />}

      {divData && !divLoading && (
        <>
          {/* Header */}
          <div className="flex items-center gap-3 p-4 bg-gray-900 rounded-xl border border-gray-800">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-lg">{divData.ticker}</span>
                {divData.isAristocrat && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 flex items-center gap-1">
                    <Award className="h-3 w-3" /> Aristocrat
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400">{divData.companyName}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-white">{formatCurrency(divData.price ?? 0)}</p>
              <p className="text-sm text-green-400 font-medium">{divData.dividendYield ? pct(divData.dividendYield) : divData.trailingDividendYield ? pct(divData.trailingDividendYield) : '—'} yield</p>
            </div>
          </div>

          {noPays ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Info className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 font-medium">{divData.ticker} doesn&apos;t pay a dividend</p>
                <p className="text-gray-600 text-sm mt-1">Try a stock like KO, JNJ, or PEP instead</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Income breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Annual Income', value: formatCurrency(annualIncome), color: 'text-green-400', sub: 'per year' },
                  { label: 'Monthly Income', value: formatCurrency(monthlyIncome), color: 'text-blue-400', sub: 'per month' },
                  { label: 'Quarterly Income', value: formatCurrency(quarterlyIncome), color: 'text-purple-400', sub: 'per quarter' },
                  { label: 'Yield on Cost', value: `${yieldOnCost.toFixed(2)}%`, color: yieldOnCost >= 4 ? 'text-green-400' : 'text-yellow-400', sub: 'on your investment' },
                ].map(c => (
                  <Card key={c.label}>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                      <p className={cn('text-lg font-bold', c.color)}>{c.value}</p>
                      <p className="text-xs text-gray-600">{c.sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Details row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card>
                  <CardHeader className="pb-1 pt-3 px-4">
                    <CardTitle className="text-xs text-gray-500 uppercase tracking-wide">Position Details</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2.5">
                    {[
                      { label: 'Investment', value: formatCurrency(investAmount) },
                      { label: 'Shares Owned', value: shares.toFixed(4) },
                      { label: 'Price Per Share', value: formatCurrency(divData.price ?? 0) },
                      { label: 'Annual Div / Share', value: bestAnnualRate > 0 ? `$${bestAnnualRate.toFixed(4)}` : '—' },
                      { label: 'Payout Ratio', value: divData.payoutRatio ? pct(divData.payoutRatio) : '—' },
                      { label: '5-Year Avg Yield', value: divData.fiveYearAvgYield ? `${divData.fiveYearAvgYield.toFixed(2)}%` : '—' },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between text-sm">
                        <span className="text-gray-500">{row.label}</span>
                        <span className="text-white font-medium">{row.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-1 pt-3 px-4">
                    <CardTitle className="text-xs text-gray-500 uppercase tracking-wide">Important Dates</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-4">
                    {divData.exDividendDate && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Ex-Dividend Date</p>
                        <p className="text-white font-semibold">{divData.exDividendDate}</p>
                        <p className="text-xs text-gray-600 mt-0.5">You must own shares before this date to receive the dividend</p>
                      </div>
                    )}
                    {divData.paymentDate && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Payment Date</p>
                        <p className="text-white font-semibold">{divData.paymentDate}</p>
                        <p className="text-xs text-gray-600 mt-0.5">When the dividend hits your account</p>
                      </div>
                    )}
                    {!divData.exDividendDate && !divData.paymentDate && (
                      <p className="text-gray-600 text-sm">Date information not available</p>
                    )}
                    <div className="pt-2 border-t border-gray-800 mt-2">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Dividends are typically paid quarterly. Past dividends do not guarantee future payments. Not financial advice.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </>
      )}

      {!selectedTicker && !divLoading && (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">Search any dividend stock</p>
          <p className="text-gray-600 text-sm mt-1">See exactly how much income you&apos;d earn from your investment</p>
          <div className="flex gap-2 justify-center mt-4 flex-wrap">
            {['KO', 'JNJ', 'T', 'PEP', 'XOM', 'O'].map(t => (
              <button key={t} onClick={() => setSelectedTicker(t)}
                className="text-xs px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-gray-300 hover:border-blue-500 hover:text-blue-400 transition-colors">
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Top Stocks Tab ──────────────────────────────────────────────────────────

function TopStocks() {
  const [stocks, setStocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<YieldFilter>('All')

  useEffect(() => {
    fetch('/api/dividends/screener')
      .then(r => r.json())
      .then(d => { setStocks(d.results || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = stocks.filter(s => {
    if (filter === 'All') return true
    if (filter === 'Aristocrats') return s.isAristocrat
    return s.yieldBucket === filter
  })

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {YIELD_FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1',
              filter === f ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-500 hover:text-gray-300')}>
            {f === 'Aristocrats' && <Award className="h-3 w-3" />}
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><p className="text-gray-400">No stocks found for this filter</p></CardContent></Card>
      ) : (
        <>
          <div className="hidden md:grid grid-cols-6 text-xs text-gray-500 px-4 py-2 gap-2">
            <span className="col-span-2">Company</span>
            <span className="text-right">Price</span>
            <span className="text-right">Yield</span>
            <span className="text-right">Annual Div</span>
            <span className="text-right">Change</span>
          </div>
          {filtered.map((s, i) => (
            <Card key={s.ticker} className="hover:border-gray-700 transition-colors">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-center">
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-5">#{i + 1}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{s.ticker}</span>
                          {s.isAristocrat && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">👑 Aristocrat</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate max-w-[160px]">{s.companyName}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">${s.price.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-bold', s.dividendYield >= 0.06 ? 'text-green-400' : s.dividendYield >= 0.04 ? 'text-blue-400' : 'text-gray-300')}>
                      {pct(s.dividendYield)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-300">${s.annualDividend.toFixed(2)}/yr</p>
                    <p className="text-xs text-gray-600">${s.quarterlyDividend.toFixed(2)}/qtr</p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-medium', s.changePercent >= 0 ? 'text-green-400' : 'text-red-400')}>
                      {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <p className="text-xs text-gray-600 text-center pt-2">Sorted by dividend yield · Live data · Not financial advice</p>
        </>
      )}
    </div>
  )
}

// ─── Calendar Tab ────────────────────────────────────────────────────────────

type CalFilter = 'This Week' | 'Next 2 Weeks' | 'This Month'
const CAL_FILTERS: CalFilter[] = ['This Week', 'Next 2 Weeks', 'This Month']

function DividendCalendar() {
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [calFilter, setCalFilter] = useState<CalFilter>('Next 2 Weeks')

  useEffect(() => {
    fetch('/api/dividends/calendar')
      .then(r => r.json())
      .then(d => { setUpcoming(d.upcoming || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = upcoming.filter(e => {
    const days = e.daysUntilExDate
    if (calFilter === 'This Week') return days <= 7
    if (calFilter === 'Next 2 Weeks') return days <= 14
    return days <= 31
  })

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex gap-2">
        {CAL_FILTERS.map(f => (
          <button key={f} onClick={() => setCalFilter(f)}
            className={cn('text-xs px-3 py-1.5 rounded-full border transition-colors',
              calFilter === f ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-500 hover:text-gray-300')}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-10 w-10 text-gray-700 mx-auto mb-2" />
            <p className="text-gray-400">No ex-dividend dates in this window</p>
            <p className="text-gray-600 text-sm mt-1">Try expanding the time range</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden md:grid grid-cols-5 text-xs text-gray-500 px-4 py-2">
            <span className="col-span-2">Company</span>
            <span>Ex-Date</span>
            <span>Pay Date</span>
            <span className="text-right">Div / Share</span>
          </div>
          {filtered.map(e => (
            <Card key={`${e.ticker}-${e.exDate}`} className={cn('border',
              e.daysUntilExDate <= 3 ? 'border-orange-500/30 bg-orange-500/5' : '')}>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-center">
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{e.ticker}</span>
                      {e.daysUntilExDate <= 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400">Soon</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate max-w-[180px]">{e.companyName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{e.exDateFormatted}</p>
                    <p className="text-xs text-gray-500">{e.daysUntilExDate === 0 ? 'Today' : e.daysUntilExDate === 1 ? 'Tomorrow' : `In ${e.daysUntilExDate} days`}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">{e.payDateFormatted ?? '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-400">
                      {e.dividendAmount ? `$${e.dividendAmount.toFixed(4)}` : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-blue-400">Ex-dividend date:</strong> You must own shares before this date to receive the dividend. The stock typically drops by the dividend amount on this day.
                <br />
                <strong className="text-blue-400">Pay date:</strong> When the cash actually lands in your brokerage account.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DividendsPage() {
  const [tab, setTab] = useState<Tab>('Calculator')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-green-400" />
          Dividends
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Calculate dividend income, find top-yielding stocks, and track upcoming ex-dividend dates
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5',
              tab === t ? 'border-green-500 text-green-400' : 'border-transparent text-gray-500 hover:text-gray-300')}>
            {t === 'Calculator' && <DollarSign className="h-3.5 w-3.5" />}
            {t === 'Top Stocks' && <TrendingUp className="h-3.5 w-3.5" />}
            {t === 'Calendar' && <Calendar className="h-3.5 w-3.5" />}
            {t}
          </button>
        ))}
      </div>

      {tab === 'Calculator' && <Calculator />}
      {tab === 'Top Stocks' && <TopStocks />}
      {tab === 'Calendar' && <DividendCalendar />}
    </div>
  )
}
