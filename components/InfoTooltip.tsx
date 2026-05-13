'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface InfoTooltipProps {
  text: string
  className?: string
}

export default function InfoTooltip({ text, className }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const show = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.top + window.scrollY - 8, left: r.left + r.width / 2 + window.scrollX })
    }
    setOpen(true)
  }

  const tooltip = open && mounted ? createPortal(
    <span
      style={{ position: 'absolute', top: pos.top, left: pos.left, transform: 'translate(-50%, -100%)', zIndex: 99999 }}
      className="w-60 bg-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2.5 shadow-xl leading-relaxed pointer-events-none block"
    >
      {text}
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 block" />
    </span>,
    document.body
  ) : null

  return (
    <span className={`relative inline-flex items-center ${className ?? ''}`}>
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        onMouseEnter={show}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center justify-center h-[14px] w-[14px] rounded-full bg-slate-200 text-slate-500 hover:bg-blue-100 hover:text-blue-600 transition-colors focus:outline-none text-[9px] font-bold leading-none shrink-0"
        type="button"
        aria-label="More info"
      >
        ?
      </button>
      {tooltip}
    </span>
  )
}
