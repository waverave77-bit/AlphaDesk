'use client'
import { createContext, useContext, useState, useEffect } from 'react'

type ChartType = 'tradingview' | 'line'

interface ChartTypeContextValue {
  chartType: ChartType
  setChartType: (t: ChartType) => void
}

const ChartTypeContext = createContext<ChartTypeContextValue>({
  chartType: 'tradingview',
  setChartType: () => {},
})

export function ChartTypeProvider({ children }: { children: React.ReactNode }) {
  const [chartType, setChartTypeState] = useState<ChartType>('line')

  useEffect(() => {
    const saved = localStorage.getItem('chartType') as ChartType | null
    if (saved === 'tradingview') setChartTypeState('tradingview')
    // 'line' is already the default, no need to set it
  }, [])

  const setChartType = (t: ChartType) => {
    setChartTypeState(t)
    localStorage.setItem('chartType', t)
  }

  return (
    <ChartTypeContext.Provider value={{ chartType, setChartType }}>
      {children}
    </ChartTypeContext.Provider>
  )
}

export function useChartType() {
  return useContext(ChartTypeContext)
}
