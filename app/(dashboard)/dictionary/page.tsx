'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { TERMS, CATEGORIES, type Category } from '@/lib/glossary-terms'
import { Search, BookOpen, Sprout, LineChart, Building2, ShieldAlert, Target, Rocket, LayoutGrid, ChevronDown, SearchX, GraduationCap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const CAT_ICON: Record<string, LucideIcon> = {
  All: LayoutGrid,
  Basics: Sprout,
  Charts: LineChart,
  'Company Health': Building2,
  Risk: ShieldAlert,
  Strategies: Target,
  'Options & Bonds': Rocket,
}

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
        <div className="h-12 w-12 rounded-xl bg-blue-600/15 border border-blue-600/20 flex items-center justify-center shrink-0">
          <BookOpen className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Investing Dictionary</h1>
          <p className="text-base text-gray-400 mt-0.5">Every term explained in plain English.</p>
        </div>
        <Link href="/learn" className="ml-auto hidden sm:flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-blue-300 shrink-0">
          <GraduationCap className="h-4 w-4" /> Learn it instead
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
        <input
          placeholder="Search any term…"
          className="w-full pl-11 pr-4 h-12 text-base rounded-2xl bg-gray-900 border border-gray-800 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => {
          const Icon = CAT_ICON[cat] ?? LayoutGrid
          const active = activeCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                active ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat}
            </button>
          )
        })}
      </div>

      <p className="text-sm text-gray-500">{filtered.length} term{filtered.length === 1 ? '' : 's'}</p>

      {/* Terms */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <SearchX className="h-10 w-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No terms match “{search}”.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          {filtered.map((t) => {
            const open = expanded === t.term
            return (
              <button
                key={t.term}
                onClick={() => setExpanded(open ? null : t.term)}
                className={`text-left rounded-2xl border p-4 transition-all ${open ? 'bg-gray-900 border-blue-500/40' : 'bg-gray-900/60 border-gray-800 hover:border-gray-600'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-white">{t.term}</p>
                    <p className="text-sm text-blue-400 mt-0.5">{t.simple}</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
                {open && (
                  <div className="mt-3 space-y-3 border-t border-gray-800 pt-3">
                    <p className="text-sm text-gray-300 leading-relaxed">{t.explanation}</p>
                    {t.example && (
                      <div className="bg-gray-800/60 rounded-xl px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Example</p>
                        <p className="text-sm text-gray-300">{t.example}</p>
                      </div>
                    )}
                    {t.tip && <p className="text-sm text-yellow-300/80">Tip: {t.tip}</p>}
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
