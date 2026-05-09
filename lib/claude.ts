// Free built-in analysis engine — no API key required

export interface StockAnalysisInput {
  ticker: string
  companyName: string
  price: number
  change: number
  changePercent: number
  marketCap: number | null
  peRatio: number | null
  eps: number | null
  beta: number | null
  dividendYield: number | null
  week52High: number | null
  week52Low: number | null
  sector: string | null
  industry: string | null
  recentNews: string[]
}

export interface PortfolioAnalysisInput {
  totalValue: number
  totalGainLoss: number
  totalGainLossPercent: number
  holdings: {
    ticker: string
    companyName: string
    shares: number
    currentValue: number
    gainLoss: number
    gainLossPercent: number
    sector: string
    weight: number
  }[]
}

function fmt(n: number | null, decimals = 2) {
  return n != null ? n.toFixed(decimals) : 'N/A'
}

function fmtCurrency(n: number | null) {
  if (n == null) return 'N/A'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtLarge(n: number | null) {
  if (n == null) return 'N/A'
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T'
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M'
  return '$' + n.toLocaleString()
}

export async function analyzeStock(input: StockAnalysisInput): Promise<string> {
  const {
    ticker, companyName, price, change, changePercent,
    marketCap, peRatio, eps, beta, dividendYield,
    week52High, week52Low, sector, industry, recentNews,
  } = input

  // --- Valuation logic ---
  let valuationVerdict = 'FAIRLY VALUED'
  let valuationText = ''

  if (peRatio != null) {
    const sectorAvgPE: Record<string, number> = {
      'Technology': 28, 'Healthcare': 22, 'Financials': 14,
      'Consumer Discretionary': 20, 'Consumer Staples': 18,
      'Energy': 12, 'Industrials': 18, 'Materials': 15,
      'Real Estate': 25, 'Utilities': 16, 'Communication Services': 22,
    }
    const avgPE = sector ? (sectorAvgPE[sector] ?? 20) : 20
    if (peRatio > avgPE * 1.4) {
      valuationVerdict = 'OVERVALUED'
      valuationText = `P/E of ${fmt(peRatio)}x is significantly above the ${sector ?? 'market'} sector average of ~${avgPE}x, suggesting the stock is priced for high growth expectations.`
    } else if (peRatio < avgPE * 0.7) {
      valuationVerdict = 'UNDERVALUED'
      valuationText = `P/E of ${fmt(peRatio)}x is well below the ${sector ?? 'market'} sector average of ~${avgPE}x, suggesting the stock may be attractively priced relative to peers.`
    } else {
      valuationVerdict = 'FAIRLY VALUED'
      valuationText = `P/E of ${fmt(peRatio)}x is in line with the ${sector ?? 'market'} sector average of ~${avgPE}x, suggesting fair market pricing.`
    }
  } else {
    valuationText = 'Insufficient valuation data available. Consider reviewing revenue growth and cash flow metrics.'
  }

  // 52-week position
  let rangeText = ''
  if (week52High != null && week52Low != null) {
    const rangePos = ((price - week52Low) / (week52High - week52Low)) * 100
    if (rangePos > 85) rangeText = `Trading near its 52-week high (${rangePos.toFixed(0)}% of range), indicating strong recent momentum.`
    else if (rangePos < 20) rangeText = `Trading near its 52-week low (${rangePos.toFixed(0)}% of range), which may indicate selling pressure or an entry opportunity.`
    else rangeText = `Trading at ${rangePos.toFixed(0)}% of its 52-week range ($${week52Low.toFixed(2)}–$${week52High.toFixed(2)}).`
  }

  // --- Rating logic ---
  let rating = 'HOLD'
  let ratingReason = ''

  const positives: string[] = []
  const negatives: string[] = []

  if (peRatio != null && peRatio > 0 && peRatio < 15) positives.push('attractive valuation (low P/E)')
  if (dividendYield != null && dividendYield > 0.02) positives.push(`dividend yield of ${(dividendYield * 100).toFixed(1)}%`)
  if (beta != null && beta < 0.8) positives.push('low volatility (beta < 0.8)')
  if (changePercent > 3) positives.push('strong recent price momentum')
  if (week52High != null && week52Low != null) {
    const pos = ((price - week52Low) / (week52High - week52Low)) * 100
    if (pos < 30) positives.push('trading near 52-week lows (potential value)')
  }

  if (peRatio != null && peRatio > 40) negatives.push('elevated valuation (high P/E)')
  if (beta != null && beta > 1.5) negatives.push('high volatility (beta > 1.5)')
  if (changePercent < -3) negatives.push('recent price weakness')
  if (eps != null && eps < 0) negatives.push('negative earnings')
  if (week52High != null && week52Low != null) {
    const pos = ((price - week52Low) / (week52High - week52Low)) * 100
    if (pos > 90) negatives.push('extended near 52-week highs')
  }

  if (positives.length >= 2 && negatives.length <= 1) {
    rating = 'BUY'
    ratingReason = `Multiple positive signals including ${positives.slice(0, 2).join(' and ')} support a constructive view.`
  } else if (negatives.length >= 2 && positives.length <= 1) {
    rating = 'SELL'
    ratingReason = `Concerns around ${negatives.slice(0, 2).join(' and ')} warrant caution at current levels.`
  } else {
    rating = 'HOLD'
    ratingReason = `Mixed signals with some positives (${positives[0] ?? 'stable fundamentals'}) offset by risks (${negatives[0] ?? 'market uncertainty'}). Best to hold and monitor.`
  }

  // --- Strengths ---
  const strengths: string[] = []
  if (marketCap != null && marketCap > 100e9) strengths.push(`Large-cap company (${fmtLarge(marketCap)} market cap) with institutional stability and resources`)
  if (dividendYield != null && dividendYield > 0) strengths.push(`Pays a dividend yield of ${(dividendYield * 100).toFixed(2)}%, providing income to shareholders`)
  if (beta != null && beta < 1) strengths.push(`Below-market volatility (beta: ${fmt(beta)}) makes it a relatively defensive holding`)
  if (peRatio != null && peRatio > 0 && peRatio < 20) strengths.push(`Reasonably valued at ${fmt(peRatio)}x earnings compared to market averages`)
  if (eps != null && eps > 0) strengths.push(`Profitable business with EPS of ${fmtCurrency(eps)}`)
  if (strengths.length < 2) strengths.push(`Established ${sector ?? 'market'} player with brand recognition`)
  if (strengths.length < 3) strengths.push('Diversified revenue streams reduce single-point risk')

  // --- Risks ---
  const risks: string[] = []
  if (beta != null && beta > 1.2) risks.push(`Higher-than-market volatility (beta: ${fmt(beta)}) means larger swings in both directions`)
  if (peRatio != null && peRatio > 30) risks.push(`Premium valuation (P/E: ${fmt(peRatio)}x) leaves little room for earnings disappointments`)
  if (eps != null && eps < 0) risks.push('Currently unprofitable — negative EPS increases execution risk')
  risks.push('Macroeconomic headwinds (interest rates, inflation) could pressure margins')
  if (sector === 'Technology') risks.push('Regulatory scrutiny on big tech continues to be a headline risk')
  if (sector === 'Financials') risks.push('Credit cycle and interest rate sensitivity remain key watchpoints')
  if (risks.length < 3) risks.push('Competitive landscape and market share pressure from peers')

  return `## Executive Summary
${companyName} (${ticker}) is ${sector ? `a ${sector} sector company` : 'a publicly traded company'} currently trading at ${fmtCurrency(price)}, ${changePercent >= 0 ? 'up' : 'down'} ${Math.abs(changePercent).toFixed(2)}% today. ${rangeText} Market cap stands at ${fmtLarge(marketCap)}.

## Strengths & Catalysts
${strengths.slice(0, 4).map(s => `• ${s}`).join('\n')}

## Risks & Weaknesses
${risks.slice(0, 4).map(r => `• ${r}`).join('\n')}

## Valuation Assessment
${valuationText}

**Verdict: ${valuationVerdict}**

## Analyst Verdict
${ratingReason} Key metrics: P/E ${fmt(peRatio)}x | EPS ${fmtCurrency(eps)} | Beta ${fmt(beta)} | Dividend ${dividendYield ? (dividendYield * 100).toFixed(2) + '%' : 'None'}.

**Rating: ${rating}**

---
*This analysis is generated by Zains Game's built-in rule-based engine using publicly available market data. For informational purposes only. Not financial advice.*`
}

export async function analyzePortfolio(input: PortfolioAnalysisInput): Promise<string> {
  const { totalValue, totalGainLoss, totalGainLossPercent, holdings } = input

  if (!holdings.length) return 'No holdings to analyze.'

  // Sector breakdown
  const sectorMap: Record<string, number> = {}
  for (const h of holdings) {
    sectorMap[h.sector] = (sectorMap[h.sector] ?? 0) + h.weight
  }
  const sectors = Object.entries(sectorMap).sort((a, b) => b[1] - a[1])
  const topSector = sectors[0]
  const numSectors = sectors.length

  // Concentration risk
  const topHolding = [...holdings].sort((a, b) => b.weight - a.weight)[0]
  const concentrated = topHolding.weight > 30

  // Performance
  const winners = holdings.filter(h => h.gainLossPercent > 0).sort((a, b) => b.gainLossPercent - a.gainLossPercent)
  const losers = holdings.filter(h => h.gainLossPercent < 0).sort((a, b) => a.gainLossPercent - b.gainLossPercent)
  const bestHolding = winners[0]
  const worstHolding = losers[0]

  // Health score
  let healthScore = 'Good'
  const issues: string[] = []
  if (concentrated) issues.push(`${topHolding.ticker} is ${topHolding.weight.toFixed(1)}% of portfolio`)
  if (numSectors < 3) issues.push('fewer than 3 sectors represented')
  if (holdings.length < 5) issues.push('fewer than 5 holdings')
  if (totalGainLossPercent < -15) issues.push('significant overall drawdown')

  if (issues.length === 0) healthScore = 'Excellent'
  else if (issues.length === 1) healthScore = 'Good'
  else if (issues.length === 2) healthScore = 'Fair'
  else healthScore = 'Poor'

  // Rebalancing suggestions
  const suggestions: string[] = []
  if (concentrated) suggestions.push(`Reduce ${topHolding.ticker} from ${topHolding.weight.toFixed(1)}% toward a 20–25% max position size to limit single-stock risk`)
  if (numSectors < 4) suggestions.push(`Add exposure to underrepresented sectors — consider Healthcare, Financials, or Consumer Staples for balance`)
  if (holdings.length < 8) suggestions.push(`Expand to 8–12 holdings to improve diversification without over-diluting returns`)
  if (topSector && topSector[1] > 50) suggestions.push(`${topSector[0]} represents ${topSector[1].toFixed(1)}% of portfolio — consider diversifying into other sectors`)
  if (losers.length > 0 && worstHolding && worstHolding.gainLossPercent < -20) suggestions.push(`Review ${worstHolding.ticker} (${worstHolding.gainLossPercent.toFixed(1)}%) — consider whether the original thesis still holds`)
  if (suggestions.length < 3) suggestions.push('Consider adding an S&P 500 index ETF (e.g. VOO or SPY) as a core holding for broad market exposure')

  return `## Portfolio Health Score
**${healthScore}** — ${issues.length === 0 ? 'Your portfolio is well-constructed with good diversification.' : `Areas to watch: ${issues.join(', ')}.`}

## Diversification Assessment
Your portfolio spans **${numSectors} sector${numSectors !== 1 ? 's' : ''}** across **${holdings.length} holdings**. ${topSector ? `Largest sector concentration is ${topSector[0]} at ${topSector[1].toFixed(1)}%.` : ''} ${concentrated ? `⚠️ ${topHolding.ticker} at ${topHolding.weight.toFixed(1)}% is a significant single-stock concentration.` : 'Single-stock concentration risk appears manageable.'}

## Top Performers & Losers
${bestHolding ? `**Best:** ${bestHolding.ticker} (+${bestHolding.gainLossPercent.toFixed(1)}%) — strong performer, consider trimming if it becomes overweight.` : ''}
${worstHolding ? `**Worst:** ${worstHolding.ticker} (${worstHolding.gainLossPercent.toFixed(1)}%) — review the investment thesis and consider whether to hold, add, or exit.` : ''}
${winners.length === holdings.length ? 'All positions are currently in the green — excellent overall performance.' : `${winners.length} of ${holdings.length} positions are profitable.`}

## Risk Analysis
Overall portfolio return: **${totalGainLossPercent >= 0 ? '+' : ''}${totalGainLossPercent.toFixed(2)}%** (${totalGainLoss >= 0 ? '+' : ''}$${Math.abs(totalGainLoss).toLocaleString('en-US', { minimumFractionDigits: 2 })}). ${numSectors < 3 ? 'Low sector diversification increases sensitivity to sector-specific downturns.' : 'Sector spread provides reasonable protection against isolated downturns.'} ${concentrated ? 'High single-stock concentration amplifies volatility.' : 'Position sizing appears balanced.'}

## Rebalancing Suggestions
${suggestions.slice(0, 5).map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Overall Outlook
${totalGainLossPercent > 10 ? 'Your portfolio is performing well above breakeven.' : totalGainLossPercent > 0 ? 'Your portfolio is modestly profitable.' : 'Your portfolio is currently underwater — focus on thesis validation for losing positions.'} ${healthScore === 'Excellent' || healthScore === 'Good' ? 'The overall construction is sound — maintain discipline and review quarterly.' : 'Consider the rebalancing suggestions above to improve risk-adjusted returns over time.'}

---
*Generated by Zains Game's built-in analysis engine. For informational purposes only. Not financial advice.*`
}
