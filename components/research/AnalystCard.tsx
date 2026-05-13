'use client'
import { TrendingUp, TrendingDown, Minus, Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import InfoTooltip from '@/components/InfoTooltip'

interface AnalystData {
  recommendation: string | null
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

interface NewsItem {
  title: string
  link: string
  publisher: string
  providerPublishTime: number
}

interface AnalystCardProps {
  analyst: AnalystData
  currentPrice: number
  news: NewsItem[]
  ticker: string
}

function holdDuration(rec: string | null): string {
  if (rec === 'strong_buy') return 'Recommended hold: 12–18 months for full upside potential'
  if (rec === 'buy') return 'Recommended hold: 6–12 months'
  return ''
}

function getRatingColor(rec: string | null) {
  if (rec === 'strong_buy' || rec === 'buy') return 'text-green-400'
  if (rec === 'hold') return 'text-yellow-400'
  if (rec === 'sell' || rec === 'underperform' || rec === 'strong_sell') return 'text-red-400'
  return 'text-gray-400'
}

function getRatingBg(rec: string | null) {
  if (rec === 'strong_buy' || rec === 'buy') return 'bg-green-400/10 border-green-400/20'
  if (rec === 'hold') return 'bg-yellow-400/10 border-yellow-400/20'
  if (rec === 'sell' || rec === 'underperform' || rec === 'strong_sell') return 'bg-red-400/10 border-red-400/20'
  return 'bg-gray-700/30 border-gray-600/20'
}

function RatingIcon({ rec }: { rec: string | null }) {
  if (rec === 'strong_buy' || rec === 'buy') return <TrendingUp className="h-8 w-8 text-green-400" />
  if (rec === 'hold') return <Minus className="h-8 w-8 text-yellow-400" />
  if (rec === 'sell' || rec === 'underperform' || rec === 'strong_sell') return <TrendingDown className="h-8 w-8 text-red-400" />
  return <AlertCircle className="h-8 w-8 text-gray-400" />
}

function getReason(analyst: AnalystData, currentPrice: number): string {
  const { recommendation: rec, numberOfAnalysts, targetMedian, targetMean, buyCount, holdCount, sellCount, strongBuyCount, strongSellCount } = analyst
  const total = (strongBuyCount || 0) + (buyCount || 0) + (holdCount || 0) + (sellCount || 0) + (strongSellCount || 0)
  const bullish = (strongBuyCount || 0) + (buyCount || 0)
  const bearish = (sellCount || 0) + (strongSellCount || 0)

  const target = targetMedian ?? targetMean
  const upside = target ? (((target - currentPrice) / currentPrice) * 100).toFixed(1) : null

  const parts: string[] = []

  if (numberOfAnalysts && numberOfAnalysts > 0) {
    parts.push(`Based on ${numberOfAnalysts} Wall Street analyst${numberOfAnalysts > 1 ? 's' : ''} covering this stock`)
  }

  if (total > 0) {
    parts.push(`${bullish} analyst${bullish !== 1 ? 's' : ''} rate it Buy/Strong Buy, ${holdCount} Hold, and ${bearish} Sell`)
  }

  if (upside !== null && target) {
    const direction = parseFloat(upside) >= 0 ? 'upside' : 'downside'
    parts.push(`The consensus price target of $${target.toFixed(2)} implies ${Math.abs(parseFloat(upside))}% ${direction} from the current price`)
  }

  if (rec === 'strong_buy') parts.push('Strong conviction from the analyst community reflects robust fundamentals and a favorable risk/reward outlook')
  else if (rec === 'buy') parts.push('Analysts see meaningful upside potential and favorable risk/reward at current levels')
  else if (rec === 'hold') parts.push('Analysts see limited near-term catalysts but the stock is considered fairly valued at current levels')
  else if (rec === 'sell' || rec === 'underperform') parts.push('Analysts see limited upside or potential downside risk from current price levels')

  if (parts.length === 0) return 'Insufficient analyst coverage data available for this stock. Consider checking financial news sources for qualitative insight.'

  return parts.join('. ') + '.'
}

function priceTargetRow(label: string, low: number | null, median: number | null, high: number | null, current: number) {
  if (!low && !median && !high) return null

  const med = median ?? high ?? low ?? current
  const upPct = (((med - current) / current) * 100)

  return (
    <div className="grid grid-cols-4 gap-3 py-3 border-b border-gray-800 last:border-0">
      <div className="text-sm text-gray-400 font-medium flex items-center">{label}</div>
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-0.5">Low</p>
        <p className="text-sm font-semibold text-red-400">{low ? `$${low.toFixed(2)}` : '—'}</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-0.5">Median</p>
        <p className="text-sm font-semibold text-white">{median ? `$${median.toFixed(2)}` : '—'}</p>
        <p className={cn('text-xs', upPct >= 0 ? 'text-green-400' : 'text-red-400')}>
          {upPct >= 0 ? '+' : ''}{upPct.toFixed(1)}%
        </p>
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-0.5">High</p>
        <p className="text-sm font-semibold text-green-400">{high ? `$${high.toFixed(2)}` : '—'}</p>
      </div>
    </div>
  )
}

function interpolate(current: number, target: number, fraction: number) {
  return current + (target - current) * fraction
}

export default function AnalystCard({ analyst, currentPrice, news, ticker }: AnalystCardProps) {
  const { recommendation: rec, recommendationLabel, targetLow, targetMedian, targetHigh, numberOfAnalysts } = analyst

  const hasTargets = targetLow || targetMedian || targetHigh

  // Scale 12M analyst targets to 3M and 6M by interpolating from current price
  const t3Low = targetLow ? interpolate(currentPrice, targetLow, 0.25) : null
  const t3Med = targetMedian ? interpolate(currentPrice, targetMedian, 0.25) : null
  const t3High = targetHigh ? interpolate(currentPrice, targetHigh, 0.25) : null

  const t6Low = targetLow ? interpolate(currentPrice, targetLow, 0.5) : null
  const t6Med = targetMedian ? interpolate(currentPrice, targetMedian, 0.5) : null
  const t6High = targetHigh ? interpolate(currentPrice, targetHigh, 0.5) : null

  const duration = holdDuration(rec)
  const reason = getReason(analyst, currentPrice)

  return (
    <div className="space-y-4">
      {/* 3-section analyst card */}
      <Card>
        <CardContent className="p-0 divide-y divide-gray-800">

          {/* Section 1: Rating */}
          <div className={cn('p-5 rounded-t-xl border', getRatingBg(rec))}>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium flex items-center gap-1">Analyst Consensus <InfoTooltip text="The average rating across all Wall Street analysts who cover this stock. Strong Buy = very bullish, Hold = neutral, Sell = bearish." /></p>
            <div className="flex items-center gap-4">
              <RatingIcon rec={rec} />
              <div>
                <p className={cn('text-3xl font-bold', getRatingColor(rec))}>
                  {recommendationLabel}
                </p>
                {numberOfAnalysts && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Based on {numberOfAnalysts} analyst{numberOfAnalysts > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            {duration && (
              <div className="flex items-center gap-2 mt-3 bg-gray-800/60 rounded-lg px-3 py-2">
                <Clock className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                <p className="text-xs text-green-300">{duration}</p>
              </div>
            )}

            {/* Analyst vote bar */}
            {(analyst.buyCount + analyst.holdCount + analyst.sellCount + analyst.strongBuyCount + analyst.strongSellCount) > 0 && (() => {
              const total = analyst.strongBuyCount + analyst.buyCount + analyst.holdCount + analyst.sellCount + analyst.strongSellCount
              const bull = ((analyst.strongBuyCount + analyst.buyCount) / total) * 100
              const hold = (analyst.holdCount / total) * 100
              const bear = ((analyst.sellCount + analyst.strongSellCount) / total) * 100
              return (
                <div className="mt-3">
                  <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                    <div className="bg-green-500 rounded-l-full" style={{ width: `${bull}%` }} />
                    <div className="bg-yellow-500" style={{ width: `${hold}%` }} />
                    <div className="bg-red-500 rounded-r-full" style={{ width: `${bear}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span className="text-green-400">Buy {analyst.strongBuyCount + analyst.buyCount}</span>
                    <span className="text-yellow-400">Hold {analyst.holdCount}</span>
                    <span className="text-red-400">Sell {analyst.sellCount + analyst.strongSellCount}</span>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Section 2: Reason */}
          <div className="p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium flex items-center gap-1">Analysis &amp; Reasoning <InfoTooltip text="A summary explaining why analysts have this rating — based on price targets, vote breakdown, and current stock price vs. expected value." /></p>
            <p className="text-sm text-gray-300 leading-relaxed">{reason}</p>
          </div>

          {/* Section 3: Price Targets */}
          <div className="p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-medium flex items-center gap-1">Price Targets <InfoTooltip text="Where analysts expect the stock to be at 3, 6, and 12 months. Low = pessimistic forecast, Median = middle estimate, High = most optimistic." /></p>
            <p className="text-xs text-gray-600 mb-3">Based on 12-month analyst targets, scaled to each horizon</p>
            {hasTargets ? (
              <div>
                <div className="grid grid-cols-4 gap-3 pb-2 border-b border-gray-800">
                  <div />
                  <div className="text-center text-xs text-gray-500 font-medium">Low</div>
                  <div className="text-center text-xs text-gray-500 font-medium">Median</div>
                  <div className="text-center text-xs text-gray-500 font-medium">High</div>
                </div>
                {priceTargetRow('3 Months', t3Low, t3Med, t3High, currentPrice)}
                {priceTargetRow('6 Months', t6Low, t6Med, t6High, currentPrice)}
                {priceTargetRow('12 Months', targetLow, targetMedian, targetHigh, currentPrice)}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No analyst price targets available for {ticker}.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* News Section */}
      {news.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4 font-medium">Latest News</p>
            <div className="space-y-4">
              {news.map((item, i) => {
                const date = item.providerPublishTime
                  ? new Date(item.providerPublishTime * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : ''
                return (
                  <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className="flex gap-3 group">
                    <div className="flex-shrink-0 w-1 rounded-full bg-gray-700 group-hover:bg-blue-500 transition-colors" />
                    <div>
                      <p className="text-sm text-gray-200 group-hover:text-blue-400 transition-colors leading-snug">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{item.publisher}{date ? ` · ${date}` : ''}</p>
                    </div>
                  </a>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
