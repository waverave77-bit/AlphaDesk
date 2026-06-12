'use client'
import { useState, useEffect, useRef } from 'react'
import { Search, DollarSign, TrendingUp, Calendar, Award, Info, ChevronDown, ChevronUp, Crown, Lightbulb, Pin, AlertTriangle, Banknote } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const TABS = ['Calculator', 'Top Stocks', 'Calendar'] as const
type Tab = typeof TABS[number]

const YIELD_FILTERS = ['All', '2-4%', '4-6%', '6%+', 'Aristocrats'] as const
type YieldFilter = typeof YIELD_FILTERS[number]

// ─── Arcade style tokens ──────────────────────────────────────────────────────
const CARD = 'rounded-2xl border-2 border-[#16130a] shadow-[4px_4px_0_#16130a] dark:border-gray-700 dark:shadow-none bg-white dark:bg-gray-900'
const CELL = 'rounded-xl border-2 border-[#16130a] dark:border-gray-700 bg-white dark:bg-gray-900'
const LABEL = 'font-mono font-bold text-xs uppercase tracking-widest text-[#16130a]/50 dark:text-gray-400'
const INPUT = 'w-full rounded-xl border-2 border-[#16130a] dark:border-gray-600 bg-white dark:bg-gray-800 text-[#16130a] dark:text-white placeholder:text-[#16130a]/30 dark:placeholder:text-gray-500 focus:outline-none focus:border-[#2563eb] transition-colors'

function pillCls(active: boolean) {
  return cn('text-xs font-mono font-bold px-3 py-1.5 rounded-full border-2 transition-colors flex items-center gap-1',
    active
      ? 'bg-[#16130a] border-[#16130a] text-white dark:bg-white dark:text-[#16130a] dark:border-white'
      : 'bg-white dark:bg-gray-800 border-[#16130a]/20 dark:border-gray-600 text-[#16130a]/60 dark:text-gray-400 hover:border-[#16130a] dark:hover:border-gray-400')
}

function formatCurrency(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}
function pct(n: number) { return `${(n * 100).toFixed(2)}%` }

// ─── Reusable tooltip ────────────────────────────────────────────────────────

function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-block">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
        className="text-[#16130a]/40 hover:text-[#16130a] dark:text-gray-500 dark:hover:text-gray-300 transition-colors align-middle ml-1"
      >
        <Info className="h-3 w-3 inline" />
      </button>
      {open && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 bg-[#16130a] border-2 border-[#16130a] dark:border-gray-600 rounded-lg px-3 py-2 text-xs text-white leading-relaxed shadow-xl pointer-events-none normal-case tracking-normal font-sans font-normal">
          {text}
        </span>
      )}
    </span>
  )
}

// ─── Dividend 101 explainer ───────────────────────────────────────────────────

function DividendExplainer() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border-2 border-[#16130a] shadow-[4px_4px_0_#16130a] dark:border-gray-700 dark:shadow-none bg-[#fff8e1] dark:bg-gray-900 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-[#16130a] dark:text-yellow-400 shrink-0" />
          <span className="font-mono font-bold text-sm text-[#16130a] dark:text-white">New to dividends? Start here</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-[#16130a] dark:text-gray-400" /> : <ChevronDown className="h-4 w-4 text-[#16130a] dark:text-gray-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t-2 border-[#16130a]/15 dark:border-gray-700 pt-3">
          <div>
            <p className="font-display uppercase text-sm text-[#16130a] dark:text-white mb-1">What is a dividend?</p>
            <p className="text-sm text-[#16130a]/70 dark:text-gray-400 leading-relaxed">
              A dividend is cash that a company pays to its shareholders — just for owning the stock. Think of it like rent income from a property. Companies like Coca-Cola, Johnson &amp; Johnson, and AT&amp;T pay dividends every quarter (4 times a year).
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { term: 'Dividend Yield', plain: 'How much you earn per year as a % of the stock price. A 4% yield on a $100 stock = $4/year.' },
              { term: 'Ex-Dividend Date', plain: 'The cutoff date. You must own the stock BEFORE this date to get the next dividend payment.' },
              { term: 'Payout Ratio', plain: 'What % of profits the company pays out as dividends. Under 60% is generally healthy — leaves room to grow.' },
            ].map(item => (
              <div key={item.term} className="bg-white dark:bg-gray-800 border-2 border-[#16130a] dark:border-gray-700 rounded-xl p-3">
                <p className="font-mono font-bold text-xs text-[#2563eb] dark:text-blue-400 mb-1">{item.term}</p>
                <p className="text-xs text-[#16130a]/60 dark:text-gray-400 leading-relaxed">{item.plain}</p>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-gray-800 border-2 border-[#16130a] dark:border-gray-700 rounded-xl p-3 flex gap-3 items-start">
            <Pin className="h-5 w-5 text-[#16130a] dark:text-gray-400 shrink-0 mt-0.5" />
            <p className="text-xs text-[#16130a]/70 dark:text-gray-400 leading-relaxed">
              <strong className="text-[#16130a] dark:text-white">Quick tip:</strong> A Dividend Aristocrat is a company that has raised its dividend every single year for 25+ years in a row. These are considered very reliable dividend payers — think Coca-Cola, P&amp;G, or Johnson &amp; Johnson.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

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
          <label className={cn(LABEL, 'mb-1.5 block')}>Pick a stock</label>
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#16130a]/40 dark:text-gray-500" />
            <input
              value={selectedTicker || query}
              onChange={e => { const v = e.target.value; setQuery(v); setSelectedTicker(''); setDivData(null); setShowSearch(true) }}
              onFocus={() => setShowSearch(true)}
              placeholder="e.g. Coca-Cola or KO"
              className={cn(INPUT, 'pl-9 pr-10 py-3 text-sm')}
            />
            {selectedTicker && (
              <button onClick={() => { setSelectedTicker(''); setQuery(''); setDivData(null) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#16130a]/40 hover:text-[#16130a] dark:text-gray-500 dark:hover:text-gray-300 text-xs">✕</button>
            )}
            {searchLoading && !selectedTicker && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#16130a]/40 dark:text-gray-500 animate-pulse">...</span>
            )}
            {showSearch && !selectedTicker && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border-2 border-[#16130a] dark:border-gray-700 rounded-xl shadow-[4px_4px_0_#16130a] dark:shadow-xl z-50 overflow-hidden">
                {searchResults.map(r => (
                  <button key={r.ticker} onClick={() => { setSelectedTicker(r.ticker); setQuery(''); setShowSearch(false) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#fff8e1] dark:hover:bg-gray-800 transition-colors text-left">
                    <span className="font-mono text-xs font-bold text-[#2563eb] dark:text-blue-400 w-14 shrink-0">{r.ticker}</span>
                    <span className="text-sm text-[#16130a]/80 dark:text-gray-300 truncate">{r.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-[#16130a]/50 dark:text-gray-500 mt-1.5">Not sure? Try KO, JNJ, or T — these are popular dividend stocks</p>
        </div>

        {/* Investment amount */}
        <div>
          <label className="mb-1.5 flex items-center">
            <span className={LABEL}>How much would you invest?</span>
            <Tip text="Enter how much money you'd put into this stock. We'll calculate exactly how much income that would generate each year." />
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#16130a]/40 dark:text-gray-500" />
            <input
              type="number" min="1" value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="10000"
              className={cn(INPUT, 'pl-9 pr-4 py-3 text-sm font-mono font-bold')}
            />
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {['1000', '5000', '10000', '25000', '50000'].map(a => (
              <button key={a} onClick={() => setAmount(a)} className={pillCls(amount === a)}>
                ${parseInt(a).toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {divLoading && <Skeleton className="h-48 w-full" />}

      {divData && !divLoading && (
        <>
          {/* Stock header */}
          <div className={cn(CARD, 'flex items-center gap-3 p-4')}>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display uppercase text-[#16130a] dark:text-white text-lg">{divData.ticker}</span>
                {divData.isAristocrat && (
                  <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded-full bg-[#ffd23f] border-2 border-[#16130a] text-[#16130a] flex items-center gap-1">
                    <Award className="h-3 w-3" /> Aristocrat
                  </span>
                )}
              </div>
              <p className="text-sm text-[#16130a]/60 dark:text-gray-400">{divData.companyName}</p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-xl text-[#16130a] dark:text-white">{formatCurrency(divData.price ?? 0)}</p>
              <p className="font-mono font-bold text-sm text-green-600 dark:text-green-400">
                {divData.dividendYield ? pct(divData.dividendYield) : divData.trailingDividendYield ? pct(divData.trailingDividendYield) : '—'} yield
              </p>
            </div>
          </div>

          {noPays ? (
            <div className={cn(CARD, 'p-8 text-center')}>
              <Info className="h-8 w-8 text-[#16130a]/30 dark:text-gray-600 mx-auto mb-2" />
              <p className="font-display uppercase text-[#16130a] dark:text-white">{divData.ticker} doesn&apos;t pay a dividend</p>
              <p className="text-[#16130a]/60 dark:text-gray-400 text-sm mt-1">Some companies (like many tech stocks) reinvest profits instead of paying dividends.</p>
              <p className="text-[#16130a]/40 dark:text-gray-500 text-sm mt-1">Try KO, JNJ, T, PEP, or XOM instead</p>
            </div>
          ) : (
            <>
              {/* Income cards */}
              <div>
                <p className="text-sm text-[#16130a]/60 dark:text-gray-400 mb-2">
                  If you invested <span className="font-mono font-bold text-[#16130a] dark:text-white">{formatCurrency(investAmount)}</span> in {divData.ticker}, here&apos;s what you&apos;d earn from dividends alone:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Annual income — the hero, in brand yellow */}
                  <div className="rounded-xl border-2 border-[#16130a] shadow-[3px_3px_0_#16130a] dark:shadow-none bg-[#ffd23f] dark:bg-yellow-500/10 dark:border-yellow-700 p-4 text-center">
                    <p className="font-mono font-bold text-[10px] uppercase tracking-widest text-[#16130a]/60 dark:text-yellow-300/70 mb-1 flex items-center justify-center gap-0.5">
                      Annual Income<Tip text="The total dividend income you'd receive over a full year. Paid out in quarterly chunks." />
                    </p>
                    <p className="font-mono font-bold text-xl text-[#16130a] dark:text-yellow-300">{formatCurrency(annualIncome)}</p>
                    <p className="text-[10px] text-[#16130a]/50 dark:text-yellow-300/50">total per year</p>
                  </div>
                  {[
                    { label: 'Monthly Income', value: formatCurrency(monthlyIncome), color: 'text-[#2563eb] dark:text-blue-400', sub: 'per month (avg)', tip: 'Most dividends are paid quarterly, so this is your annual amount divided by 12.' },
                    { label: 'Quarterly Payment', value: formatCurrency(quarterlyIncome), color: 'text-purple-600 dark:text-purple-400', sub: 'every ~3 months', tip: 'The actual cash that would hit your account each quarter (4x per year).' },
                    { label: 'Yield on Cost', value: `${yieldOnCost.toFixed(2)}%`, color: yieldOnCost >= 4 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400', sub: 'return on your cash', tip: 'The % return you\'re getting purely from dividends — not counting stock price changes. Higher = more income for your money.' },
                  ].map(c => (
                    <div key={c.label} className={cn(CELL, 'p-4 text-center')}>
                      <p className="font-mono font-bold text-[10px] uppercase tracking-widest text-[#16130a]/50 dark:text-gray-400 mb-1 flex items-center justify-center gap-0.5">
                        {c.label}<Tip text={c.tip} />
                      </p>
                      <p className={cn('font-mono font-bold text-xl', c.color)}>{c.value}</p>
                      <p className="text-[10px] text-[#16130a]/40 dark:text-gray-500">{c.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className={cn(CARD, 'p-4')}>
                  <p className={cn(LABEL, 'mb-3')}>Your Position</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Investment', value: formatCurrency(investAmount), tip: 'How much you\'d spend to buy the stock.' },
                      { label: 'Shares You\'d Own', value: shares.toFixed(4), tip: 'Your investment divided by the current share price. Many brokers let you buy fractional shares.' },
                      { label: 'Dividend Per Share / Year', value: bestAnnualRate > 0 ? `$${bestAnnualRate.toFixed(4)}` : '—', tip: 'The company pays this amount per share you own each year. Multiply by your shares to get your income.' },
                      { label: 'Payout Ratio', value: divData.payoutRatio ? pct(divData.payoutRatio) : '—', tip: 'What % of company profits go to dividends. Under 60% is healthy — leaves plenty of room to keep paying and growing the dividend.' },
                      { label: '5-Year Average Yield', value: divData.fiveYearAvgYield ? `${divData.fiveYearAvgYield.toFixed(2)}%` : '—', tip: 'The average dividend yield over the past 5 years. Useful to see if the current yield is unusually high or low.' },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-center text-sm border-b-2 border-[#16130a]/8 dark:border-gray-800 last:border-0 pb-2 last:pb-0">
                        <span className="text-[#16130a]/60 dark:text-gray-400 flex items-center">
                          {row.label}<Tip text={row.tip} />
                        </span>
                        <span className="font-mono font-bold text-[#16130a] dark:text-white">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={cn(CARD, 'p-4')}>
                  <p className={cn(LABEL, 'mb-3')}>Key Dates</p>
                  <div className="space-y-4">
                    {divData.exDividendDate ? (
                      <div className="p-3 rounded-xl bg-orange-500/10 dark:bg-orange-500/5 border-2 border-orange-500/40 dark:border-orange-500/20">
                        <p className="font-mono font-bold text-xs text-orange-600 dark:text-orange-300 mb-0.5">Ex-Dividend Date — {divData.exDividendDate}</p>
                        <p className="text-xs text-[#16130a]/60 dark:text-gray-400 leading-relaxed">
                          <strong className="text-[#16130a] dark:text-white">This is the deadline.</strong> You must own shares before this date to receive the upcoming dividend. Buy on or after this date and you&apos;ll miss it.
                        </p>
                      </div>
                    ) : (
                      <div className={cn(CELL, 'p-3')}>
                        <p className="text-xs text-[#16130a]/50 dark:text-gray-500">Ex-dividend date not available</p>
                      </div>
                    )}
                    {divData.paymentDate ? (
                      <div className="p-3 rounded-xl bg-green-500/10 dark:bg-green-500/5 border-2 border-green-500/40 dark:border-green-500/20">
                        <p className="font-mono font-bold text-xs text-green-600 dark:text-green-300 mb-0.5">Payment Date — {divData.paymentDate}</p>
                        <p className="text-xs text-[#16130a]/60 dark:text-gray-400 leading-relaxed">
                          This is when the cash actually lands in your brokerage account. Usually a few weeks after the ex-dividend date.
                        </p>
                      </div>
                    ) : (
                      <div className={cn(CELL, 'p-3')}>
                        <p className="text-xs text-[#16130a]/50 dark:text-gray-500">Payment date not available</p>
                      </div>
                    )}
                    <p className="text-[10px] text-[#16130a]/40 dark:text-gray-500 leading-relaxed">
                      Past dividends don&apos;t guarantee future payments. Companies can cut or pause dividends. Not financial advice.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {!selectedTicker && !divLoading && (
        <div className="text-center py-10">
          <DollarSign className="h-12 w-12 text-[#16130a]/20 dark:text-gray-700 mx-auto mb-3" />
          <p className="font-display uppercase text-[#16130a] dark:text-white">Pick a stock above to see your dividend income</p>
          <p className="text-[#16130a]/50 dark:text-gray-500 text-sm mt-1">Popular dividend stocks to try:</p>
          <div className="flex gap-2 justify-center mt-3 flex-wrap">
            {[
              { t: 'KO', n: 'Coca-Cola' },
              { t: 'JNJ', n: 'Johnson & Johnson' },
              { t: 'T', n: 'AT&T' },
              { t: 'PEP', n: 'PepsiCo' },
              { t: 'XOM', n: 'ExxonMobil' },
              { t: 'O', n: 'Realty Income' },
            ].map(({ t, n }) => (
              <button key={t} onClick={() => setSelectedTicker(t)}
                className="font-mono text-xs font-bold px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border-2 border-[#16130a]/20 dark:border-gray-600 text-[#16130a]/70 dark:text-gray-300 hover:border-[#2563eb] hover:text-[#2563eb] dark:hover:text-blue-400 transition-colors"
                title={n}>
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
      {/* What to look for */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Yield', tip: 'Higher yield = more income per dollar invested. But very high yields (8%+) can be a warning sign — the company may be struggling.', Icon: TrendingUp },
          { label: 'Annual Dividend', tip: 'The total cash paid per share per year. Multiply by how many shares you\'d own to see your income.', Icon: Banknote },
          { label: 'Aristocrat', tip: 'A Dividend Aristocrat has raised its dividend every year for 25+ years. These are the gold standard of reliable income stocks.', Icon: Crown },
        ].map(item => (
          <div key={item.label} className={cn(CELL, 'flex items-start gap-2 p-3')}>
            <item.Icon className="h-4 w-4 text-[#16130a]/50 dark:text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-mono font-bold text-xs text-[#16130a] dark:text-white">{item.label}</p>
              <p className="text-xs text-[#16130a]/55 dark:text-gray-500 leading-relaxed mt-0.5">{item.tip}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-xs text-[#16130a]/50 dark:text-gray-500">Filter by yield:</span>
        {YIELD_FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={pillCls(filter === f)}>
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
        <div className={cn(CARD, 'p-8 text-center')}><p className="text-[#16130a]/60 dark:text-gray-400">No stocks found for this filter</p></div>
      ) : (
        <>
          <div className="hidden md:grid grid-cols-6 font-mono text-[10px] uppercase tracking-widest text-[#16130a]/40 dark:text-gray-500 px-4 py-2 gap-2">
            <span className="col-span-2">Company</span>
            <span className="text-right">Share Price</span>
            <span className="text-right flex items-center justify-end gap-0.5">
              Yield<Tip text="Annual dividend ÷ stock price. A 4% yield means you earn $4/year for every $100 invested." />
            </span>
            <span className="text-right">Annual Div
              <Tip text="Total cash paid per share per year (and per quarter below)." />
            </span>
            <span className="text-right">Today</span>
          </div>
          {filtered.map((s, i) => (
            <div key={s.ticker} className={cn(CARD, 'p-4 hover:-translate-y-0.5 transition-transform')}>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-center">
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#16130a]/40 dark:text-gray-600 w-5">#{i + 1}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-display uppercase text-[#16130a] dark:text-white">{s.ticker}</span>
                        {s.isAristocrat && (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-full bg-[#ffd23f] border-2 border-[#16130a] text-[#16130a]"><Crown className="h-2.5 w-2.5" /> 25+ yrs</span>
                        )}
                      </div>
                      <p className="text-xs text-[#16130a]/50 dark:text-gray-500 truncate max-w-[160px]">{s.companyName}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-sm text-[#16130a] dark:text-white">${s.price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className={cn('font-mono font-bold text-sm', s.dividendYield >= 0.06 ? 'text-green-600 dark:text-green-400' : s.dividendYield >= 0.04 ? 'text-[#2563eb] dark:text-blue-400' : 'text-[#16130a]/70 dark:text-gray-300')}>
                    {pct(s.dividendYield)}
                  </p>
                  {s.dividendYield >= 0.08 && (
                    <p className="text-[10px] text-orange-600 dark:text-orange-400">Very high</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-[#16130a]/80 dark:text-gray-300">${s.annualDividend.toFixed(2)}/yr</p>
                  <p className="text-xs text-[#16130a]/40 dark:text-gray-600">${s.quarterlyDividend.toFixed(2)}/qtr</p>
                </div>
                <div className="text-right">
                  <p className={cn('font-mono font-bold text-sm', s.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                    {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-[#16130a]/40 dark:text-gray-600 text-center pt-2">Sorted by dividend yield · Live data · High yields (&gt;8%) may signal elevated risk · Not financial advice</p>
        </>
      )}
    </div>
  )
}

// ─── Calendar Tab ────────────────────────────────────────────────────────────

type CalFilter = 'Upcoming' | 'Next Month' | 'Next 3 Months'
const CAL_FILTERS: CalFilter[] = ['Upcoming', 'Next Month', 'Next 3 Months']

function DividendCalendar() {
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [calFilter, setCalFilter] = useState<CalFilter>('Next Month')

  useEffect(() => {
    fetch('/api/dividends/calendar')
      .then(r => r.json())
      .then(d => { setUpcoming(d.upcoming || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = upcoming.filter(e => {
    const days = e.daysUntilExDate
    if (calFilter === 'Upcoming') return days >= 0 && days <= 14
    if (calFilter === 'Next Month') return days >= -7 && days <= 31
    return days >= -7 && days <= 90
  })

  return (
    <div className="space-y-4">
      {/* How to use this */}
      <div className={cn(CARD, 'p-4 space-y-2')}>
        <p className="font-display uppercase text-sm text-[#16130a] dark:text-white">How to use this calendar</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex gap-2 items-start">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-mono font-bold text-xs text-orange-600 dark:text-orange-300">Ex-Dividend Date (the deadline)</p>
              <p className="text-xs text-[#16130a]/60 dark:text-gray-400 leading-relaxed">You must OWN the stock before this date. If you buy on or after it, you&apos;ll miss the next payment.</p>
            </div>
          </div>
          <div className="flex gap-2 items-start">
            <Banknote className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-mono font-bold text-xs text-green-600 dark:text-green-300">Pay Date (when you get paid)</p>
              <p className="text-xs text-[#16130a]/60 dark:text-gray-400 leading-relaxed">The cash hits your brokerage account on this date — usually a few weeks after the ex-dividend date.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-xs text-[#16130a]/50 dark:text-gray-500">Show:</span>
        {CAL_FILTERS.map(f => (
          <button key={f} onClick={() => setCalFilter(f)} className={pillCls(calFilter === f)}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className={cn(CARD, 'p-8 text-center')}>
          <Calendar className="h-10 w-10 text-[#16130a]/20 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-[#16130a]/60 dark:text-gray-400">No ex-dividend dates in this window</p>
          <p className="text-[#16130a]/40 dark:text-gray-500 text-sm mt-1">Try expanding the time range</p>
        </div>
      ) : (
        <>
          <div className="hidden md:grid grid-cols-5 font-mono text-[10px] uppercase tracking-widest text-[#16130a]/40 dark:text-gray-500 px-4 py-2">
            <span className="col-span-2">Company</span>
            <span>Ex-Date (deadline)</span>
            <span>Pay Date</span>
            <span className="text-right">Div / Share</span>
          </div>
          {filtered.map(e => (
            <div key={`${e.ticker}-${e.exDate}`} className={cn('rounded-2xl border-2 p-4 transition-colors',
              e.alreadyPassed
                ? 'opacity-50 border-[#16130a]/20 dark:border-gray-800 bg-white dark:bg-gray-900'
                : e.daysUntilExDate <= 3
                  ? 'border-orange-500 bg-orange-500/10 dark:bg-orange-500/5 shadow-[4px_4px_0_#16130a] dark:shadow-none'
                  : 'border-[#16130a] dark:border-gray-700 bg-white dark:bg-gray-900 shadow-[4px_4px_0_#16130a] dark:shadow-none')}>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-center">
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <span className={cn('font-display uppercase', e.alreadyPassed ? 'text-[#16130a]/50 dark:text-gray-500' : 'text-[#16130a] dark:text-white')}>{e.ticker}</span>
                    {e.alreadyPassed && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-white dark:bg-gray-800 border-2 border-[#16130a]/20 dark:border-gray-700 text-[#16130a]/50 dark:text-gray-500">Passed</span>
                    )}
                    {!e.alreadyPassed && e.daysUntilExDate <= 3 && (
                      <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/15 border-2 border-orange-500/40 text-orange-600 dark:text-orange-400">Act soon!</span>
                    )}
                  </div>
                  <p className="text-xs text-[#16130a]/50 dark:text-gray-500 truncate max-w-[180px]">{e.companyName}</p>
                </div>
                <div>
                  <p className={cn('font-mono font-bold text-sm', e.alreadyPassed ? 'text-[#16130a]/50 dark:text-gray-500' : 'text-[#16130a] dark:text-white')}>{e.exDateFormatted}</p>
                  <p className={cn('text-xs', e.alreadyPassed ? 'text-[#16130a]/40 dark:text-gray-600' : 'text-orange-600/90 dark:text-orange-400/80')}>
                    {e.alreadyPassed
                      ? `${Math.abs(e.daysUntilExDate)} days ago`
                      : e.daysUntilExDate === 0 ? 'Today — last chance!'
                      : e.daysUntilExDate === 1 ? 'Tomorrow — buy today!'
                      : `In ${e.daysUntilExDate} days`}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-sm text-[#16130a]/80 dark:text-gray-300">{e.payDateFormatted ?? '—'}</p>
                  <p className="text-xs text-[#16130a]/40 dark:text-gray-600">cash payment</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-sm text-green-600 dark:text-green-400">
                    {e.dividendAmount ? `$${e.dividendAmount.toFixed(4)}` : '—'}
                  </p>
                  <p className="text-xs text-[#16130a]/40 dark:text-gray-600">per share</p>
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-[#16130a]/40 dark:text-gray-600 text-center pt-1">Covers 40 well-known dividend stocks · Dates subject to company announcements</p>
        </>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DividendsPage() {
  const [tab, setTab] = useState<Tab>('Calculator')

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="grid place-items-center h-11 w-11 rounded-xl bg-green-500 border-2 border-[#16130a] shadow-[3px_3px_0_#16130a] dark:shadow-none shrink-0">
          <DollarSign className="h-6 w-6 text-[#16130a]" />
        </span>
        <div>
          <h1 className="font-display uppercase text-2xl sm:text-3xl text-[#16130a] dark:text-white leading-none">Dividends</h1>
          <p className="font-mono text-xs text-[#16130a]/60 dark:text-gray-400 mt-1">
            Get paid just for owning stocks — calculate income, find the best payers, track payments
          </p>
        </div>
      </div>

      {/* Beginner explainer */}
      <DividendExplainer />

      {/* Tabs — arcade segmented control */}
      <div className="inline-flex gap-1 p-1 rounded-2xl border-2 border-[#16130a] dark:border-gray-700 bg-white dark:bg-gray-900 shadow-[3px_3px_0_#16130a] dark:shadow-none">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2 text-sm font-mono font-bold rounded-xl transition-colors flex items-center gap-1.5',
              tab === t ? 'bg-[#16130a] text-white dark:bg-white dark:text-[#16130a]' : 'text-[#16130a]/55 dark:text-gray-400 hover:text-[#16130a] dark:hover:text-white')}>
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
