'use client'
import { ReactNode } from 'react'

/**
 * The signature Duolingo-style 3D "pushable" button.
 * Layered front/edge/shadow so the front depresses on press (GPU transforms,
 * no box-shadow animation). Technique adapted from Josh Comeau's 3D button.
 */
export type PushVariant = 'blue' | 'green' | 'purple' | 'emerald' | 'red' | 'amber' | 'pink' | 'gray' | 'white'

const VARIANTS: Record<PushVariant, { front: string; edge: string; text: string }> = {
  blue:    { front: '#3b82f6', edge: '#1d4ed8', text: '#fff' },
  green:   { front: '#58cc02', edge: '#46a302', text: '#fff' }, // "correct" green
  purple:  { front: '#a855f7', edge: '#7e22ce', text: '#fff' },
  emerald: { front: '#10b981', edge: '#047857', text: '#fff' },
  red:     { front: '#ef4444', edge: '#b91c1c', text: '#fff' },
  amber:   { front: '#f59e0b', edge: '#b45309', text: '#fff' },
  pink:    { front: '#ec4899', edge: '#be185d', text: '#fff' },
  gray:    { front: '#374151', edge: '#1f2937', text: '#e5e7eb' },
  white:   { front: '#ffffff', edge: '#d1d5db', text: '#1f2937' },
}

let injected = false
function ensureStyles() {
  if (injected || typeof document === 'undefined') return
  injected = true
  const css = `
  .pushable{background:transparent;border:none;padding:0;cursor:pointer;outline-offset:4px;-webkit-tap-highlight-color:transparent;user-select:none;display:inline-block}
  .pushable .pb-shadow{position:absolute;inset:0;border-radius:16px;background:rgba(0,0,0,.3);transform:translateY(2px);transition:transform 600ms cubic-bezier(.3,.7,.4,1);will-change:transform}
  .pushable .pb-edge{position:absolute;inset:0;border-radius:16px;background:var(--pb-edge)}
  .pushable .pb-front{display:block;position:relative;border-radius:16px;background:var(--pb-front);color:var(--pb-text);transform:translateY(-5px);transition:transform 600ms cubic-bezier(.3,.7,.4,1);will-change:transform;font-weight:800;letter-spacing:.01em}
  .pushable:hover .pb-front{transform:translateY(-7px);transition:transform 250ms cubic-bezier(.3,.7,.4,1.5)}
  .pushable:hover .pb-shadow{transform:translateY(5px);transition:transform 250ms cubic-bezier(.3,.7,.4,1.5)}
  .pushable:active .pb-front{transform:translateY(-2px);transition:transform 34ms}
  .pushable:active .pb-shadow{transform:translateY(1px);transition:transform 34ms}
  .pushable:disabled{cursor:not-allowed;filter:grayscale(.5) brightness(.65)}
  .pushable:disabled .pb-front{transform:translateY(-5px)}
  `
  const el = document.createElement('style')
  el.textContent = css
  document.head.appendChild(el)
}

export default function PushButton({
  children,
  variant = 'blue',
  onClick,
  disabled,
  type = 'button',
  fullWidth,
  className = '',
  ariaLabel,
}: {
  children: ReactNode
  variant?: PushVariant
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  fullWidth?: boolean
  /** classes applied to the FRONT layer — control padding/size/font here */
  className?: string
  ariaLabel?: string
}) {
  ensureStyles()
  const v = VARIANTS[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="pushable"
      style={{
        // CSS vars consumed by the injected styles
        ['--pb-front' as any]: v.front,
        ['--pb-edge' as any]: v.edge,
        ['--pb-text' as any]: v.text,
        width: fullWidth ? '100%' : undefined,
        position: 'relative',
      }}
    >
      <span className="pb-shadow" />
      <span className="pb-edge" />
      <span className={`pb-front ${className || 'px-6 py-3.5 text-base'}`}>{children}</span>
    </button>
  )
}
