'use client'
import { useChartType } from '@/components/ChartTypeProvider'
import TradingViewChart from './TradingViewChart'
import LineChart from './LineChart'

interface Props { ticker: string; height?: number }

export default function SmartChart({ ticker, height = 500 }: Props) {
  const { chartType } = useChartType()
  if (chartType === 'line') return <LineChart ticker={ticker} height={height} />
  return <TradingViewChart ticker={ticker} />
}
