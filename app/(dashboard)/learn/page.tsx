'use client'
import { useState, useMemo } from 'react'
import { Search, BookOpen, TrendingUp, BarChart2, Shield, Lightbulb, DollarSign } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ─── Dictionary Data ──────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Basics', 'Charts', 'Company Health', 'Risk', 'Strategies'] as const
type Category = typeof CATEGORIES[number]

interface Term {
  term: string
  category: Exclude<Category, 'All'>
  simple: string
  explanation: string
  example?: string
  tip?: string
}

const TERMS: Term[] = [
  // BASICS
  { term: 'Stock', category: 'Basics', simple: 'A tiny piece of ownership in a company', explanation: 'When you buy a stock, you own a small slice of that company. If the company does well, your slice is worth more.', example: 'Buy 1 share of Apple = own a tiny piece of Apple Inc.', tip: 'Think of it like buying a slice of a pizza — you own that slice.' },
  { term: 'Share', category: 'Basics', simple: 'One unit of a stock', explanation: 'A share is just one single piece of a company\'s stock. Companies split their ownership into millions of shares so regular people can afford to buy in.', example: 'Apple has about 15 billion shares. You might own 5 of them.' },
  { term: 'Market Cap', category: 'Basics', simple: 'Total value of a company', explanation: 'Multiply the stock price by the number of shares. That\'s how much the entire company is worth according to the market.', example: 'Stock at $100 × 1 billion shares = $100B market cap', tip: 'Under $2B = small-cap. $2B-$10B = mid-cap. Over $10B = large-cap.' },
  { term: 'Portfolio', category: 'Basics', simple: 'All your investments together', explanation: 'Your portfolio is the collection of all the stocks, ETFs, and other investments you own. Think of it as your investment "bag."', example: 'You own AAPL, TSLA, and NVDA — those 3 together are your portfolio.' },
  { term: 'Dividend', category: 'Basics', simple: 'Cash a company pays you just for owning their stock', explanation: 'Some companies share their profits with shareholders by paying dividends — usually every 3 months. You don\'t have to do anything to receive them.', example: 'Own 100 shares of Coca-Cola paying $0.46/share = $46 every quarter.', tip: 'Not all stocks pay dividends. Growth companies usually don\'t.' },
  { term: 'ETF', category: 'Basics', simple: 'A basket of many stocks in one', explanation: 'Instead of buying 500 individual stocks, you buy one ETF that contains all 500. It spreads your risk automatically.', example: 'SPY ETF = owns all 500 companies in the S&P 500.', tip: 'Great for beginners — instant diversification.' },
  { term: 'Index', category: 'Basics', simple: 'A scoreboard for a group of stocks', explanation: 'An index tracks the performance of a specific group of companies. The S&P 500 tracks America\'s 500 biggest companies.', example: 'S&P 500, Dow Jones, and Nasdaq are the three biggest indexes.' },
  { term: 'Bull Market', category: 'Basics', simple: 'When stocks are going up', explanation: 'A bull market is when stock prices are rising and investors are optimistic. Generally means prices are up 20%+ from recent lows.', tip: 'Bulls charge upward — so does the market in a bull market.' },
  { term: 'Bear Market', category: 'Basics', simple: 'When stocks are falling', explanation: 'A bear market means prices have dropped 20% or more from recent highs. Usually tied to recessions or bad economic news.', tip: 'Bears swipe downward — just like a bear market.' },
  { term: 'IPO', category: 'Basics', simple: 'When a company goes public for the first time', explanation: 'An Initial Public Offering is when a private company sells shares to regular people for the first time. It\'s the company\'s debut on the stock market.', example: 'Reddit went public in 2024 — that was their IPO.' },
  { term: 'Broker', category: 'Basics', simple: 'The app or platform where you buy stocks', explanation: 'A broker is the middleman between you and the stock market. Apps like Robinhood, Fidelity, and Schwab are all brokers.', tip: 'Always use a regulated, reputable broker — never random websites.' },
  { term: 'Liquidity', category: 'Basics', simple: 'How easy it is to buy or sell something quickly', explanation: 'A liquid stock has lots of buyers and sellers so you can exit fast. An illiquid stock might take days to sell.', example: 'Apple is very liquid. A tiny penny stock might not be.' },

  // CHARTS
  { term: 'Candlestick', category: 'Charts', simple: 'A chart shape that shows a stock\'s price movement in a time period', explanation: 'Each candlestick shows the opening price, closing price, highest price, and lowest price for a specific time period. Green = price went up. Red = price went down.', tip: 'The "wick" (thin line) shows the highest and lowest price. The "body" shows open and close.' },
  { term: 'Support Level', category: 'Charts', simple: 'A price where a stock tends to stop falling', explanation: 'Support is a price level where buyers historically step in and stop the stock from dropping further. Like a floor.', example: 'If AAPL keeps bouncing at $150, that\'s a support level.', tip: 'If a stock breaks below support, it often falls a lot further.' },
  { term: 'Resistance Level', category: 'Charts', simple: 'A price where a stock tends to stop rising', explanation: 'Resistance is a price level where sellers historically push the stock back down. Like a ceiling.', example: 'If TSLA keeps failing to break $300, that\'s resistance.', tip: 'If a stock breaks above resistance, it often shoots up fast.' },
  { term: 'Moving Average', category: 'Charts', simple: 'The average price of a stock over a set number of days', explanation: 'A 50-day moving average is the average closing price over the last 50 days. It smooths out daily noise and shows the trend.', tip: 'Stock above its 200-day moving average = generally healthy trend.' },
  { term: 'Volume', category: 'Charts', simple: 'How many shares were traded today', explanation: 'Volume tells you how active a stock is. High volume means lots of buyers and sellers. A big price move on high volume = more credible.', tip: 'Always check volume when a stock spikes. Low volume spike = suspicious.' },
  { term: 'Breakout', category: 'Charts', simple: 'When a stock bursts above a resistance level', explanation: 'A breakout happens when a stock pushes through a price it\'s been stuck below. Often leads to a big move upward.', example: 'Stock stuck at $50 for months suddenly surges to $55 on high volume = breakout.' },
  { term: '52-Week High', category: 'Charts', simple: 'The highest price a stock has been in the last year', explanation: 'The 52-week high shows the peak price over the past 52 weeks. Stocks near their 52-week high are often in strong uptrends.', tip: 'Breaking above a 52-week high is often a very bullish signal.' },
  { term: 'RSI', category: 'Charts', simple: 'A score (0-100) showing if a stock is overbought or oversold', explanation: 'RSI (Relative Strength Index) measures how fast a stock is moving. Above 70 = might be overbought (due for a pullback). Below 30 = might be oversold (due for a bounce).', tip: 'RSI is just one tool — never use it alone.' },

  // COMPANY HEALTH
  { term: 'P/E Ratio', category: 'Company Health', simple: 'How expensive a stock is compared to its profits', explanation: 'Price-to-Earnings ratio = stock price ÷ earnings per share. It shows how much investors pay for every $1 of profit. High P/E = expensive. Low P/E = cheap (or struggling).', example: 'Stock at $100, earns $5/share → P/E of 20. Investors pay $20 per $1 of profit.', tip: 'Compare P/E to competitors, not random numbers.' },
  { term: 'EPS', category: 'Company Health', simple: 'How much profit a company makes per share', explanation: 'Earnings Per Share = total profit ÷ number of shares. It\'s the most important number in an earnings report.', example: 'Company makes $1B profit, has 500M shares → EPS of $2.', tip: 'Analysts predict EPS before earnings. Beating estimates = stock usually goes up.' },
  { term: 'Revenue', category: 'Company Health', simple: 'Total money a company brings in', explanation: 'Revenue is the total sales before any expenses are subtracted. Think of it as the top line — it\'s the first number on an income statement.', tip: 'Revenue growing = good sign. Revenue shrinking = warning sign.' },
  { term: 'Profit Margin', category: 'Company Health', simple: 'What percentage of revenue becomes actual profit', explanation: 'If a company makes $100 in revenue but only keeps $20 after costs, its profit margin is 20%. Higher margins = more efficient business.', example: 'Apple has ~25% profit margin. That\'s exceptional.' },
  { term: 'Earnings Report', category: 'Company Health', simple: 'A company\'s quarterly report card', explanation: 'Every 3 months, public companies release their financial results — revenue, profit, and guidance for the future. This often moves the stock price a lot.', tip: 'Stock can drop even on good earnings if it misses expectations. It\'s all relative.' },
  { term: 'Guidance', category: 'Company Health', simple: 'A company\'s prediction for their own future performance', explanation: 'When a company reports earnings, they also say what they expect next quarter. Raising guidance = bullish. Lowering guidance = often tanks the stock.', tip: 'Sometimes guidance matters more than the actual earnings results.' },
  { term: 'Balance Sheet', category: 'Company Health', simple: 'A snapshot of everything a company owns and owes', explanation: 'The balance sheet shows assets (what they own), liabilities (what they owe), and equity (what\'s left over). Healthy company = more assets than liabilities.' },
  { term: 'Debt-to-Equity', category: 'Company Health', simple: 'How much a company borrowed vs. what it actually owns', explanation: 'High debt-to-equity means the company borrowed a lot. This is risky when interest rates are high. Low D/E = financially conservative.', tip: 'Under 1.0 is generally considered healthy.' },
  { term: 'Free Cash Flow', category: 'Company Health', simple: 'Actual cash left after all expenses', explanation: 'Free cash flow is the real money a company generates after paying for everything. Profitable on paper but negative free cash flow = potential red flag.', tip: 'Warren Buffett focuses heavily on free cash flow.' },

  // RISK
  { term: 'Volatility', category: 'Risk', simple: 'How wildly a stock\'s price swings', explanation: 'High volatility means the stock price jumps up and down a lot. Low volatility means it moves slowly and steadily. More volatile = more risk AND more potential reward.', example: 'Bitcoin is very volatile. A Treasury bond is very low volatility.' },
  { term: 'Diversification', category: 'Risk', simple: 'Not putting all your eggs in one basket', explanation: 'Spreading your money across different stocks, sectors, and asset types so one bad investment doesn\'t destroy your whole portfolio.', tip: 'Owning 20 different tech stocks isn\'t diversification — they all move together.' },
  { term: 'Short Selling', category: 'Risk', simple: 'Betting that a stock will go down', explanation: 'Short sellers borrow shares, sell them, and hope to buy them back cheaper later. Huge risk — stocks can theoretically rise forever, creating unlimited losses.', tip: 'Never short sell as a beginner. The risk is too high.' },
  { term: 'Stop Loss', category: 'Risk', simple: 'An automatic sell order if a stock drops too much', explanation: 'You set a stop loss at, say, 10% below your buy price. If the stock drops that much, it sells automatically so you don\'t lose more.', tip: 'Always use stop losses. Pros do — amateurs don\'t.' },
  { term: 'Margin', category: 'Risk', simple: 'Borrowing money from your broker to buy more stocks', explanation: 'Trading on margin means you use your broker\'s money to buy more than you could with your own cash. Amplifies gains AND losses. Very risky.', tip: 'Never trade on margin as a beginner. You can lose more than you invest.' },
  { term: 'Short Interest', category: 'Risk', simple: 'How many people are betting a stock will fall', explanation: 'High short interest means lots of investors think the stock will drop. If they\'re wrong and the stock rises, they all rush to buy back = short squeeze.', example: 'GameStop 2021 was a famous short squeeze.' },
  { term: 'Beta', category: 'Risk', simple: 'How much a stock moves compared to the overall market', explanation: 'Beta of 1 = moves with the market. Beta of 2 = moves twice as much as the market. Beta of 0.5 = half as volatile as the market.', tip: 'High beta stocks are riskier but can outperform in bull markets.' },

  // STRATEGIES
  { term: 'Buy and Hold', category: 'Strategies', simple: 'Buy stocks and keep them for years', explanation: 'The simplest and statistically most effective strategy for most people. Buy quality companies and hold through ups and downs. Time in the market beats timing the market.', tip: 'Warren Buffett\'s favorite strategy.' },
  { term: 'Dollar-Cost Averaging', category: 'Strategies', simple: 'Invest a fixed amount every month no matter what', explanation: 'Instead of investing all at once, you invest the same amount every week or month. You automatically buy more shares when prices are low and fewer when high.', example: 'Invest $100 every month in SPY regardless of price.', tip: 'Removes emotion from investing. Great for beginners.' },
  { term: 'Value Investing', category: 'Strategies', simple: 'Buying stocks that are cheaper than they\'re worth', explanation: 'Value investors look for companies whose stock price doesn\'t reflect their true value. Buy undervalued, wait for the market to recognize it.', tip: 'Warren Buffett and Charlie Munger are legendary value investors.' },
  { term: 'Growth Investing', category: 'Strategies', simple: 'Buying companies growing fast even if expensive', explanation: 'Growth investors focus on companies with rapidly increasing revenue, even if they\'re not yet profitable. High risk, high reward.', example: 'Nvidia, Tesla in early days — high P/E but explosive growth.' },
  { term: 'Momentum Investing', category: 'Strategies', simple: 'Buying stocks that are already going up', explanation: 'The idea: stocks that are rising tend to keep rising, and falling stocks keep falling. Momentum traders ride the trend.', tip: 'Works until it doesn\'t. Always use stop losses.' },
  { term: 'Insider Trading (Legal)', category: 'Strategies', simple: 'Tracking what company executives are buying', explanation: 'When a CEO or CFO buys their own company\'s stock with their own money, it\'s a strong signal they believe in the company\'s future. This is public info filed with the SEC.', tip: 'Our Smart Money page shows this. Executives selling = sometimes concerning. Executives buying = usually bullish.' },
]

// ─── Category icons ───────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Basics: <BookOpen className="h-3.5 w-3.5" />,
  Charts: <BarChart2 className="h-3.5 w-3.5" />,
  'Company Health': <TrendingUp className="h-3.5 w-3.5" />,
  Risk: <Shield className="h-3.5 w-3.5" />,
  Strategies: <Lightbulb className="h-3.5 w-3.5" />,
}

const CATEGORY_COLORS: Record<string, string> = {
  Basics: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Charts: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Company Health': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Risk: 'bg-red-500/10 text-red-400 border-red-500/20',
  Strategies: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LearnPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category>('All')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return TERMS.filter((t) => {
      const matchesSearch =
        !search ||
        t.term.toLowerCase().includes(search.toLowerCase()) ||
        t.simple.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = activeCategory === 'All' || t.category === activeCategory
      return matchesSearch && matchesCategory
    }).sort((a, b) => a.term.localeCompare(b.term))
  }, [search, activeCategory])

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-blue-600/15 border border-blue-600/20 flex items-center justify-center">
          <BookOpen className="h-4 w-4 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Investing Dictionary</h1>
          <p className="text-sm text-gray-400 mt-0.5">Every term explained simply — no jargon</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search any term..."
          className="pl-9 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              activeCategory === cat
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
            }`}
          >
            {cat !== 'All' && CATEGORY_ICONS[cat]}
            {cat}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500">{filtered.length} terms</p>

      {/* Terms list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-12">No terms found for &quot;{search}&quot;</p>
        )}
        {filtered.map((t) => (
          <Card
            key={t.term}
            className="cursor-pointer hover:bg-gray-800/40 transition-colors"
            onClick={() => setExpanded(expanded === t.term ? null : t.term)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-white">{t.term}</h3>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[t.category]}`}>
                      {CATEGORY_ICONS[t.category]}
                      {t.category}
                    </span>
                  </div>
                  <p className="text-sm text-blue-300 font-medium">{t.simple}</p>

                  {expanded === t.term && (
                    <div className="mt-3 space-y-2 border-t border-gray-800 pt-3">
                      <p className="text-sm text-gray-300 leading-relaxed">{t.explanation}</p>
                      {t.example && (
                        <div className="bg-gray-900 rounded-lg px-3 py-2">
                          <span className="text-xs text-gray-500 font-medium">Example: </span>
                          <span className="text-xs text-gray-300">{t.example}</span>
                        </div>
                      )}
                      {t.tip && (
                        <div className="flex gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-3 py-2">
                          <Lightbulb className="h-3.5 w-3.5 text-yellow-400 shrink-0 mt-0.5" />
                          <span className="text-xs text-yellow-300">{t.tip}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-gray-600 text-xs mt-0.5">{expanded === t.term ? '▲' : '▼'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
