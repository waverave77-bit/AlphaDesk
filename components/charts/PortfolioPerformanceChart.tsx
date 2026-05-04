'use client'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { format, parseISO } from 'date-fns'

interface PerformancePoint {
  date: string
  portfolioValue: number
  benchmarkValue: number
}

interface PortfolioPerformanceChartProps {
  data: PerformancePoint[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 shadow-xl text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value >= 0 ? '+' : ''}{p.value.toFixed(2)}%
        </p>
      ))}
    </div>
  )
}

export default function PortfolioPerformanceChart({ data }: PortfolioPerformanceChartProps) {
  if (!data.length) return <div className="h-48 flex items-center justify-center text-gray-500 text-sm">No performance data</div>

  const formatted = data.map((d) => ({
    ...d,
    dateLabel: (() => { try { return format(parseISO(d.date), 'MMM d') } catch { return d.date } })(),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
        <XAxis dataKey="dateLabel" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} width={45} />
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={(v) => <span className="text-xs text-gray-300">{v}</span>} />
        <Line type="monotone" dataKey="portfolioValue" name="Portfolio" stroke="#3b82f6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="benchmarkValue" name="S&P 500" stroke="#6b7280" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
