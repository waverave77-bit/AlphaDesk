'use client'
import { useState, useMemo } from 'react'
import { Search, BookOpen, TrendingUp, BarChart2, Shield, Lightbulb } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { TERMS, CATEGORIES, type Category } from '@/lib/glossary-terms'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Basics: <BookOpen className="h-3.5 w-3.5" />,
  Charts: <BarChart2 className="h-3.5 w-3.5" />,
  'Company Health': <TrendingUp className="h-3.5 w-3.5" />,
  Risk: <Shield className="h-3.5 w-3.5" />,
  Strategies: <Lightbulb className="h-3.5 w-3.5" />,
}

const CATEGORY_COLORS: Record<string, string> = {
  Basics: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Charts: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Company Health': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Risk: 'bg-red-500/10 text-red-400 border-red-500/20',
  Strategies: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}

export default function LearnPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return TERMS.filter((t) => {
      const matchesSearch = !search || t.term.toLowerCase().includes(search.toLowerCase()) || t.simple.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = activeCategory === 'All' || t.category === activeCategory
      return matchesSearch && matchesCategory
    }).sort((a, b) => a.term.localeCompare(b.term))
  }, [search, activeCategory])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-blue-600/15 border border-blue-600/20 flex items-center justify-center">
          <BookOpen className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Investing Dictionary</h1>
          <p className="text-base text-gray-400 mt-0.5">Every term explained in plain English</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
        <Input
          placeholder="Search any term..."
          className="pl-11 h-12 text-base bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              activeCategory === cat ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
            }`}
          >
            {cat !== 'All' && CATEGORY_ICONS[cat]}
            {cat}
          </button>
        ))}
      </div>

      <p className="text-base text-gray-500">{filtered.length} terms</p>

      {/* Terms list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-12">No terms found for &quot;{search}&quot;</p>
        )}
        {filtered.map((t) => (
          <Card
            key={t.term}
            className="cursor-pointer hover:bg-gray-800/40 transition-colors"
            onClick={() => setExpanded(expanded === t.term ? null : t.term)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <h3 className="text-base font-bold text-white">{t.term}</h3>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${CATEGORY_COLORS[t.category]}`}>
                      {CATEGORY_ICONS[t.category]}
                      {t.category}
                    </span>
                  </div>
                  <p className="text-base text-blue-300 font-medium">{t.simple}</p>
                  {expanded === t.term && (
                    <div className="mt-4 space-y-3 border-t border-gray-800 pt-4">
                      <p className="text-sm text-gray-300 leading-relaxed">{t.explanation}</p>
                      {t.example && (
                        <div className="bg-gray-900 rounded-lg px-4 py-3">
                          <span className="text-sm text-gray-500 font-medium">Example: </span>
                          <span className="text-sm text-gray-300">{t.example}</span>
                        </div>
                      )}
                      {t.tip && (
                        <div className="flex gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-4 py-3">
                          <Lightbulb className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-yellow-300">{t.tip}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-gray-500 text-sm mt-0.5">{expanded === t.term ? '▲' : '▼'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-gray-500 text-center mt-6 pb-4 px-4">
        Definitions and explanations are for educational purposes only. Not financial advice. Finance concepts can have nuances beyond what is shown here — always consult authoritative sources and qualified professionals for decisions.
      </p>
    </div>
  )
}
