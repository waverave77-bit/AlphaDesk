import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getStockQuote } from '@/lib/yahoo-finance'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

function getAnthropicKey(): string {
  const fromEnv = process.env.ANTHROPIC_API_KEY
  if (fromEnv && fromEnv.length > 10) return fromEnv
  try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    const content = fs.readFileSync(envPath, 'utf8')
    const match = content.match(/ANTHROPIC_API_KEY="?([^"\n]+)"?/)
    return match?.[1] ?? ''
  } catch { return '' }
}

const MR_GUY_SYSTEM = `You are Mr. Guy, a funny finance mascot who talks like a smart friend at a bar. Plain English only — no jargon. If you use a finance term, immediately explain it in parentheses. Casual, confident, occasionally funny. No markdown asterisks or pound signs. No em dashes. Emojis only: 🟢 🟡 🔴 🚨 ✅ ❌.`

const NAME_TO_TICKER: Record<string, string> = {
  'apple': 'AAPL', 'microsoft': 'MSFT', 'google': 'GOOGL', 'alphabet': 'GOOGL',
  'amazon': 'AMZN', 'meta': 'META', 'facebook': 'META', 'netflix': 'NFLX',
  'nvidia': 'NVDA', 'tesla': 'TSLA', 'amd': 'AMD', 'intel': 'INTC',
  'coinbase': 'COIN', 'palantir': 'PLTR', 'robinhood': 'HOOD',
  'uber': 'UBER', 'lyft': 'LYFT', 'airbnb': 'ABNB', 'doordash': 'DASH',
  'shopify': 'SHOP', 'paypal': 'PYPL', 'visa': 'V', 'mastercard': 'MA',
  'jpmorgan': 'JPM', 'jp morgan': 'JPM', 'bank of america': 'BAC',
  'goldman': 'GS', 'morgan stanley': 'MS', 'wells fargo': 'WFC',
  'amc': 'AMC', 'gamestop': 'GME', 'rivian': 'RIVN', 'lucid': 'LCID',
  'snapchat': 'SNAP', 'snap': 'SNAP', 'spotify': 'SPOT', 'roblox': 'RBLX',
  'sofi': 'SOFI', 'upstart': 'UPST', 'affirm': 'AFRM',
  'crowdstrike': 'CRWD', 'cloudflare': 'NET', 'datadog': 'DDOG', 'snowflake': 'SNOW',
  'palo alto': 'PANW', 'draftkings': 'DKNG',
  'eli lilly': 'LLY', 'pfizer': 'PFE', 'moderna': 'MRNA',
  'exxon': 'XOM', 'chevron': 'CVX',
  'ford': 'F', 'general motors': 'GM', 'boeing': 'BA',
  'starbucks': 'SBUX', 'mcdonalds': 'MCD', "mcdonald's": 'MCD',
  'disney': 'DIS', 'nike': 'NKE', 'walmart': 'WMT',
  'bitcoin': 'BTC-USD', 'ethereum': 'ETH-USD', 'btc': 'BTC-USD', 'eth': 'ETH-USD',
  'arm': 'ARM', 'qualcomm': 'QCOM', 'broadcom': 'AVGO', 'tsmc': 'TSM',
}

function extractTickerFromTrade(trade: string): string | null {
  const dollarMatch = trade.match(/\$([A-Z]{1,5})/)
  if (dollarMatch) return dollarMatch[1]

  const lower = trade.toLowerCase()
  for (const [name, ticker] of Object.entries(NAME_TO_TICKER)) {
    if (lower.includes(name)) return ticker
  }

  const skipWords = new Set([
    'AI','ETF','CEO','IPO','GDP','EPS','PE','BUY','SELL','USD','US','UK','EU',
    'FED','SEC','NYSE','SP','OR','IF','IN','AT','TO','OF','ON','BY','BE','IT',
    'IS','AS','AN','AM','DO','GO','HI','SO','UP','NO','OK','ALL','AND','THE',
    'FOR','NOT','BUT','ARE','WAS','HAS','HAD','CAN','DID','GOT','GET','SET',
  ])
  const upperMatch = trade.match(/\b([A-Z]{2,5})\b/)
  if (upperMatch && !skipWords.has(upperMatch[1])) return upperMatch[1]

  return null
}

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: getAnthropicKey() })
  try {
    const { trade } = await req.json()
    if (!trade || typeof trade !== 'string') {
      return NextResponse.json({ error: 'Missing trade description' }, { status: 400 })
    }

    const ticker = extractTickerFromTrade(trade)
    let context = 'no specific stock identified'

    if (ticker) {
      try {
        const q = await getStockQuote(ticker)
        if (q) {
          context = `${ticker} (${q.companyName}): price $${q.price.toFixed(2)}, ${q.changePercent >= 0 ? '+' : ''}${q.changePercent.toFixed(2)}% today`
          if (q.peRatio) context += `, P/E ${q.peRatio.toFixed(1)}`
          if (q.week52High && q.week52Low) context += `, 52-week range $${q.week52Low.toFixed(2)}-$${q.week52High.toFixed(2)}`
          if (q.beta) context += `, beta ${q.beta.toFixed(2)} (volatility vs market)`
        }
      } catch {
        context = `tried to look up ${ticker} but data unavailable`
      }
    }

    const userPrompt = `Someone is thinking about this trade: '${trade}'

Live data:
${context}

Give an honest assessment. Don't sugarcoat. Structure:
VERDICT: [SMART MOVE / RISKY / NOT GREAT / ACTUALLY DUMB]

WHY: [2-3 sentences, be real, be funny if appropriate]

IF YOU DO IT: [one tip to make it less risky or one thing to watch]

BOTTOM LINE: [one punchy sentence]`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      system: MR_GUY_SYSTEM,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    const verdictMatch = text.match(/VERDICT:\s*(.+?)(?:\n|$)/i)
    const verdict = verdictMatch?.[1]?.trim() ?? 'RISKY'

    return NextResponse.json({ verdict, analysis: text })
  } catch (err: any) {
    console.error('Am I Dumb error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
