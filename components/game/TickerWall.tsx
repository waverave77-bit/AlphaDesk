'use client'
import { useEffect, useState } from 'react'

function getMarketStatus(): { open: boolean; label: string } {
  const now = new Date()
  // Convert to ET
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = et.getDay() // 0=Sun, 6=Sat
  const h = et.getHours()
  const m = et.getMinutes()
  const mins = h * 60 + m
  const isWeekday = day >= 1 && day <= 5
  const isOpen = isWeekday && mins >= 570 && mins < 960 // 9:30am–4:00pm ET
  const isPreMarket = isWeekday && mins >= 240 && mins < 570 // 4am–9:30am
  const isAfterHours = isWeekday && mins >= 960 && mins < 1200 // 4pm–8pm
  const label = isOpen ? 'Markets Open · Live prices'
    : isPreMarket ? 'Pre-Market · Prices as of last close'
    : isAfterHours ? 'After Hours · Prices as of market close'
    : 'Markets Closed · Prices as of last close'
  return { open: isOpen, label }
}

interface TickerData {
  symbol: string
  price: number | null
  change: number | null
}

const ROW1 = ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'GOOGL', 'META', 'AMZN', 'NFLX', 'AMD']
const ROW2 = ['INTC', 'JPM', 'BAC', 'WMT', 'DIS', 'SPOT', 'UBER', 'LYFT', 'PYPL']
const ROW3 = ['SQ', 'COIN', 'SPY', 'QQQ', 'GLD', 'PLTR', 'SOFI', 'RBLX', 'SNAP']

// Hardcoded fallback prices so there's always something to show
const FALLBACK: Record<string, { price: number; change: number }> = {
  AAPL: { price: 189.30, change: 1.24 },
  TSLA: { price: 248.50, change: -2.15 },
  MSFT: { price: 415.80, change: 0.87 },
  NVDA: { price: 875.40, change: 3.52 },
  GOOGL: { price: 175.60, change: 0.43 },
  META: { price: 527.10, change: 1.95 },
  AMZN: { price: 198.20, change: -0.62 },
  NFLX: { price: 648.90, change: 2.11 },
  AMD: { price: 162.40, change: -1.38 },
  INTC: { price: 22.85, change: -0.94 },
  JPM: { price: 218.70, change: 0.55 },
  BAC: { price: 41.20, change: -0.22 },
  WMT: { price: 84.50, change: 0.31 },
  DIS: { price: 112.30, change: 1.05 },
  SPOT: { price: 356.80, change: 4.12 },
  UBER: { price: 72.40, change: 1.67 },
  LYFT: { price: 13.80, change: -3.21 },
  PYPL: { price: 68.20, change: -0.89 },
  SQ: { price: 72.60, change: 2.34 },
  COIN: { price: 228.40, change: 5.67 },
  SPY: { price: 547.20, change: 0.41 },
  QQQ: { price: 474.80, change: 0.63 },
  GLD: { price: 242.10, change: 0.18 },
  PLTR: { price: 28.90, change: 3.45 },
  SOFI: { price: 7.82, change: -1.25 },
  RBLX: { price: 42.30, change: 2.78 },
  SNAP: { price: 14.60, change: -0.94 },
}

function TickerChip({ data }: { data: TickerData }) {
  const isPositive = (data.change ?? 0) >= 0
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-900 border border-gray-800 text-xs whitespace-nowrap mx-1 shrink-0">
      <span className="font-bold text-white">{data.symbol}</span>
      {data.price !== null && (
        <span className="text-gray-400">${data.price.toFixed(2)}</span>
      )}
      {data.change !== null && (
        <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
          {isPositive ? '+' : ''}{data.change.toFixed(2)}%
        </span>
      )}
    </span>
  )
}

function TickerRow({ tickers, direction, speed }: { tickers: TickerData[], direction: 'left' | 'right', speed: number }) {
  // Duplicate for seamless loop
  const items = [...tickers, ...tickers, ...tickers]
  const animName = direction === 'left' ? 'ticker-left' : 'ticker-right'

  return (
    <div className="overflow-hidden relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
      <div
        className="flex"
        style={{ animation: `${animName} ${speed}s linear infinite` }}
      >
        {items.map((t, i) => (
          <TickerChip key={`${t.symbol}-${i}`} data={t} />
        ))}
      </div>
    </div>
  )
}

export default function TickerWall() {
  const [row1, setRow1] = useState<TickerData[]>(ROW1.map(s => ({ symbol: s, price: FALLBACK[s]?.price ?? null, change: FALLBACK[s]?.change ?? null })))
  const [row2, setRow2] = useState<TickerData[]>(ROW2.map(s => ({ symbol: s, price: FALLBACK[s]?.price ?? null, change: FALLBACK[s]?.change ?? null })))
  const [row3, setRow3] = useState<TickerData[]>(ROW3.map(s => ({ symbol: s, price: FALLBACK[s]?.price ?? null, change: FALLBACK[s]?.change ?? null })))
  const marketStatus = getMarketStatus()

  useEffect(() => {
    // Fetch a handful of real prices in the background
    const fetchSome = async (symbols: string[], setter: (d: TickerData[]) => void, fallbackList: string[]) => {
      const subset = symbols.slice(0, 3) // only fetch 3 per row to avoid rate limits
      try {
        const results = await Promise.allSettled(
          subset.map(sym => fetch(`/api/stock/${sym}`).then(r => r.json()))
        )
        setter(
          symbols.map(sym => {
            const idx = subset.indexOf(sym)
            if (idx !== -1) {
              const result = results[idx]
              if (result.status === 'fulfilled' && result.value?.quote?.price) {
                return {
                  symbol: sym,
                  price: result.value.quote.price,
                  change: result.value.quote.changePercent ?? (FALLBACK[sym]?.change ?? null),
                }
              }
            }
            return { symbol: sym, price: FALLBACK[sym]?.price ?? null, change: FALLBACK[sym]?.change ?? null }
          })
        )
      } catch {
        // keep fallback
      }
    }

    fetchSome(ROW1, setRow1, ROW1)
    fetchSome(ROW2, setRow2, ROW2)
    fetchSome(ROW3, setRow3, ROW3)
  }, [])

  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-800 bg-gray-950 py-2 space-y-1.5">
      <TickerRow tickers={row1} direction="left" speed={40} />
      <TickerRow tickers={row2} direction="right" speed={50} />
      <TickerRow tickers={row3} direction="left" speed={35} />
      <div className="flex items-center justify-center gap-1.5 pt-0.5">
        <span className={`h-1.5 w-1.5 rounded-full ${marketStatus.open ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
        <span className="text-[10px] text-gray-600">{marketStatus.label}</span>
      </div>
    </div>
  )
}
