'use client'
import { useState, useEffect } from 'react'
import MrGuyMascot from '@/components/learn/MrGuyMascot'
import { TrendingUp, ShieldCheck, Trophy, X } from 'lucide-react'

/** One-time Mr. Guy welcome to the $100K Challenge — shows once for everyone. */
const KEY = 'zg_sim_intro_v1'

function Point({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-gray-950/40 rounded-2xl p-3 text-center">
      <div className="flex justify-center mb-1.5">{icon}</div>
      <p className="text-white font-bold text-sm leading-tight">{title}</p>
      <p className="text-gray-400 text-[11px] mt-0.5">{desc}</p>
    </div>
  )
}

export default function SimIntro() {
  const [show, setShow] = useState(false)
  useEffect(() => { if (!localStorage.getItem(KEY)) setShow(true) }, [])
  if (!show) return null
  const dismiss = () => { try { localStorage.setItem(KEY, '1') } catch {}; setShow(false) }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/15 to-gray-900 border-2 border-blue-500/20 rounded-3xl p-5 sm:p-6">
      <button onClick={dismiss} aria-label="Dismiss" className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 z-10"><X className="h-5 w-5" /></button>
      <div className="flex items-end gap-2 mb-4">
        <div className="shrink-0 -mb-2"><MrGuyMascot px={3} mood="idle" /></div>
        <div className="bg-blue-500/10 border border-white/5 rounded-3xl rounded-bl-md px-4 py-3 relative max-w-md">
          <p className="text-white font-bold text-base">Welcome to the $100K Challenge!</p>
          <p className="text-gray-300 text-sm mt-0.5">You get <b className="text-white">$100,000 in fake money</b> to invest in real stocks at real prices. It’s all practice — a risk-free way to learn how investing actually works.</p>
          <div className="absolute -left-1.5 bottom-3 w-3 h-3 bg-blue-500/10 rotate-45" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Point icon={<TrendingUp className="h-5 w-5 text-blue-400" />} title="Real prices" desc="Live market data" />
        <Point icon={<ShieldCheck className="h-5 w-5 text-green-400" />} title="Zero risk" desc="Nothing real at stake" />
        <Point icon={<Trophy className="h-5 w-5 text-yellow-400" />} title="Beat the market" desc="Top the S&P 500" />
      </div>
      <button onClick={dismiss} className="w-full mt-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl py-3 transition-colors">Let’s go</button>
    </div>
  )
}
