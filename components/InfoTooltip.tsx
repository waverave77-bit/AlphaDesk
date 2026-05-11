'use client'
import { useState } from 'react'
import { HelpCircle } from 'lucide-react'

interface InfoTooltipProps {
  text: string
  className?: string
}

export default function InfoTooltip({ text, className }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <span className={`relative inline-flex items-center ${className ?? ''}`}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-slate-400 hover:text-blue-500 transition-colors focus:outline-none"
        type="button"
        aria-label="More info"
      >
        <HelpCircle className="h-3 w-3" />
      </button>
      {open && (
        <span className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 w-56 bg-slate-800 border border-slate-700 text-slate-100 text-xs rounded-lg px-3 py-2 shadow-xl leading-relaxed pointer-events-none">
          {text}
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 rotate-45" />
        </span>
      )}
    </span>
  )
}
