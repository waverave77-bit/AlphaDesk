'use client'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface AllocationChartProps {
  data: { name: string; value: number; color?: string }[]
  title?: string
}

const COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
]

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-white">{payload[0].name}</p>
      <p className="text-gray-300">{payload[0].value.toFixed(1)}%</p>
    </div>
  )
}

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function AllocationChart({ data, title }: AllocationChartProps) {
  if (!data.length) return <div className="h-64 flex items-center justify-center text-gray-500 text-sm">No data</div>

  const sorted = [...data].sort((a, b) => b.value - a.value)

  return (
    <div>
      {title && <p className="text-sm font-medium text-gray-400 mb-3">{title}</p>}
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={sorted}
            cx="50%"
            cy="50%"
            outerRadius={120}
            innerRadius={55}
            dataKey="value"
            labelLine={false}
            label={CustomLabel}
          >
            {sorted.map((entry, index) => (
              <Cell key={entry.name} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span className="text-xs text-gray-300">{value}</span>}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
