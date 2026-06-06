'use client'
import { useMemo, useState } from 'react'
import { useSound } from '@/components/learn/useSound'
import { Check } from 'lucide-react'

/**
 * Tap-to-pair matching. Tap a term, then its definition (or vice-versa).
 * Correct pairs flash green and clear; wrong pairs shake. Auto-completes
 * when everything is matched. Reports correct = no mistakes.
 */
type Pair = { term: string; def: string }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

export default function MatchExercise({ pairs, onComplete }: { pairs: Pair[]; onComplete: (correct: boolean) => void }) {
  const sound = useSound()
  const terms = useMemo(() => shuffle(pairs.map((p) => p.term)), [pairs])
  const defs = useMemo(() => shuffle(pairs.map((p) => p.def)), [pairs])
  const defFor = useMemo(() => Object.fromEntries(pairs.map((p) => [p.term, p.def])), [pairs])

  const [selTerm, setSelTerm] = useState<string | null>(null)
  const [selDef, setSelDef] = useState<string | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrong, setWrong] = useState<{ term?: string; def?: string }>({})
  const [mistakes, setMistakes] = useState(0)
  const [done, setDone] = useState(false)

  const evaluate = (term: string | null, def: string | null) => {
    if (!term || !def) return
    if (defFor[term] === def) {
      sound.correct()
      const next = new Set(matched); next.add(term); next.add(def)
      setMatched(next); setSelTerm(null); setSelDef(null)
      if (next.size === pairs.length * 2 && !done) {
        setDone(true)
        setTimeout(() => onComplete(mistakes === 0), 450)
      }
    } else {
      sound.wrong()
      setMistakes((m) => m + 1)
      setWrong({ term, def })
      setTimeout(() => { setWrong({}); setSelTerm(null); setSelDef(null) }, 450)
    }
  }

  const tapTerm = (t: string) => {
    if (matched.has(t) || done) return
    const next = selTerm === t ? null : t
    setSelTerm(next); sound.tick()
    if (selDef) evaluate(next, selDef)
  }
  const tapDef = (d: string) => {
    if (matched.has(d) || done) return
    const next = selDef === d ? null : d
    setSelDef(next); sound.tick()
    if (selTerm) evaluate(selTerm, next)
  }

  const tileClass = (val: string, sel: boolean, isWrong: boolean) =>
    [
      'w-full text-left px-3 py-3.5 rounded-2xl border-2 border-b-4 font-semibold text-sm transition-all',
      matched.has(val) ? 'border-green-500/40 bg-green-500/10 text-green-300/50 opacity-50'
        : isWrong ? 'border-red-500 bg-red-500/15 text-red-200'
        : sel ? 'border-blue-500 bg-blue-500/15 text-white'
        : 'border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500 active:translate-y-0.5 active:border-b-2',
    ].join(' ')

  return (
    <div>
      <style>{`@keyframes mxShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}`}</style>
      <p className="text-base font-bold text-white mb-4">Tap the matching pairs</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-3">
          {terms.map((t) => (
            <button key={t} onClick={() => tapTerm(t)} disabled={matched.has(t)}
              className={tileClass(t, selTerm === t, wrong.term === t)}
              style={wrong.term === t ? { animation: 'mxShake .4s' } : undefined}>
              <span className="flex items-center justify-between gap-1">{t}{matched.has(t) && <Check className="h-4 w-4 text-green-400 shrink-0" />}</span>
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {defs.map((d) => (
            <button key={d} onClick={() => tapDef(d)} disabled={matched.has(d)}
              className={tileClass(d, selDef === d, wrong.def === d)}
              style={wrong.def === d ? { animation: 'mxShake .4s' } : undefined}>
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
