'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { TERMS, CATEGORIES, type Category } from '@/lib/glossary-terms'
import { Search, BookOpen, Sprout, LineChart, Building2, ShieldAlert, Target, Rocket, LayoutGrid, ChevronDown, SearchX, GraduationCap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const CAT_ICON: Record<string, LucideIcon> = {
  All: LayoutGrid,
  Basics: Sprout,
  Charts: LineChart,
  'Company Health': Building2,
  Risk: ShieldAlert,
  Strategies: Target,
  'Options & Bonds': Rocket,
}

type Palette = { icon: string; simple: string; badge: string; tint: string; solid: string }
const CAT_COLOR: Record<string, Palette> = {
  All:              { icon: 'text-blue-600 dark:text-blue-400',    simple: 'text-blue-700 dark:text-blue-400',    badge: 'bg-blue-100 dark:bg-blue-500/15',    tint: 'bg-blue-50 dark:bg-blue-500/[0.06]',    solid: 'bg-blue-600' },
  Basics:           { icon: 'text-blue-600 dark:text-blue-400',    simple: 'text-blue-700 dark:text-blue-400',    badge: 'bg-blue-100 dark:bg-blue-500/15',    tint: 'bg-blue-50 dark:bg-blue-500/[0.06]',    solid: 'bg-blue-600' },
  Charts:           { icon: 'text-purple-600 dark:text-purple-400',  simple: 'text-purple-700 dark:text-purple-400',  badge: 'bg-purple-100 dark:bg-purple-500/15',  tint: 'bg-purple-50 dark:bg-purple-500/[0.06]',  solid: 'bg-purple-600' },
  'Company Health': { icon: 'text-emerald-600 dark:text-emerald-400', simple: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-100 dark:bg-emerald-500/15', tint: 'bg-emerald-50 dark:bg-emerald-500/[0.06]', solid: 'bg-emerald-600' },
  Risk:             { icon: 'text-red-600 dark:text-red-400',     simple: 'text-red-700 dark:text-red-400',     badge: 'bg-red-100 dark:bg-red-500/15',     tint: 'bg-red-50 dark:bg-red-500/[0.06]',     solid: 'bg-red-600' },
  Strategies:       { icon: 'text-amber-600 dark:text-amber-400',   simple: 'text-amber-700 dark:text-amber-400',   badge: 'bg-amber-100 dark:bg-amber-500/15',   tint: 'bg-amber-50 dark:bg-amber-500/[0.06]',   solid: 'bg-amber-600' },
  'Options & Bonds':{ icon: 'text-pink-600 dark:text-pink-400',    simple: 'text-pink-700 dark:text-pink-400',    badge: 'bg-pink-100 dark:bg-pink-500/15',    tint: 'bg-pink-50 dark:bg-pink-500/[0.06]',    solid: 'bg-pink-600' },
}
const pal = (c: string): Palette => CAT_COLOR[c] ?? CAT_COLOR.All

export default function DictionaryPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return TERMS.filter((t) => {
      const matchesSearch = !q || t.term.toLowerCase().includes(q) || t.simple.toLowerCase().includes(q)
      const matchesCategory = activeCategory === 'All' || t.category === activeCategory
      return matchesSearch && matchesCategory
    }).sort((a, b) => a.term.localeCompare(b.term))
  }, [search, activeCategory])

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-[#ffd23f] border-2 border-[#16130a] shadow-[3px_3px_0_#16130a] dark:shadow-none flex items-center justify-center shrink-0">
          <BookOpen className="h-7 w-7 text-[#16130a]" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display uppercase text-2xl sm:text-3xl text-[#16130a] dark:text-white leading-none tracking-tight">Investing Dictionary</h1>
          <p className="font-mono text-sm text-[#16130a]/60 dark:text-gray-400 mt-1.5">Every term explained in plain English.</p>
        </div>
        <Link href="/learn" className="ml-auto hidden sm:flex items-center gap-1.5 font-mono font-bold text-xs uppercase tracking-wide bg-[#ffd23f] text-[#16130a] border-2 border-[#16130a] shadow-[2px_2px_0_#16130a] dark:shadow-none rounded-full px-3.5 py-2 hover:-translate-y-0.5 transition-transform shrink-0">
          <GraduationCap className="h-4 w-4" /> Learn it instead
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#16130a]/40 dark:text-gray-500" />
        <input
          placeholder="Search any term…"
          className="w-full pl-12 pr-4 h-12 text-base rounded-2xl bg-[#fff] dark:bg-gray-900 border-2 border-[#16130a] dark:border-gray-700 shadow-[4px_4px_0_#16130a] dark:shadow-none text-[#16130a] dark:text-white placeholder:text-[#16130a]/40 dark:placeholder:text-gray-500 focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => {
          const Icon = CAT_ICON[cat] ?? LayoutGrid
          const active = activeCategory === cat
          const p = pal(cat)
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-mono font-bold border-2 transition-all',
                active
                  ? cn(p.solid, 'text-[#fff] border-[#16130a] shadow-[2px_2px_0_#16130a] dark:shadow-none')
                  : 'bg-[#fff] dark:bg-gray-800 border-[#16130a]/20 dark:border-gray-600 text-[#16130a]/60 dark:text-gray-400 hover:border-[#16130a] dark:hover:border-gray-400',
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', active ? 'text-[#fff]' : p.icon)} />
              {cat}
            </button>
          )
        })}
      </div>

      <p className="font-mono font-bold text-xs uppercase tracking-widest text-[#16130a]/50 dark:text-gray-500">{filtered.length} term{filtered.length === 1 ? '' : 's'}</p>

      {/* Terms */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-[#16130a]/20 dark:border-gray-700">
          <SearchX className="h-10 w-10 text-[#16130a]/20 dark:text-gray-700 mx-auto mb-3" />
          <p className="font-mono text-sm text-[#16130a]/50 dark:text-gray-500">No terms match &ldquo;{search}&rdquo;.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
          {filtered.map((t) => {
            const open = expanded === t.term
            const p = pal(t.category)
            const CatIcon = CAT_ICON[t.category] ?? LayoutGrid
            return (
              <button
                key={t.term}
                onClick={() => setExpanded(open ? null : t.term)}
                className={cn(
                  'text-left rounded-2xl border-2 border-[#16130a] dark:border-gray-700 p-4 transition-all',
                  open
                    ? cn(p.tint, 'shadow-[4px_4px_0_#16130a] dark:shadow-none')
                    : 'bg-[#fff] dark:bg-gray-900 shadow-[3px_3px_0_#16130a] dark:shadow-none hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#16130a]',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('h-9 w-9 rounded-xl border-2 border-[#16130a] dark:border-transparent flex items-center justify-center shrink-0', p.badge)}>
                    <CatIcon className={cn('h-4 w-4', p.icon)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display uppercase text-sm leading-tight text-[#16130a] dark:text-white tracking-tight">{t.term}</p>
                    <p className={cn('text-sm mt-1 leading-snug', p.simple)}>{t.simple}</p>
                  </div>
                  <ChevronDown className={cn('h-4 w-4 text-[#16130a]/40 dark:text-gray-500 shrink-0 transition-transform', open && 'rotate-180')} />
                </div>
                {open && (
                  <div className="mt-3 space-y-3 border-t-2 border-[#16130a]/15 dark:border-gray-700 pt-3">
                    <p className="text-sm text-[#16130a]/80 dark:text-gray-300 leading-relaxed">{t.explanation}</p>
                    {t.example && (
                      <div className="bg-[#fff8e1] dark:bg-gray-800/60 border-2 border-[#16130a]/10 dark:border-gray-700 rounded-xl px-3 py-2.5">
                        <p className="font-mono font-bold text-[10px] uppercase tracking-widest text-[#16130a]/40 dark:text-gray-500 mb-1">Example</p>
                        <p className="text-sm text-[#16130a]/80 dark:text-gray-300 leading-relaxed">{t.example}</p>
                      </div>
                    )}
                    {t.tip && (
                      <p className="text-sm text-amber-800 dark:text-yellow-300/80 leading-relaxed">
                        <span className="font-mono font-bold uppercase tracking-wide text-xs">Tip:</span> {t.tip}
                      </p>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
