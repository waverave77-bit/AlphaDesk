import Link from 'next/link'
import type { Metadata } from 'next'
import { TERMS, CATEGORIES, termToSlug, type Category } from '@/lib/glossary-terms'
import { BookOpen, TrendingUp, BarChart2, Shield, Lightbulb, ChevronRight, Search } from 'lucide-react'
import MrGuyLogoSvg from '@/components/MrGuyLogoSvg'

export const metadata: Metadata = {
  title: 'Investing Dictionary — Stock Market Terms Explained Simply',
  description: `Learn ${TERMS.length} investing and stock market terms in plain English. From stocks and ETFs to P/E ratios and technical analysis, everything explained simply for beginners.`,
  keywords: ['investing dictionary', 'stock market terms', 'finance glossary', 'investing for beginners', 'stock market glossary', 'financial terms explained'],
  openGraph: {
    title: 'Investing Dictionary, Every Term Explained Simply',
    description: 'The beginner-friendly finance glossary. All plain English, no confusion.',
  },
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Basics:            <BookOpen className="h-4 w-4" />,
  Charts:            <BarChart2 className="h-4 w-4" />,
  'Company Health':  <TrendingUp className="h-4 w-4" />,
  Risk:              <Shield className="h-4 w-4" />,
  Strategies:        <Lightbulb className="h-4 w-4" />,
  'Options & Bonds': <ChevronRight className="h-4 w-4" />,
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Basics:            { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20' },
  Charts:            { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20' },
  'Company Health':  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  Risk:              { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20' },
  Strategies:        { bg: 'bg-yellow-500/10',  text: 'text-yellow-400',  border: 'border-yellow-500/20' },
  'Options & Bonds': { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/20' },
}

export default function GlossaryPage() {
  const categories = CATEGORIES.filter((c): c is Category => c !== 'All')

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto border-b-[3px] border-[#16130a]">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="bg-white border-2 border-[#16130a] p-1 shadow-[3px_3px_0_#16130a] flex"><MrGuyLogoSvg px={2} /></span>
          <span className="font-display text-lg uppercase tracking-tight">Mr. Guy Invests</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="font-mono font-bold text-sm uppercase hover:opacity-70 px-2 py-2">
            Sign in
          </Link>
          <Link href="/register" className="font-mono font-bold text-sm uppercase bg-[#2563eb] text-[#fff] border-2 border-[#16130a] shadow-[3px_3px_0_#16130a] px-4 py-2 hover:-translate-y-0.5 transition-transform">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-16 pb-12 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-6">
          <BookOpen className="h-3.5 w-3.5" />
          {TERMS.length} terms, all plain English
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
          Investing Dictionary
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          Every stock market term explained in plain English. No finance degree required.
        </p>
      </section>

      {/* Quick search CTA */}
      <div className="px-6 pb-12 max-w-2xl mx-auto">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl px-5 py-4 transition-colors group"
        >
          <Search className="h-5 w-5 text-gray-500" />
          <span className="text-gray-500 flex-1">Search all {TERMS.length} terms inside the app...</span>
          <span className="text-xs text-blue-400 font-medium group-hover:text-blue-300 transition-colors">Sign in →</span>
        </Link>
      </div>

      {/* Terms by category */}
      <main className="px-6 pb-24 max-w-6xl mx-auto space-y-16">
        {categories.map((cat) => {
          const catTerms = TERMS.filter(t => t.category === cat).sort((a, b) => a.term.localeCompare(b.term))
          const colors = CATEGORY_COLORS[cat]
          return (
            <section key={cat}>
              {/* Category header */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border mb-6 ${colors.bg} ${colors.text} ${colors.border}`}>
                {CATEGORY_ICONS[cat]}
                <span className="font-semibold text-sm">{cat}</span>
                <span className="text-xs opacity-60">({catTerms.length})</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {catTerms.map((term) => (
                  <Link
                    key={term.term}
                    href={`/glossary/${termToSlug(term.term)}`}
                    className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-5 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-white text-base mb-1">{term.term}</p>
                        <p className="text-sm text-gray-400 leading-snug">{term.simple}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-700 group-hover:text-gray-400 shrink-0 mt-0.5 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </main>

      {/* CTA */}
      <section className="px-6 pb-24 max-w-2xl mx-auto text-center">
        <div className="bg-blue-600/10 border border-blue-600/20 rounded-2xl p-10">
          <h2 className="text-2xl font-bold mb-3">Put Your Knowledge to Work</h2>
          <p className="text-gray-400 mb-6">Track your stocks, follow hedge funds, and get AI analysis, all in plain English.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors">
            Create Free Account <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <MrGuyLogoSvg px={2} />
            <span className="font-mono font-bold text-sm uppercase">Mr. Guy Invests</span>
          </Link>
          <p className="text-xs text-gray-600">For informational purposes only. Not financial advice.</p>
        </div>
      </footer>

    </div>
  )
}
