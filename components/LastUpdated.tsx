'use client'
import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

function formatRelative(date: Date): string {
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffSec < 15) return 'Just now'
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function LastUpdated({ time, className }: { time: Date | null; className?: string }) {
  const [label, setLabel] = useState<string>('')

  useEffect(() => {
    if (!time) return
    setLabel(formatRelative(time))
    const id = setInterval(() => setLabel(formatRelative(time)), 30_000)
    return () => clearInterval(id)
  }, [time])

  if (!time || !label) return null

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] text-slate-400 ${className ?? ''}`}>
      <Clock className="h-3 w-3 shrink-0" />
      Updated {label}
    </span>
  )
}
