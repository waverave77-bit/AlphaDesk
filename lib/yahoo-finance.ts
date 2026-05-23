import https from 'https'

export interface StockQuote {
  ticker: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number | null
  peRatio: number | null
  week52High: number | null
  week52Low: number | null
  dayHigh: number | null
  dayLow: number | null
  openPrice: number | null
  previousClose: number | null
  companyName: string
  sector: string | null
  industry: string | null
  beta: number | null
  eps: number | null
  dividendYield: number | null
  currency: string
}

export interface HistoricalDataPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface StockSearchResult {
  ticker: string
  name: string
  exchange: string
  type: string
}

function httpGetRaw(url: string, extraHeaders: Record<string, string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        ...extraHeaders,
      },
      timeout: 8000,
    }
    https.get(url, options, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        return httpGetRaw(res.headers.location, extraHeaders).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`))
      }
      let data = ''
      res.on('data', (chunk: string) => (data += chunk))
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch { reject(new Error('Invalid JSON')) }
      })
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')))
  })
}

function httpGetRawText(url: string, extraHeaders: Record<string, string> = {}): Promise<{ status: number; headers: any; data: string }> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', ...extraHeaders }, timeout: 8000 }, (res) => {
      let data = ''
      res.on('data', (chunk: string) => (data += chunk))
      res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, data }))
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')))
  })
}

// Crumb + cookie cache for Yahoo Finance quoteSummary (valid ~24h)
let _yahooSession: { cookie: string; crumb: string; fetchedAt: number } | null = null

export async function getYahooCrumb(): Promise<{ cookie: string; crumb: string }> {
  if (_yahooSession && Date.now() - _yahooSession.fetchedAt < 23 * 60 * 60 * 1000) {
    return _yahooSession
  }
  const r1 = await httpGetRawText('https://fc.yahoo.com')
  const cookie = (r1.headers['set-cookie'] as string[] || []).map((c: string) => c.split(';')[0]).join('; ')
  const r2 = await httpGetRawText('https://query1.finance.yahoo.com/v1/test/getcrumb', { Cookie: cookie })
  if (r2.status !== 200 || !r2.data.trim()) throw new Error('Failed to get crumb')
  _yahooSession = { cookie, crumb: r2.data.trim(), fetchedAt: Date.now() }
  return _yahooSession
}

// Cache the last quoteSummary result per ticker so getAnalystData can reuse it without a second HTTP call
const _lastAnalystResult = new Map<string, any>()

// ─── SEC EDGAR helpers ────────────────────────────────────────────────────────
// Free, no API key. Source of truth for EPS: straight from 10-Q / 10-K filings.

const EDGAR_UA = 'AlphaDesk contact@alphadesk.app'  // SEC requires an identifying User-Agent

// Ticker → zero-padded 10-digit CIK (e.g. "0000320193" for AAPL)
const _edgarCikCache = new Map<string, string>()
let _edgarTickerMap: Record<string, string> | null = null

async function getEdgarCik(ticker: string): Promise<string | null> {
  const upper = ticker.toUpperCase()
  if (_edgarCikCache.has(upper)) return _edgarCikCache.get(upper)!
  try {
    if (!_edgarTickerMap) {
      // ~500 KB JSON mapping every public company ticker → CIK. Cached for process lifetime.
      const data = await httpGetRaw(
        'https://www.sec.gov/files/company_tickers.json',
        { 'User-Agent': EDGAR_UA }
      )
      _edgarTickerMap = {}
      for (const entry of Object.values(data) as any[]) {
        _edgarTickerMap[String(entry.ticker).toUpperCase()] =
          String(entry.cik_str).padStart(10, '0')
      }
    }
    const cik = _edgarTickerMap[upper] ?? null
    if (cik) _edgarCikCache.set(upper, cik)
    return cik
  } catch {
    return null
  }
}

// Returns quarterly EPS from EDGAR XBRL facts — typically 10-15 years of data.
// Each entry is a single quarter (~90-day period) from a 10-Q or 10-K filing.
async function getEpsFromEdgar(ticker: string): Promise<EarningsPoint[]> {
  try {
    const cik = await getEdgarCik(ticker)
    if (!cik) return []

    // companyfacts JSON can be several MB for large-cap companies; allow 12s
    const data = await new Promise<any>((resolve, reject) => {
      const options = {
        headers: { 'User-Agent': EDGAR_UA, 'Accept': 'application/json' },
        timeout: 12000,
      }
      https.get(
        `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`,
        options,
        (res) => {
          let raw = ''
          res.on('data', (c: string) => (raw += c))
          res.on('end', () => {
            try { resolve(JSON.parse(raw)) } catch { reject(new Error('JSON parse')) }
          })
        }
      ).on('error', reject).on('timeout', () => reject(new Error('Timeout')))
    })

    // Try diluted EPS first, fall back to basic EPS
    const epsEntries: any[] =
      data?.facts?.['us-gaap']?.EarningsPerShareDiluted?.units?.['USD/shares'] ??
      data?.facts?.['us-gaap']?.EarningsPerShareBasic?.units?.['USD/shares'] ??
      []

    // Keep only single-quarter periods (~90 days) from quarterly/annual filings.
    // Multiple amendments can exist for the same period — keep the most recently filed.
    const byPeriod = new Map<string, { val: number; filed: string }>()
    for (const e of epsEntries) {
      if (!e.start || !e.end || e.val == null) continue
      const days = (new Date(e.end).getTime() - new Date(e.start).getTime()) / 86400000
      if (days < 75 || days > 105) continue
      if (e.form !== '10-Q' && e.form !== '10-K') continue
      const existing = byPeriod.get(e.end)
      if (!existing || e.filed > existing.filed) {
        byPeriod.set(e.end, { val: e.val, filed: e.filed ?? '' })
      }
    }

    return Array.from(byPeriod.entries())
      .map(([date, { val }]) => ({ date, eps: val }))
      .sort((a, b) => a.date.localeCompare(b.date))
  } catch {
    return []
  }
}

// Regular httpGet for non-crumb endpoints (chart, search, news)
async function httpGet(url: string): Promise<any> {
  try {
    return await httpGetRaw(url)
  } catch (err: any) {
    if (err.code === 'ENOTFOUND' || err.message?.includes('Timeout')) {
      const fallback = url.replace('query1.finance.yahoo.com', 'query2.finance.yahoo.com')
      return httpGetRaw(fallback)
    }
    throw err
  }
}

// quoteSummary with crumb auth (required by Yahoo Finance)
async function httpGetSummary(ticker: string, modules: string): Promise<any> {
  const { cookie, crumb } = await getYahooCrumb()
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`
  try {
    return await httpGetRaw(url, { Cookie: cookie })
  } catch (err: any) {
    if (err.message?.includes('HTTP 401')) {
      // Crumb expired — force refresh and retry once
      _yahooSession = null
      const fresh = await getYahooCrumb()
      const retryUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=${modules}&crumb=${encodeURIComponent(fresh.crumb)}`
      return httpGetRaw(retryUrl, { Cookie: fresh.cookie })
    }
    throw err
  }
}

export async function getStockQuote(ticker: string): Promise<StockQuote | null> {
  try {
    const upper = ticker.toUpperCase()
    const chartData = await httpGet(
      `https://query1.finance.yahoo.com/v8/finance/chart/${upper}?interval=1d&range=5d`
    )
    const meta = chartData?.chart?.result?.[0]?.meta
    if (!meta) return null

    const price: number = meta.regularMarketPrice ?? 0
    // Use Yahoo's own regularMarketChange field — this is the official today's change
    // Fallback to manual calc only if the field is missing
    const change: number = meta.regularMarketChange ?? (price - (meta.chartPreviousClose ?? price))
    const changePercent: number = meta.regularMarketChangePercent ?? (meta.chartPreviousClose ? (change / meta.chartPreviousClose) * 100 : 0)
    const prev: number = meta.chartPreviousClose ?? (price - change)

    let sector: string | null = null
    let industry: string | null = null
    let peRatio: number | null = null
    let eps: number | null = null
    let beta: number | null = null
    let dividendYield: number | null = null
    let marketCap: number | null = null

    let analystResult: any = null
    const overrides: { change?: number; changePercent?: number } = {}
    try {
      const summaryData = await httpGetSummary(
        upper,
        'price%2CsummaryDetail%2CassetProfile%2CdefaultKeyStatistics%2CfinancialData%2CrecommendationTrend%2CearningsHistory%2CearningsTrend%2CincomeStatementHistoryQuarterly'
      )
      const result = summaryData?.quoteSummary?.result?.[0] ?? {}
      sector = result.assetProfile?.sector ?? null
      industry = result.assetProfile?.industry ?? null
      peRatio = result.summaryDetail?.trailingPE?.raw ?? result.price?.trailingPE?.raw ?? null
      eps = result.defaultKeyStatistics?.trailingEps?.raw ?? null
      beta = result.summaryDetail?.beta?.raw ?? null
      dividendYield = result.summaryDetail?.dividendYield?.raw ?? null
      marketCap = result.price?.marketCap?.raw ?? null

      // quoteSummary price module is the most authoritative source for today's change
      // (same data Yahoo Finance website uses) — override chart-based values if available
      const qsPrice = result.price ?? {}
      if (qsPrice.regularMarketChange?.raw != null) {
        // Use quoteSummary price module values
        const qsChange: number = qsPrice.regularMarketChange.raw
        const qsChangePercent: number = qsPrice.regularMarketChangePercent?.raw
          ? qsPrice.regularMarketChangePercent.raw * 100
          : (qsChange / (price - qsChange)) * 100
        // Re-assign the outer variables so return block uses them
        Object.assign(overrides, { change: qsChange, changePercent: qsChangePercent })
      }

      analystResult = result
    } catch {
      // fundamentals unavailable — continue with chart data only
    }
    _lastAnalystResult.set(upper, analystResult)

    const finalChange = overrides.change ?? change
    const finalChangePercent = overrides.changePercent ?? changePercent

    return {
      ticker: upper,
      price,
      change: finalChange,
      changePercent: finalChangePercent,
      volume: meta.regularMarketVolume ?? 0,
      marketCap,
      peRatio,
      week52High: meta.fiftyTwoWeekHigh ?? null,
      week52Low: meta.fiftyTwoWeekLow ?? null,
      dayHigh: meta.regularMarketDayHigh ?? null,
      dayLow: meta.regularMarketDayLow ?? null,
      openPrice: null,
      previousClose: prev ?? null,
      companyName: meta.longName ?? meta.shortName ?? upper,
      sector,
      industry,
      beta,
      eps,
      dividendYield,
      currency: meta.currency ?? 'USD',
    }
  } catch (error) {
    console.error(`Failed to fetch quote for ${ticker}:`, error)
    return null
  }
}

export async function getHistoricalData(
  ticker: string,
  range: '1d' | '1w' | '1m' | '3m' | '6m' | 'ytd' | '1y' | '5y'
): Promise<HistoricalDataPoint[]> {
  const rangeMap: Record<string, { range: string; interval: string }> = {
    '1d':  { range: '1d',  interval: '5m' },
    '1w':  { range: '5d',  interval: '1h' },
    '1m':  { range: '1mo', interval: '1d' },
    '3m':  { range: '3mo', interval: '1d' },
    '6m':  { range: '6mo', interval: '1d' },
    'ytd': { range: 'ytd', interval: '1d' },
    '1y':  { range: '1y',  interval: '1wk' },
    '5y':  { range: '5y',  interval: '1wk' },
  }
  const { range: yfRange, interval } = rangeMap[range] ?? rangeMap['1m']

  try {
    const data = await httpGet(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker.toUpperCase()}?interval=${interval}&range=${yfRange}`
    )
    const result = data?.chart?.result?.[0]
    if (!result) return []

    const timestamps: number[] = result.timestamp ?? []
    const ohlcv = result.indicators?.quote?.[0] ?? {}
    const opens: number[] = ohlcv.open ?? []
    const highs: number[] = ohlcv.high ?? []
    const lows: number[] = ohlcv.low ?? []
    const closes: number[] = ohlcv.close ?? []
    const volumes: number[] = ohlcv.volume ?? []

    return timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000).toISOString(),
        open: opens[i] ?? 0,
        high: highs[i] ?? 0,
        low: lows[i] ?? 0,
        close: closes[i] ?? 0,
        volume: volumes[i] ?? 0,
      }))
      .filter((d) => d.close > 0)
  } catch (error) {
    console.error(`Failed to fetch historical data for ${ticker}:`, error)
    return []
  }
}

export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  try {
    const data = await httpGet(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0&listsCount=0`
    )
    const quotes: any[] = data?.quotes ?? []
    return quotes
      .filter((q) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
      .map((q) => ({
        ticker: q.symbol ?? '',
        name: q.longname ?? q.shortname ?? q.symbol ?? '',
        exchange: q.exchDisp ?? q.exchange ?? '',
        type: q.quoteType ?? '',
      }))
      .filter((q) => q.ticker)
  } catch (error) {
    console.error(`Search failed for "${query}":`, error)
    return []
  }
}

export async function getMultipleQuotes(tickers: string[]): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>()
  const settled = await Promise.allSettled(tickers.map((t) => getStockQuote(t)))
  settled.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value) {
      results.set(tickers[i], result.value)
    }
  })
  return results
}

export async function getStockNews(
  ticker: string
): Promise<{ title: string; link: string; publisher: string; providerPublishTime: number }[]> {
  try {
    const data = await httpGet(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&quotesCount=0&newsCount=8&listsCount=0`
    )
    const news: any[] = data?.news ?? []
    return news.map((n) => ({
      title: n.title ?? '',
      link: n.link ?? '',
      publisher: n.publisher ?? '',
      providerPublishTime: n.providerPublishTime ?? 0,
    }))
  } catch {
    return []
  }
}

export interface AnalystData {
  recommendation: 'buy' | 'hold' | 'sell' | 'strong_buy' | 'strong_sell' | null
  recommendationLabel: string
  numberOfAnalysts: number | null
  targetLow: number | null
  targetMedian: number | null
  targetHigh: number | null
  targetMean: number | null
  buyCount: number
  holdCount: number
  sellCount: number
  strongBuyCount: number
  strongSellCount: number
}

// ─── Earnings History ─────────────────────────────────────────────────────────

export interface EarningsPoint {
  date: string   // ISO date string for the quarter end
  eps: number    // actual EPS for that quarter
}

// Sector → typical "normal" P/E multiple used for fair-value calculation.
// These are long-run medians, not current frothy multiples.
export const SECTOR_NORMAL_PE: Record<string, number> = {
  'Technology': 25,
  'Communication Services': 20,
  'Consumer Cyclical': 20,
  'Consumer Defensive': 20,
  'Healthcare': 20,
  'Financial Services': 13,
  'Industrials': 18,
  'Basic Materials': 15,
  'Energy': 12,
  'Utilities': 16,
  'Real Estate': 20,
}
export const DEFAULT_NORMAL_PE = 18

// Returns up to ~10-15 years of quarterly EPS + forward estimates so the chart
// can build a trailing-12-month EPS line → fair value = EPS × normalPE
//
// Data sources layered in priority order (later layers overwrite earlier ones):
//  1. SEC EDGAR XBRL (primary)  — diluted EPS from actual 10-Q/10-K filings, 10-15 years
//  2. Yahoo incomeStatementHistoryQuarterly — net income ÷ shares, ~5 years (fills any EDGAR gaps)
//  3. Yahoo earningsHistory      — actual reported EPS last 4 quarters (most accurate recent data)
//  4. Yahoo earningsTrend        — forward quarterly estimates (+1q, +2q)
export async function getEarningsHistory(ticker: string): Promise<EarningsPoint[]> {
  const upper = ticker.toUpperCase()
  try {
    const raw = _lastAnalystResult.get(upper)

    const byDate = new Map<string, number>()

    // ── Layer 1: SEC EDGAR — 10-15 years of clean quarterly EPS ──────────────
    // Run in parallel with the Yahoo layers; if it times out we still have Yahoo data.
    const edgarPromise = getEpsFromEdgar(upper).catch(() => [] as EarningsPoint[])

    // ── Layer 2: Yahoo income statements — ~5 years (fallback if EDGAR is slow) ─
    if (raw) {
      const sharesOutstanding: number | null =
        raw?.defaultKeyStatistics?.sharesOutstanding?.raw ?? null
      const incomeQs: any[] = raw?.incomeStatementHistoryQuarterly?.incomeStatementHistory ?? []
      if (sharesOutstanding && sharesOutstanding > 0) {
        for (const q of incomeQs) {
          const ts: number = q.endDate?.raw
          const netIncome: number =
            q.netIncomeApplicableToCommonShares?.raw ?? q.netIncome?.raw
          if (ts && netIncome != null) {
            byDate.set(new Date(ts * 1000).toISOString().slice(0, 10), netIncome / sharesOutstanding)
          }
        }
      }
    }

    // ── Layer 1 result (EDGAR) overwrites Yahoo income statement estimates ────
    const edgarPoints = await edgarPromise
    for (const { date, eps } of edgarPoints) {
      byDate.set(date, eps)
    }

    // ── Layer 3: Yahoo actual EPS — most accurate for last 4 quarters ─────────
    if (raw) {
      for (const q of (raw?.earningsHistory?.history ?? []) as any[]) {
        const ts: number = q.quarter?.raw
        const eps: number = q.epsActual?.raw
        if (ts && eps != null) {
          byDate.set(new Date(ts * 1000).toISOString().slice(0, 10), eps)
        }
      }
    }

    // ── Layer 4: Forward estimates (+1q, +2q) ─────────────────────────────────
    if (raw) {
      for (const t of (raw?.earningsTrend?.trend ?? []) as any[]) {
        if (!t.period?.startsWith('+')) continue
        const eps: number = t.earningsEstimate?.avg?.raw
        const endDate: string = t.endDate?.fmt
        if (eps != null && endDate) byDate.set(endDate, eps)
      }
    }

    return Array.from(byDate.entries())
      .map(([date, eps]) => ({ date, eps }))
      .sort((a, b) => a.date.localeCompare(b.date))
  } catch {
    return []
  }
}

export async function getAnalystData(ticker: string): Promise<AnalystData> {
  const empty: AnalystData = {
    recommendation: null, recommendationLabel: 'N/A',
    numberOfAnalysts: null, targetLow: null, targetMedian: null,
    targetHigh: null, targetMean: null,
    buyCount: 0, holdCount: 0, sellCount: 0, strongBuyCount: 0, strongSellCount: 0,
  }

  const upper = ticker.toUpperCase()

  // Reuse the result already fetched by getStockQuote to avoid a second rate-limited call
  let result = _lastAnalystResult.get(upper)

  if (!result) {
    // getStockQuote hasn't been called yet — fetch just the analyst modules
    try {
      const data = await httpGetSummary(upper, 'financialData%2CrecommendationTrend')
      result = data?.quoteSummary?.result?.[0] ?? {}
    } catch {
      return empty
    }
  }

  try {
    const fin = result?.financialData ?? {}
    const trend = result?.recommendationTrend?.trend?.[0] ?? {}

    const recKey: string = fin.recommendationKey ?? ''
    const labelMap: Record<string, string> = {
      'strong_buy': 'Strong Buy', 'buy': 'Buy',
      'hold': 'Hold', 'underperform': 'Sell', 'sell': 'Strong Sell',
    }

    return {
      recommendation: (recKey as any) || null,
      recommendationLabel: labelMap[recKey] ?? (recKey ? recKey.charAt(0).toUpperCase() + recKey.slice(1) : 'N/A'),
      numberOfAnalysts: fin.numberOfAnalystOpinions?.raw ?? null,
      targetLow: fin.targetLowPrice?.raw ?? null,
      targetMedian: fin.targetMedianPrice?.raw ?? null,
      targetHigh: fin.targetHighPrice?.raw ?? null,
      targetMean: fin.targetMeanPrice?.raw ?? null,
      strongBuyCount: trend.strongBuy ?? 0,
      buyCount: trend.buy ?? 0,
      holdCount: trend.hold ?? 0,
      sellCount: trend.sell ?? 0,
      strongSellCount: trend.strongSell ?? 0,
    }
  } catch {
    return empty
  }
}
