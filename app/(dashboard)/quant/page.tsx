'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react'
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

      // Momentum: 52-week position
      let momentum = 50
      if (week52High && week52Low && week52High !== week52Low) {
        const pos = ((price - week52Low) / (week52High - week52Low)) * 100
        momentum = Math.round(pos)
      }

      // Value: Price vs. company earningss
      const sectorPE: Record<string, number> = { Technology: 28, Healthcare: 22, Financials: 14, 'Consumer Discretionary': 20, 'Consumer Staples': 18, Energy: 12, Industrials: 18, Materials: 15, 'Real Estate': 25, Utilities: 16, 'Communication Services': 22 }
      const avgPE = sector ? (sectorPE[sector] ?? 20) : 20
      let value = 50
      if (peRatio && peRatio > 0) {
        if (peRatio < avgPE * 0.5) value = 90
        else if (peRatio < avgPE * 0.7) value = 75
        else if (peRatio < avgPE) value = 60
        else if (peRatio < avgPE * 1.3) value = 45
        else if (peRatio < avgPE * 1.6) value = 30
        else value = 15
        if (dividendYield && dividendYield > 0.02) value = Math.min(100, value + 10)
      }

      // Quality
      let quality = 40
      if (eps && eps > 0) quality += 30
      if (beta && beta < 1.2) quality += 25
      if (marketCap && marketCap > 10e9) quality += 25
      quality = Math.min(100, quality)

      // Volatility risk (inverted, lower beta = higher score)
      let volRisk = 50
      if (beta) {
        if (beta < 0.8) volRisk = 85
        else if (beta < 1.0) volRisk = 70
        else if (beta < 1.3) volRisk = 50
        else if (beta < 1.6) volRisk = 30
        else volRisk = 15
      }

      const combined = Math.round((momentum + value + quality) / 3)
      let signal: 'OVERWEIGHT' | 'NEUTRAL' | 'UNDERWEIGHT' = 'NEUTRAL'
      if (combined >= 65) signal = 'OVERWEIGHT'
      else if (combined < 40) signal = 'UNDERWEIGHT'

      const rationale = signal === 'OVERWEIGHT'
        ? `Strong overall score: ${value >= 60 ? 'attractively priced, ' : ''}${momentum >= 60 ? 'strong momentum, ' : ''}${quality >= 70 ? 'high quality fundamentals' : 'reasonable fundamentals'}. The combination of factors supports an overweight position.`
        : signal === 'UNDERWEIGHT'
        ? `Weak factor profile: ${value < 40 ? 'stretched valuation, ' : ''}${momentum < 40 ? 'weak momentum, ' : ''}${quality < 50 ? 'quality concerns' : 'mixed fundamentals'}. Factor signals collectively point to underweight.`
        : `Mixed signals. No single factor is strongly positive or negative right now. Maintain market-weight exposure and monitor for catalyst shifts.`

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
                    <p className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">Quant Signal for {result.ticker} <InfoTooltip text="The overall recommendation based on all 4 factors combined into one score." /><LastUpdated time={lastAnalyzed} className="ml-2" /></p>
                    <p className={cn('text-4xl font-bold', signalColor)}>{result.signal}</p>
                    <p className="text-sm text-gray-400">{result.companyName}{result.sector ? ` · ${result.sector}` : ''}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-gray-500">Combined Score</p>
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
                    { label: 'Momentum', score: result.momentum, desc: 'price vs. past year', color: 'bg-blue-500', tip: 'How well the stock has done over the past year. A high score means the price has been climbing steadily.' },
                    { label: 'Value', score: result.value, desc: 'Price vs. company earnings', color: 'bg-purple-500', tip: 'Is the stock cheap or expensive? Compares the P/E ratio (what you pay per $1 of earnings) to the average in its sector. Higher score = better value.' },
                    { label: 'Quality', score: result.quality, desc: 'Profits, price swings, company size', color: 'bg-teal-500', tip: 'How healthy is the business? Looks at whether the company is profitable (EPS), stable (low beta), and large (market cap). Higher = stronger business.' },
                    { label: 'Low Volatility', score: result.volRisk, desc: 'Beta-based risk score', color: 'bg-orange-500', tip: 'How calm or wild is this stock? Lower volatility = fewer scary swings. A high score here means the stock tends to move less than the overall market.' },
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
