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

// Fallback prices shown while live data loads (updated May 2025)
const FALLBACK: Record<string, { price: number; change: number }> = {
  AAPL: { price: 211.00, change: 0.50 },
  TSLA: { price: 335.00, change: -1.20 },
  MSFT: { price: 450.00, change: 0.80 },
  NVDA: { price: 1090.00, change: 2.10 },
  GOOGL: { price: 175.00, change: 0.40 },
  META: { price: 590.00, change: 1.50 },
  AMZN: { price: 198.00, change: -0.50 },
  NFLX: { price: 1070.00, change: 1.80 },
  AMD: { price: 155.00, change: -1.00 },
  INTC: { price: 21.00, change: -0.80 },
  JPM: { price: 250.00, change: 0.60 },
  BAC: { price: 43.00, change: -0.20 },
  WMT: { price: 95.00, change: 0.30 },
  DIS: { price: 100.00, change: 0.90 },
  SPOT: { price: 600.00, change: 3.50 },
  UBER: { price: 80.00, change: 1.50 },
  LYFT: { price: 14.00, change: -2.50 },
  PYPL: { price: 67.00, change: -0.70 },
  SQ: { price: 70.00, change: 1.80 },
  COIN: { price: 260.00, change: 4.00 },
  SPY: { price: 580.00, change: 0.40 },
  QQQ: { price: 500.00, change: 0.60 },
  GLD: { price: 300.00, change: 0.20 },
  PLTR: { price: 120.00, change: 3.00 },
  SOFI: { price: 14.00, change: -1.00 },
  RBLX: { price: 55.00, change: 2.50 },
  SNAP: { price: 10.00, change: -0.80 },
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
    // Fetch live prices for all symbols in batches to avoid rate limits
    const fetchAll = async (symbols: string[], setter: (d: TickerData[]) => void) => {
      const results = await Promise.allSettled(
        symbols.map(sym => fetch(`/api/stock/${sym}`).then(r => r.json()))
      )
      setter(
        symbols.map((sym, idx) => {
          const result = results[idx]
          if (result.status === 'fulfilled' && result.value?.quote?.price) {
            return {
              symbol: sym,
              price: result.value.quote.price,
              change: result.value.quote.changePercent ?? (FALLBACK[sym]?.change ?? null),
            }
          }
          return { symbol: sym, price: FALLBACK[sym]?.price ?? null, change: FALLBACK[sym]?.change ?? null }
        })
      )
    }

    // Stagger the 3 rows slightly to avoid hammering the API all at once
    fetchAll(ROW1, setRow1)
    setTimeout(() => fetchAll(ROW2, setRow2), 500)
    setTimeout(() => fetchAll(ROW3, setRow3), 1000)
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
