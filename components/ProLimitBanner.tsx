'use client'
import Link from 'next/link'
import { Zap } from 'lucide-react'

interface Props {
  feature?: string // e.g. 'chat', 'bull-vs-bear' — used to pick the message
  isDark?: boolean
}

const MESSAGES: Record<string, { title: string; sub: string }> = {
  'chat':          { title: "Mr. Guy's done talking for today 😅", sub: "You've used your 3 free chats. Come back tomorrow or go Pro for unlimited." },
  'bull-vs-bear':  { title: "Mr. Guy needs a breather 🥊",         sub: "You've hit your daily limit on Bull vs Bear. Upgrade for unlimited fights." },
  'report-card':   { title: "No more report cards today 📋",        sub: "You've used your 3 free stock analyses. Upgrade for unlimited." },
  'ai-analysis':   { title: "AI analysis limit hit 🤖",             sub: "You've used your 2 free AI analyses today. Upgrade for unlimited." },
  'spike-summary': { title: "No more spike summaries today 📈",     sub: "You've used your 5 free summaries. Upgrade for unlimited." },
  'hot-take':      { title: "Mr. Guy's out of hot takes today 🌶️",  sub: "You've used your 5 free hot takes. Upgrade for unlimited." },
  'reality-check': { title: "Reality check limit reached 🔍",       sub: "You've used your 5 free reality checks. Upgrade for unlimited." },
  'am-i-dumb':     { title: "Mr. Guy won't answer that today 🤔",   sub: "You've used your 5 free questions. Upgrade for unlimited." },
  'bs-checker':    { title: "BS detector offline for today 🚨",     sub: "You've used your 5 free checks. Upgrade for unlimited." },
  'translator':    { title: "Translation limit reached 📖",          sub: "You've hit your daily limit. Upgrade for unlimited translations." },
  'research':      { title: "5 free stock lookups used today 📊",    sub: "You've used your 5 free research pages for today. Come back tomorrow or go Pro for unlimited." },
}

const DEFAULT = { title: "Daily limit reached 😅", sub: "You've used all your free AI requests for today. Upgrade to Pro for unlimited access." }

export default function ProLimitBanner({ feature, isDark = true }: Props) {
  const msg = (feature && MESSAGES[feature]) || DEFAULT

  return (
    <div className={`rounded-xl border p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
      isDark
        ? 'bg-yellow-500/5 border-yellow-500/20'
        : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div>
        <p className={`font-semibold text-sm mb-0.5 ${isDark ? 'text-yellow-300' : 'text-yellow-800'}`}>
          {msg.title}
        </p>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-yellow-700'}`}>
          {msg.sub}
        </p>
      </div>
      <Link
        href="/upgrade"
        className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-gray-950 text-sm font-bold transition-colors whitespace-nowrap"
      >
        <Zap className="h-3.5 w-3.5" />
        Upgrade to Pro
      </Link>
    </div>
  )
}
