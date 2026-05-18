import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getStockQuote, getAnalystData, getEarningsHistory, SECTOR_NORMAL_PE, DEFAULT_NORMAL_PE } from '@/lib/yahoo-finance'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Ticker resolution ─────────────────────────────────────────────────────────

// Common finance/English words that look like tickers but aren't
const TICKER_SKIP = new Set([
  'AI','ETF','CEO','IPO','GDP','EPS','PE','BUY','SELL','USD','US','UK','EU',
  'FED','SEC','NYSE','SP','IRA','YTD','ATH','ATL','QE','QT','VC','MA','PA',
  'OR','IF','IN','AT','TO','OF','ON','BY','BE','IT','IS','AS','AN','AM',
  'DO','GO','HI','SO','UP','NO','OK','ALL','AND','THE','FOR','NOT','BUT',
  'ARE','WAS','HAS','HAD','CAN','DID','GOT','GET','SET','LET','PUT',
  'NEW','OLD','BIG','LOW','HIGH','TOP','BOT','NOW','HOW','WHY','WHO',
  'PPT','OTC','AUM','NAV','TTM','LTM','DCF','ROE','ROI','FCF','EV',
  'MKT','CAP','DIV','CPI','PPI','PMI','NFP','IMF','ECB','BOJ','RBA',
])

// Company name → ticker for fast lookup (case-insensitive)
const NAME_TO_TICKER: Record<string, string> = {
  'apple': 'AAPL', 'microsoft': 'MSFT', 'google': 'GOOGL', 'alphabet': 'GOOGL',
  'amazon': 'AMZN', 'meta': 'META', 'facebook': 'META', 'netflix': 'NFLX',
  'nvidia': 'NVDA', 'tesla': 'TSLA', 'amd': 'AMD', 'intel': 'INTC',
  'salesforce': 'CRM', 'spotify': 'SPOT', 'snapchat': 'SNAP', 'snap': 'SNAP',
  'roblox': 'RBLX', 'disney': 'DIS', 'nike': 'NKE', 'walmart': 'WMT',
  'sofi': 'SOFI', 'sofi technologies': 'SOFI',
  'palantir': 'PLTR', 'coinbase': 'COIN', 'robinhood': 'HOOD',
  'uber': 'UBER', 'lyft': 'LYFT', 'airbnb': 'ABNB', 'doordash': 'DASH',
  'shopify': 'SHOP', 'square': 'SQ', 'block': 'SQ', 'paypal': 'PYPL',
  'visa': 'V', 'mastercard': 'MA', 'jpmorgan': 'JPM', 'jp morgan': 'JPM',
  'bank of america': 'BAC', 'goldman': 'GS', 'goldman sachs': 'GS',
  'morgan stanley': 'MS', 'wells fargo': 'WFC', 'citigroup': 'C', 'citi': 'C',
  'blackrock': 'BLK', 'berkshire': 'BRK-B', 'warren buffett': 'BRK-B',
  'amc': 'AMC', 'gamestop': 'GME', 'gme': 'GME',
  'crowdstrike': 'CRWD', 'cloudflare': 'NET', 'datadog': 'DDOG',
  'snowflake': 'SNOW', 'arm': 'ARM', 'qualcomm': 'QCOM',
  'broadcom': 'AVGO', 'asml': 'ASML', 'tsmc': 'TSM', 'samsung': '005930.KS',
  'eli lilly': 'LLY', 'lilly': 'LLY', 'pfizer': 'PFE', 'moderna': 'MRNA',
  'johnson': 'JNJ', 'johnson and johnson': 'JNJ', 'abbvie': 'ABBV',
  'unitedhealth': 'UNH', 'cvs': 'CVS',
  'exxon': 'XOM', 'chevron': 'CVX', 'shell': 'SHEL', 'bp': 'BP',
  'ford': 'F', 'general motors': 'GM', 'rivian': 'RIVN', 'lucid': 'LCID',
  'boeing': 'BA', 'lockheed': 'LMT', 'raytheon': 'RTX', 'caterpillar': 'CAT',
  'deere': 'DE', 'john deere': 'DE',
  'starbucks': 'SBUX', 'mcdonalds': 'MCD', "mcdonald's": 'MCD',
  'costco': 'COST', 'target': 'TGT', 'home depot': 'HD', 'lowes': 'LOW',
  'pepsico': 'PEP', 'pepsi': 'PEP', 'coca cola': 'KO', 'coke': 'KO',
  'procter': 'PG', 'procter and gamble': 'PG',
  'att': 'T', 'at&t': 'T', 'verizon': 'VZ', 't-mobile': 'TMUS',
  'twitter': 'X', 'x corp': 'X',
  'super micro': 'SMCI', 'supermicro': 'SMCI',
  'marvell': 'MRVL', 'micron': 'MU', 'western digital': 'WDC', 'seagate': 'STX',
  'oracle': 'ORCL', 'ibm': 'IBM', 'hp': 'HPQ', 'dell': 'DELL', 'cisco': 'CSCO',
  'zoom': 'ZM', 'slack': 'CRM', 'docusign': 'DOCU', 'hubspot': 'HUBS',
  'mongodb': 'MDB', 'elastic': 'ESTC', 'confluent': 'CFLT', 'gitlab': 'GTLB',
  'twilio': 'TWLO', 'sendgrid': 'TWLO', 'okta': 'OKTA', 'ping': 'PING',
  'trade desk': 'TTD', 'the trade desk': 'TTD',
  'draftkings': 'DKNG', 'penn': 'PENN', 'mgm': 'MGM', 'wynn': 'WYNN',
  'charles schwab': 'SCHW', 'schwab': 'SCHW', 'fidelity': 'FNF',
  'interactive brokers': 'IBKR',
  'palo alto': 'PANW', 'palo alto networks': 'PANW',
  'fortinet': 'FTNT', 'zscaler': 'ZS', 'sentinelone': 'S',
  'servicenow': 'NOW', 'workday': 'WDAY', 'veeva': 'VEEV',
  'intuitive surgical': 'ISRG', 'illumina': 'ILMN', 'crispr': 'CRSP',
  'upstart': 'UPST', 'affirm': 'AFRM', 'klarna': 'KLAR',
  'samsara': 'IOT',
  'redfin': 'RDFN', 'zillow': 'Z', 'opendoor': 'OPEN',
  'nio': 'NIO', 'byd': 'BYDDY',
  'bitcoin': 'BTC-USD', 'ethereum': 'ETH-USD', 'btc': 'BTC-USD', 'eth': 'ETH-USD',
}

// Search Yahoo Finance for a company name → returns best ticker or null
async function yahooSearch(query: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(query.trim())
    const res = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${q}&quotesCount=3&newsCount=0&listsCount=0`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    // Prefer US equities over ADRs/ETFs/etc.
    const quotes: any[] = data?.quotes ?? []
    const equity = quotes.find(q =>
      (q.typeDisp === 'Equity' || q.quoteType === 'EQUITY') &&
      !q.symbol?.includes('.') // prefer US-listed (no . in symbol)
    ) ?? quotes.find(q => q.typeDisp === 'Equity' || q.quoteType === 'EQUITY')
    return equity?.symbol ?? null
  } catch {
    return null
  }
}

// Extract the most likely company/ticker search term from freeform text
function extractSearchTerms(message: string): string {
  const stopWords = new Set([
    'what', 'which', 'should', 'would', 'could', 'i', 'buy', 'sell', 'me',
    'tell', 'about', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'do',
    'does', 'did', 'how', 'why', 'when', 'where', 'can', 'will', 'best',
    'stocks', 'stock', 'good', 'based', 'on', 'of', 'to', 'for', 'in', 'at',
    'with', 'still', 'happening', 'right', 'now', 'gimme', 'give', 'get',
    'analysis', 'analyze', 'think', 'thoughts', 'take', 'opinion', 'your',
    'my', 'any', 'some', 'this', 'that', 'then', 'than', 'too', 'also',
    'just', 'so', 'up', 'down', 'and', 'or', 'but', 'if', 'its', 'it',
    'hold', 'worth', 'look', 'looks', 'like', 'feel', 'feels', 'seem',
    'investing', 'investment', 'trade', 'trading', 'position',
  ])
  return message
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .slice(0, 4)
    .join(' ')
}

// Resolve tickers from a user message — validates every candidate against Yahoo
async function resolveTickers(message: string): Promise<string[]> {
  const highConfidence = new Set<string>() // $TICKER or known company name
  const candidates = new Set<string>()     // uppercase words to validate

  // 1. $TICKER format → always try
  const dollarMatches = message.match(/\$([A-Za-z]{1,5})/g) ?? []
  dollarMatches.forEach(m => highConfidence.add(m.slice(1).toUpperCase()))

  // 2. Known company name map → always try
  const lower = message.toLowerCase()
  for (const [name, ticker] of Object.entries(NAME_TO_TICKER)) {
    if (lower.includes(name)) highConfidence.add(ticker)
  }

  // 3. Bare uppercase 2-5 char words (medium confidence)
  if (highConfidence.size === 0) {
    const upperMatches = message.match(/\b([A-Z]{1,5})\b/g) ?? []
    upperMatches.forEach(m => {
      if (!TICKER_SKIP.has(m) && m.length >= 1) candidates.add(m)
    })
  }

  // Validate high-confidence in parallel — filter out any that Yahoo doesn't recognise
  const validHighConf = await Promise.all(
    Array.from(highConfidence).slice(0, 4).map(async (t) => {
      const q = await getStockQuote(t).catch(() => null)
      return q ? t : null
    })
  )
  const validated = validHighConf.filter(Boolean) as string[]

  // Validate medium-confidence uppercase words
  if (validated.length === 0 && candidates.size > 0) {
    const validCandidates = await Promise.all(
      Array.from(candidates).slice(0, 5).map(async (t) => {
        const q = await getStockQuote(t).catch(() => null)
        return q ? t : null
      })
    )
    validated.push(...(validCandidates.filter(Boolean) as string[]))
  }

  // 4. Yahoo Finance fuzzy search fallback — when nothing resolved yet
  if (validated.length === 0) {
    const searchTerms = extractSearchTerms(message)
    if (searchTerms.length > 2) {
      const found = await yahooSearch(searchTerms)
      if (found) {
        // Validate the search result too
        const q = await getStockQuote(found).catch(() => null)
        if (q) validated.push(found)
      }
    }
  }

  // Deduplicate (same company found multiple ways, e.g. "GOOGL" + "GOOGL")
  return Array.from(new Set(validated)).slice(0, 3)
}

// ── Live stock context builder ────────────────────────────────────────────────

async function fetchStockContext(tickers: string[]): Promise<string> {
  if (tickers.length === 0) return ''

  const blocks = await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const [quote, analystResult, earningsResult] = await Promise.allSettled([
          getStockQuote(ticker),
          getAnalystData(ticker),
          getEarningsHistory(ticker),
        ])

        const q = quote.status === 'fulfilled' ? quote.value : null
        const a = analystResult.status === 'fulfilled' ? analystResult.value : null
        const e: { date: string; eps: number }[] = earningsResult.status === 'fulfilled' ? (earningsResult.value ?? []) : []

        if (!q) return null

        const fmt = (n: number | null | undefined, d = 2) =>
          n != null && isFinite(n) ? n.toFixed(d) : 'N/A'
        const fmtBig = (n: number | null | undefined) => {
          if (n == null || !isFinite(n)) return 'N/A'
          if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
          if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
          if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
          return `$${n.toFixed(0)}`
        }

        // TTM EPS
        const last4 = e.slice(-4)
        const ttmEps = last4.length === 4 ? last4.reduce((s, x) => s + x.eps, 0) : null

        // Fair value
        const normalPe = q.sector ? (SECTOR_NORMAL_PE[q.sector] ?? DEFAULT_NORMAL_PE) : DEFAULT_NORMAL_PE
        const epsForFV = ttmEps ?? q.eps
        const fairValue = epsForFV && epsForFV > 0 && q.price ? epsForFV * normalPe : null
        const fvDiff = fairValue ? ((fairValue - q.price) / q.price) * 100 : null
        const valuation = fvDiff != null
          ? fvDiff > 10
            ? `Undervalued ~${fvDiff.toFixed(1)}% vs fair value estimate $${fairValue?.toFixed(2)} (EPS × ${normalPe} normal P/E)`
            : fvDiff < -10
              ? `Overvalued ~${Math.abs(fvDiff).toFixed(1)}% vs fair value estimate $${fairValue?.toFixed(2)} (EPS × ${normalPe} normal P/E)`
              : `Near fair value (est. $${fairValue?.toFixed(2)}, EPS × ${normalPe} P/E)`
          : 'Fair value N/A (no positive EPS data)'

        const pctFromHigh = q.week52High && q.price ? ((q.price - q.week52High) / q.week52High) * 100 : null
        const pctFromLow = q.week52Low && q.price ? ((q.price - q.week52Low) / q.week52Low) * 100 : null

        let block = `\n=== LIVE DATA: ${ticker} — ${q.companyName} ===\n`
        block += `Price: $${fmt(q.price)} (${q.changePercent >= 0 ? '+' : ''}${fmt(q.changePercent)}% today, prev close $${fmt(q.previousClose)})\n`
        block += `Market Cap: ${fmtBig(q.marketCap)}  |  Sector: ${q.sector ?? 'N/A'}  |  Industry: ${q.industry ?? 'N/A'}\n`
        block += `P/E (trailing): ${fmt(q.peRatio, 1)}  |  EPS (TTM): $${fmt(ttmEps ?? q.eps)}  |  Beta: ${fmt(q.beta, 2)}\n`
        block += `52-Week: $${fmt(q.week52Low)} low → $${fmt(q.week52High)} high`
        if (pctFromHigh != null) block += `  (${pctFromHigh.toFixed(1)}% from 52wk high  /  +${pctFromLow?.toFixed(1)}% from 52wk low)`
        block += `\n`
        if (q.dividendYield && q.dividendYield > 0) block += `Dividend Yield: ${(q.dividendYield * 100).toFixed(2)}%\n`
        if (a?.targetMean) {
          const upside = q.price ? ((a.targetMean - q.price) / q.price) * 100 : null
          block += `Analyst Target: $${fmt(a.targetMean)}  (${upside != null ? (upside >= 0 ? '+' : '') + upside.toFixed(1) + '% upside' : ''})  |  Analyst Rating: ${a.recommendationLabel ?? a.recommendation ?? 'N/A'}\n`
        }
        block += `Valuation: ${valuation}\n`
        if (last4.length >= 2) {
          block += `Recent Quarterly EPS: ${last4.map(q2 => `$${q2.eps.toFixed(2)}`).join(' → ')}\n`
        }
        block += `===\n`
        return block
      } catch {
        return null
      }
    })
  )

  return blocks.filter(Boolean).join('') as string
}

// ── News fetching ─────────────────────────────────────────────────────────────

interface NewsItem { title: string; pubDate: Date | null }

function parseItems(xml: string): NewsItem[] {
  const items: NewsItem[] = []
  const blocks = xml.split(/<item[\s>]/)
  for (const block of blocks.slice(1)) {
    const title = (
      block.match(/<title><!\[CDATA\[(.+?)\]\]><\/title>/)?.[1] ??
      block.match(/<title>(?!\s*<!\[CDATA\[)([^<]{15,})<\/title>/)?.[1]?.trim() ?? ''
    )
    const pubDateStr = block.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1]?.trim()
    let pubDate: Date | null = null
    if (pubDateStr) {
      const p = new Date(pubDateStr)
      if (!isNaN(p.getTime())) pubDate = p
    }
    if (title.length > 15) items.push({ title, pubDate })
  }
  return items
}

function dedup(arr: NewsItem[]): NewsItem[] {
  const seen = new Set<string>()
  return arr.filter(({ title }) => {
    const key = title.toLowerCase().slice(0, 50)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function isRecent(item: NewsItem): boolean {
  if (!item.pubDate) return true
  return (Date.now() - item.pubDate.getTime()) / 3600000 <= 48
}

async function fetchNewsHeadlines(message: string, tickers: string[]): Promise<string> {
  const safeGet = (url: string) =>
    fetch(url, {
      cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000),
    }).then(r => r.text()).then(parseItems).catch(() => [] as NewsItem[])

  const stopWords = new Set([
    'what','which','should','would','could','i','buy','sell','me','tell','about',
    'the','a','an','is','are','was','were','do','does','did','how','why','when',
    'where','can','will','best','stocks','stock','good','on','of','to','for','in',
    'at','with','still','now','gimme','give','get','analysis','analyze','think',
    'thoughts','take','hold','worth','investing','trade','trading',
  ])
  const terms = message.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w)).slice(0, 4).join(' ')

  const feeds = await Promise.allSettled([
    // General market news
    safeGet('https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC,^DJI,^IXIC&region=US&lang=en-US'),
    safeGet('https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114'),
    // Topical news from query terms
    terms.length > 2 ? safeGet(`https://news.google.com/rss/search?q=${encodeURIComponent(terms + ' stock finance')}&hl=en-US&gl=US&ceid=US:en`) : Promise.resolve([] as NewsItem[]),
    // Per-ticker news
    ...tickers.slice(0, 2).map(t =>
      safeGet(`https://news.google.com/rss/search?q=${encodeURIComponent(t + ' stock earnings')}&hl=en-US&gl=US&ceid=US:en`)
    ),
  ])

  const all = feeds.flatMap(r => r.status === 'fulfilled' ? r.value : [])
  const combined = dedup(all).filter(i => !['yahoo finance','cnbc.com','rss','google news'].some(w => i.title.toLowerCase().includes(w)))

  const recent = combined.filter(isRecent).slice(0, 15)
  const older = combined.filter(i => !isRecent(i)).slice(0, 3)
  if (!recent.length && !older.length) return ''

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  let out = `Today is ${today}.\n\n`
  if (recent.length) out += `Recent headlines (last 48h):\n` + recent.map((i, n) => `${n + 1}. ${i.title}`).join('\n')
  if (older.length) out += `\n\nOlder context (flag as possibly stale):\n` + older.map((i, n) => `${n + 1}. ${i.title}`).join('\n')
  return out
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(experience: string, newsContext: string, stockContext: string): string {
  const rules = `
Hard rules:
- No em dashes. No markdown symbols (**, ##, __, etc.). No emojis except 🟢 🟡 🔴.
- When live stock data is present below, always cite real numbers. Never say "I don't have current data."
- Write like a sharp analyst texting a smart friend. Confident, specific, no filler.`

  const liveBlock = stockContext
    ? `\n\nLIVE MARKET DATA (fetched right now — use these exact numbers):\n${stockContext}`
    : ''
  const newsBlock = newsContext
    ? `\n\n${newsContext}\n\nUse recent headlines as catalysts. Flag anything from "Older context" as possibly stale.`
    : ''

  if (experience === 'beginner') {
    return `You are Mr. Guy, a sharp market analyst. You explain stocks clearly to everyday investors — plain English, but REAL and COMPLETE analysis. No dumbing it down so much that it becomes useless.

When asked about a specific stock, cover:
1. What the company does (1 sentence)
2. The verdict: 🟢 Good setup / 🟡 Wait and see / 🔴 Risky right now — with a specific reason
3. Key numbers from the live data: current price, how far from 52-week high/low, P/E ratio (explained), analyst target, fair value vs current price
4. What's moving it right now (news catalyst if any)
5. The main risk — what could go wrong
6. Bottom line: one clear takeaway sentence

Plain English rules: explain any finance term you use right after using it. Use real numbers, not vague ranges. Length: as long as needed — don't cut it short.
${rules}${liveBlock}${newsBlock}`
  }

  if (experience === 'some') {
    return `You are Mr. Guy, a direct market analyst. Lead with verdict, back it up with data.

VERDICT
🟢 Buy / 🟡 Hold / 🔴 Avoid — one sentence with specific reason.

WHAT'S MOVING IT
Key catalyst or absence of one. Flag stale news.

THE NUMBERS
From live data: price vs 52wk range, P/E, EPS, analyst target, fair value gap. Be specific — exact numbers.

RISK
Bear case in 2 sentences.

BOTTOM LINE
One punchy sentence.
${rules}${liveBlock}${newsBlock}`
  }

  return `You are Mr. Guy, a sell-side analyst. Fast, data-driven, no fluff.

VERDICT
🟢 Buy / 🟡 Hold / 🔴 Avoid. One sentence.

CATALYST
Specific headline driving the move, or absence of one. Flag stale headlines.

FUNDAMENTALS
P/E vs sector norm, EPS trend (show quarterly progression), market cap, fair value vs price, % from 52wk high/low, analyst target and upside. Exact numbers only.

SETUP
Beta, trend direction, extended or basing.

CATALYSTS AHEAD
Upcoming earnings, product cycles, macro risks.

RISK
Bear case — 2 sentences. What breaks the thesis.
${rules}${liveBlock}${newsBlock}`
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], experience = 'beginner' } = await req.json()

    // Resolve tickers (validates each one against Yahoo Finance)
    const tickers = await resolveTickers(message)

    // Fetch stock fundamentals + news in parallel
    const [stockContext, newsHeadlines] = await Promise.all([
      fetchStockContext(tickers),
      fetchNewsHeadlines(message, tickers),
    ])

    const messages = [
      ...history
        .filter((m: any) => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message },
    ]

    const systemPrompt = buildSystemPrompt(experience, newsHeadlines, stockContext)

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: experience === 'beginner' ? 900 : 1200,
      system: systemPrompt,
      messages,
    })

    const reply =
      response.content[0].type === 'text'
        ? response.content[0].text
        : 'Something went wrong. Try rephrasing!'

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ reply: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
