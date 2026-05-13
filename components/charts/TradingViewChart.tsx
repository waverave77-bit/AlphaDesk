'use client'

import { useEffect, useRef } from 'react'

const CHART_HEIGHT = 500

interface TradingViewChartProps {
  ticker: string
}

export default function TradingViewChart({ ticker }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ''

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    widgetDiv.style.height = `${CHART_HEIGHT}px`
    widgetDiv.style.width = '100%'
    container.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.type = 'text/javascript'

    script.textContent = JSON.stringify({
      autosize: false,
      width: '100%',
      height: CHART_HEIGHT,
      symbol: ticker,
      interval: 'D',
      timezone: 'America/New_York',
      theme: 'dark',
      style: '1',
      locale: 'en',
      withdateranges: true,
      range: '3M',
      hide_side_toolbar: false,
      allow_symbol_change: false,
      save_image: true,
      calendar: false,
    })

    container.appendChild(script)

    return () => { if (container) container.innerHTML = '' }
  }, [ticker])

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container w-full"
      style={{ height: `${CHART_HEIGHT}px` }}
    />
  )
}
