'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import InfoTooltip from '@/components/InfoTooltip'
import LastUpdated from '@/components/LastUpdated'

const EXAMPLES = ['AAPL', 'MSFT', 'TSLA', 'JPM', 'NVDA', 'META']

function scoreBar(score: number, color: string) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-gray-300 w-8 text-right font-mono">{score}</span>
    </div>
  )
}

export default function QuantPage() {
  const [ticker, setTicker] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null)
  const [suggestions, setSuggestions] = useState<{ ticker: string; name: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 1) { setSuggestions([]); setShowSuggestions(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stock/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setSuggestions(data.results?.slice(0, 6) ?? [])
        setShowSuggestions(true)
        setActiveIdx(-1)
      } catch { setSuggestions([]) }
    }, 200)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function analyze(t: string) {
    const sym = t.trim().toUpperCase()
    if (!sym) return
    setLoading(true)
    setResult(null)
    try {
      const r = await fetch(`/api/stock/${sym}`)
      const { quote } = await r.json()
      if (!quote) { setResult({ error: true, ticker: sym }); return }

      const { price, peRatio, beta, week52High, week52Low, dividendYield, eps, marketCap, sector, companyName } = quote

      // 52-Week Price Position: where the current price sits within the year's range
      // Note: this measures relative price positioning, not momentum in the academic sense
      let pricePosition = 50
      if (week52High && week52Low && week52High !== week52Low) {
        const pos = ((price - week52Low) / (week52High - week52Low)) * 100
        pricePosition = Math.round(pos)
      }

      // Value: P/E vs sector median
      // Sector medians below are approximate long-run averages — they shift with earnings cycles.
      // Energy and cyclicals are especially volatile; treat these as rough benchmarks only.
      const sectorPE: Record<string, number> = {
        Technology: 28, Healthcare: 22, Financials: 14,
        'Consumer Discretionary': 20, 'Consumer Staples': 18,
        Energy: 15, Industrials: 18, Materials: 16,
        'Real Estate': 28, Utilities: 18, 'Communication Services': 22,
      }
      const avgPE = sector ? (sectorPE[sector] ?? 20) : 20
      let value = 50
      if (peRatio && peRatio > 0) {
        if (peRatio < avgPE * 0.5) value = 90
        else if (peRatio < avgPE * 0.7) value = 75
        else if (peRatio < avgPE) value = 60
        else if (peRatio < avgPE * 1.3) value = 45
        else if (peRatio < avgPE * 1.6) value = 30
        else value = 15
        // Dividend yield adds a small value bonus only if EPS coverage is confirmed
        // (a high yield from a collapsing stock price is a "value trap" — we can't fully guard
        // against that here, so apply only a modest adjustment)
        if (dividendYield && dividendYield > 0.02 && dividendYield < 0.10) value = Math.min(100, value + 5)
      }

      // Fundamentals: profitability, size — NOT volatility (beta is a volatility measure, not quality)
      let quality = 40
      if (eps && eps > 0) quality += 40           // profitable
      if (marketCap && marketCap > 10e9) quality += 30  // large-cap stability
      if (marketCap && marketCap > 100e9) quality += 10 // mega-cap bonus
      quality = Math.min(100, quality)

      // Low Volatility: inverted beta — lower price swings relative to market = higher score
      let volRisk = 50
      if (beta) {
        if (beta < 0.6) volRisk = 90
        else if (beta < 0.8) volRisk = 75
        else if (beta < 1.0) volRisk = 60
        else if (beta < 1.3) volRisk = 45
        else if (beta < 1.6) volRisk = 30
        else volRisk = 15
      }

      // Combined uses all 4 factors equally
      const combined = Math.round((pricePosition + value + quality + volRisk) / 4)
      let signal: 'OVERWEIGHT' | 'NEUTRAL' | 'UNDERWEIGHT' = 'NEUTRAL'
      if (combined >= 62) signal = 'OVERWEIGHT'
      else if (combined < 38) signal = 'UNDERWEIGHT'

      const rationale = signal === 'OVERWEIGHT'
        ? `Factor model favors this stock: ${value >= 60 ? 'valuation looks attractive vs. sector, ' : ''}${pricePosition >= 60 ? 'price near yearly high, ' : ''}${quality >= 70 ? 'strong fundamentals' : 'reasonable fundamentals'}. Not a buy recommendation — do your own research.`
        : signal === 'UNDERWEIGHT'
        ? `Factor model flags concerns: ${value < 40 ? 'stretched valuation vs. sector, ' : ''}${pricePosition < 40 ? 'price near yearly low, ' : ''}${quality < 50 ? 'weak fundamentals' : 'mixed signals'}. Not a sell recommendation — factors alone don't capture the full picture.`
        : `Mixed signals across factors. No strong directional edge right now. This is a quantitative screen only — not a recommendation to buy or sell.`

      const momentum = pricePosition // keep for display compatibility

      setResult({ ticker: sym, companyName, signal, combined, momentum, value, quality, volRisk, rationale, sector })
      setLastAnalyzed(new Date())
    } catch {
      setResult({ error: true, ticker: t })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">Quant Strategy <InfoTooltip text="A quantitative (math-based) approach to picking stocks. Instead of gut feelings, it uses measurable factors like momentum and earnings to generate buy/sell signals." /></h1>
        <p className="text-sm text-gray-400 mt-1">Factor-based over/underweight signals using momentum, value, quality & volatility</p>
      </div>

      {/* Explainer */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5" /> What is this?
        </p>
        <p className="text-sm text-blue-600 leading-relaxed">
          Instead of gut feelings, quant strategy uses math to score stocks. We measure <strong>momentum</strong> (is it trending up?), <strong>value</strong> (is it cheap?), <strong>quality</strong> (is the business healthy?), and <strong>volatility</strong> (how risky is it?) to generate a buy, hold, or sell signal.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex gap-3" ref={wrapperRef}>
            <div className="flex-1 relative">
              <input
                value={ticker}
                onChange={e => {
                  setTicker(e.target.value)
                  fetchSuggestions(e.target.value)
                }}
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)) }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
                  else if (e.key === 'Enter') {
                    if (activeIdx >= 0 && suggestions[activeIdx]) {
                      const s = suggestions[activeIdx]
                      setTicker(s.ticker); setShowSuggestions(false); analyze(s.ticker)
                    } else {
                      setShowSuggestions(false); analyze(ticker)
                    }
                  } else if (e.key === 'Escape') { setShowSuggestions(false) }
                }}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                placeholder="Enter ticker or company name (e.g. Apple, AAPL)"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-xl">
                  {suggestions.map((s, i) => (
                    <button
                      key={s.ticker}
                      onMouseDown={e => { e.preventDefault(); setTicker(s.ticker); setShowSuggestions(false); analyze(s.ticker) }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        i === activeIdx ? 'bg-blue-600/20' : 'hover:bg-gray-800'
                      )}
                    >
                      <span className="text-xs font-bold text-blue-400 w-14 shrink-0">{s.ticker}</span>
                      <span className="text-sm text-gray-300 truncate">{s.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={() => { setShowSuggestions(false); analyze(ticker) }} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              <Search className="h-4 w-4 mr-2" />{loading ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {EXAMPLES.map(e => (
              <button key={e} onClick={() => { setTicker(e); setShowSuggestions(false); analyze(e) }}
                className="text-xs px-3 py-1 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors border border-gray-700">
                {e}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {result?.error && (
        <Card><CardContent className="p-5"><p className="text-sm text-red-400">Could not analyze {result.ticker}. Try a valid US ticker.</p></CardContent></Card>
      )}

      {result && !result.error && (() => {
        const signalColor = result.signal === 'OVERWEIGHT' ? 'text-green-400' : result.signal === 'UNDERWEIGHT' ? 'text-red-400' : 'text-yellow-400'
        const signalBg = result.signal === 'OVERWEIGHT' ? 'bg-green-400/10 border-green-400/20' : result.signal === 'UNDERWEIGHT' ? 'bg-red-400/10 border-red-400/20' : 'bg-yellow-400/10 border-yellow-400/20'
        const SignalIcon = result.signal === 'OVERWEIGHT' ? TrendingUp : result.signal === 'UNDERWEIGHT' ? TrendingDown : Minus

        return (
          <div className="space-y-4">
            <Card>
              <CardContent className={cn('p-5 rounded-xl border', signalBg)}>
                <div className="flex items-center gap-4">
                  <SignalIcon className={cn('h-10 w-10', signalColor)} />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">Quant Signal for {result.ticker} <InfoTooltip text="A factor model signal based on 4 equally-weighted scores: price position, value, fundamentals, and volatility. This is a quantitative screen — not a buy or sell recommendation." /><LastUpdated time={lastAnalyzed} className="ml-2" /></p>
                    <p className={cn('text-4xl font-bold', signalColor)}>{result.signal}</p>
                    <p className="text-sm text-gray-400">{result.companyName}{result.sector ? ` · ${result.sector}` : ''}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-gray-500">Factor Score</p>
                    <p className={cn('text-3xl font-bold', signalColor)}>{result.combined}<span className="text-base text-gray-500">/100</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-1">Factor Scores <InfoTooltip text="Four separate scores (0–100) that measure different aspects of a stock. They're averaged together to produce the overall Quant Signal." /></p>
                <div className="space-y-4">
                  {[
                    { label: '52-Week Position', score: result.momentum, desc: 'Where price sits in yearly range', color: 'bg-blue-500', tip: 'Where the current price sits within the stock\'s 52-week range. A score near 100 means the price is close to its yearly high; near 0 means close to its yearly low. This is a price-positioning measure — not a prediction of future direction.' },
                    { label: 'Value', score: result.value, desc: 'P/E vs. sector median', color: 'bg-purple-500', tip: 'Is the stock cheap or expensive relative to its sector? Compares the P/E ratio (price per $1 of earnings) to an approximate sector median. Higher score = lower relative valuation. Sector medians are long-run averages and shift with earnings cycles — use as a rough benchmark only.' },
                    { label: 'Quality', score: result.quality, desc: 'Profitability & company size', color: 'bg-teal-500', tip: 'A simple proxy for business quality: is the company profitable (positive EPS) and how large is it (market cap)? Larger, profitable companies tend to be more stable. This is a rough screen — it does not capture debt levels, margins, or growth.' },
                    { label: 'Low Volatility', score: result.volRisk, desc: 'Beta-based price stability', color: 'bg-orange-500', tip: 'How much does this stock move relative to the overall market? Beta < 1 means it tends to swing less than the market (higher score here). Beta > 1 means it swings more. Lower volatility can mean lower risk — but also lower upside.' },
                  ].map(({ label, score, desc, color, tip }) => (
                    <div key={label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-300 font-medium flex items-center gap-1">{label} <InfoTooltip text={tip} /></span>
                        <span className="text-xs text-gray-500">{desc}</span>
                      </div>
                      {scoreBar(score, color)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2 flex items-center gap-1">Quant Rationale <InfoTooltip text="A plain-English explanation of why the model gave this signal, based on which factors were strongest or weakest." /></p>
                <p className="text-sm text-gray-300 leading-relaxed">{result.rationale}</p>
              </CardContent>
            </Card>

            <p className="text-xs text-gray-600 text-center">Based on quantitative factor analysis using public market data. Not financial advice.</p>
          </div>
        )
      })()}

      {!result && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <TrendingUp className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Enter a ticker above to get a quant factor analysis</p>
            <p className="text-gray-600 text-xs mt-1">Analyzes momentum, value, quality, and volatility factors</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
