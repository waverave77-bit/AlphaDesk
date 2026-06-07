'use client'
import { useState, useRef, useEffect } from 'react'
import { HelpCircle } from 'lucide-react'

/** A tap/click-to-open explanation bubble — works on mobile (native title doesn't). */
export default function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <span ref={ref} className="relative inline-flex align-middle">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        aria-label="What's this?"
        className={`transition-colors ${open ? 'text-blue-400' : 'text-gray-600 hover:text-gray-400'}`}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          className="absolute left-1/2 -translate-x-1/2 top-6 z-[60] w-48 bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-[11px] leading-snug font-normal normal-case tracking-normal text-gray-300 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {text}
          <span className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-gray-950 border-l border-t border-gray-700 rotate-45" />
        </span>
      )}
    </span>
  )
}
