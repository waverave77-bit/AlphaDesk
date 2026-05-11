'use client'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'

interface Holding { name: string; value: number; shares: number }

const COLORS = [
  '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af',
  '#6366f1', '#4f46e5', '#4338ca', '#3730a3',
  '#0ea5e9', '#0284c7', '#0369a1', '#075985',
  '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6',
  '#10b981', '#059669', '#047857', '#065f46',
]

function cleanName(raw: string) {
  return raw
    .replace(/ INC$/i, '').replace(/ CORP$/i, '').replace(/ LTD$/i, '')
    .replace(/ LLC$/i, '').replace(/ LP$/i, '').replace(/ CO$/i, '')
    .replace(/ PLC$/i, '').replace(/ NV$/i, '').replace(/ SA$/i, '')
    .replace(/ COM INC/i, '').replace(/ HLDGS/i, '').replace(/ HOLDINGS/i, '')
    .trim()
}

function formatVal(v: number) {
  const dollars = v * 1000
  if (dollars >= 1e9) return `$${(dollars / 1e9).toFixed(1)}B`
  if (dollars >= 1e6) return `$${(dollars / 1e6).toFixed(0)}M`
  return `$${(dollars / 1e3).toFixed(0)}K`
}

const CustomContent = ({ x, y, width, height, name, value, index }: any) => {
  if (width < 30 || height < 20) return null
  const color = COLORS[index % COLORS.length]
  const label = cleanName(name ?? '')
  const showValue = height > 40 && width > 60
  const showLabel = width > 45 && height > 28

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} rx={4} stroke="#fff" strokeWidth={2} />
      {showLabel && (
        <text x={x + 8} y={y + (showValue ? height / 2 - 6 : height / 2 + 5)} fill="white" fontSize={Math.min(12, width / 8)} fontWeight={600} dominantBaseline="middle">
          {label.length > Math.floor(width / 8) ? label.slice(0, Math.floor(width / 8) - 1) + '…' : label}
        </text>
      )}
      {showValue && (
        <text x={x + 8} y={y + height / 2 + 10} fill="rgba(255,255,255,0.75)" fontSize={10}>
          {formatVal(value)}
        </text>
      )}
    </g>
  )
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-900 mb-0.5">{name}</p>
      <p className="text-slate-500">Value: <span className="text-slate-800 font-medium">{formatVal(value)}</span></p>
      <p className="text-slate-400 text-[10px] mt-1">Bigger tile = more money invested</p>
    </div>
  )
}

export default function HoldingsTreemap({ holdings }: { holdings: Holding[] }) {
  if (!holdings.length) return (
    <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No holdings data</div>
  )

  const data = holdings.map(h => ({ name: h.name, value: h.value, shares: h.shares }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <Treemap
        data={data}
        dataKey="value"
        content={<CustomContent />}
      >
        <Tooltip content={<CustomTooltip />} />
      </Treemap>
    </ResponsiveContainer>
  )
}
