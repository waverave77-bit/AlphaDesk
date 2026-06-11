'use client'
import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TickerItem {
  key: string
  label: string
  price: number
  change: number
  changePercent: number
  format: string
}

function getFearGreedColor(value: number) {
  if (value >= 75) return 'text-green-500'
  if (value >= 55) return 'text-green-400'
  if (value >= 45) return 'text-yellow-500'
  if (value >= 25) return 'text-orange-400'
  return 'text-red-400'
}

function getFearGreedLabel(value: number) {
  if (value >= 75) return 'Extreme Greed'
  if (value >= 55) return 'Greed'
  if (value >= 45) return 'Neutral'
  if (value >= 25) return 'Fear'
  return 'Extreme Fear'
}

function formatPrice(price: number, format: string) {
  if (format === 'crypto') {
    if (price >= 10000) return `$${(price / 1000).toFixed(1)}k`
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  }
  if (format === 'feargreed') return `${Math.round(price)}`
  if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
  return price.toFixed(2)
}

function TickerItem({ item }: { item: TickerItem }) {
  if (item.format === 'feargreed') {
    return (
      <span className="flex items-center gap-2 px-5 border-r border-slate-200 shrink-0">
        <span className="text-xs font-semibold text-slate-500">{item.label}</span>
        <span className={cn('text-xs font-bold', getFearGreedColor(item.price))}>
          {formatPrice(item.price, item.format)} · {getFearGreedLabel(item.price)}
        </span>
      </span>
    )
  }

  const up = item.changePercent >= 0
  return (
    <span className="flex items-center gap-2 px-5 border-r border-slate-200 shrink-0">
      <span className="text-xs font-semibold text-slate-500">{item.label}</span>
      <span className="text-xs font-bold text-slate-900">{formatPrice(item.price, item.format)}</span>
      <span className={cn(
        'text-xs font-semibold px-1.5 py-0.5 rounded',
        up ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'
      )}>
        {up ? '+' : ''}{item.changePercent.toFixed(2)}%
      </span>
    </span>
  )
}

export default function TickerBar() {
  const [items, setItems] = useState<TickerItem[]>([])
  const [loading, setLoading] = useState(true)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/ticker')
      .then(r => r.json())
      .then(d => { setItems(d.items ?? []); setLoading(false) })
      .catch(() => setLoading(false))

    // Refresh every 60 seconds during market hours
    const interval = setInterval(() => {
      fetch('/api/ticker')
        .then(r => r.json())
        .then(d => setItems(d.items ?? []))
        .catch(() => {})
    }, 60_000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="h-9 bg-[#16130a] dark:bg-gray-950 border-b border-black/20 dark:border-gray-800 flex items-center px-4">
        <div className="flex gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-3 w-20 bg-white/10 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!items.length) return null

  // Duplicate items for seamless loop
  const doubled = [...items, ...items]

  return (
    <div className="h-9 bg-[#16130a] dark:bg-gray-950 border-b border-black/20 dark:border-gray-800 flex items-center overflow-hidden relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#16130a] dark:from-gray-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#16130a] dark:from-gray-950 to-transparent z-10 pointer-events-none" />

      <div
        ref={trackRef}
        className="flex items-center ticker-scroll"
        style={{
          animation: `ticker-scroll ${items.length * 6}s linear infinite`,
          willChange: 'transform',
        }}
      >
        {doubled.map((item, i) => (
          <span key={`${item.key}-${i}`} className="flex items-center gap-2 px-5 border-r border-white/10 shrink-0 last:border-r-0">
            <span className="text-xs font-mono font-semibold text-white/50">{item.label}</span>
            {item.format === 'feargreed' ? (
              <span className={cn('text-xs font-mono font-bold', getFearGreedColor(item.price))}>
                {formatPrice(item.price, item.format)} · {getFearGreedLabel(item.price)}
              </span>
            ) : (
              <>
                <span className="text-xs font-mono font-bold text-white/90">{formatPrice(item.price, item.format)}</span>
                <span className={cn(
                  'text-xs font-mono font-semibold',
                  item.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                )}>
                  {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                </span>
              </>
            )}
          </span>
        ))}
      </div>

      <style jsx>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-scroll {
          animation-name: ticker-scroll;
        }
        .ticker-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
