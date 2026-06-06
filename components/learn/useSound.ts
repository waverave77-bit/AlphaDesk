'use client'
import { useCallback, useEffect, useState } from 'react'

/**
 * Tiny Web Audio sound effects — no asset files. Synthesises short tones for
 * correct / wrong / lesson-complete. Respects a localStorage mute flag.
 * Audio only starts after a user gesture (quiz taps qualify), so no autoplay block.
 */
const MUTE_KEY = 'zg_learn_muted'

let ctx: AudioContext | null = null
function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.18) {
  const c = ac()
  if (!c) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  const t = c.currentTime + start
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

function isMuted() {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(MUTE_KEY) === '1'
}

export function useSound() {
  const [muted, setMuted] = useState(false)
  useEffect(() => { setMuted(isMuted()) }, [])

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m
      try { localStorage.setItem(MUTE_KEY, next ? '1' : '0') } catch {}
      return next
    })
  }, [])

  const correct = useCallback(() => {
    if (isMuted()) return
    tone(587.33, 0, 0.12, 'sine')      // D5
    tone(880.0, 0.09, 0.16, 'sine')    // A5 — bright rising ding
  }, [])

  const wrong = useCallback(() => {
    if (isMuted()) return
    tone(196.0, 0, 0.22, 'sawtooth', 0.12) // low G3 buzz
    tone(146.83, 0.06, 0.22, 'sawtooth', 0.1)
  }, [])

  const complete = useCallback(() => {
    if (isMuted()) return
    // little ascending fanfare
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.1, 0.3, 'triangle', 0.16))
  }, [])

  const tick = useCallback(() => {
    if (isMuted()) return
    tone(1200, 0, 0.03, 'square', 0.05)
  }, [])

  return { muted, toggleMute, correct, wrong, complete, tick }
}
