import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { TERMS, termToSlug, type Category } from '@/lib/glossary-terms'
import { BookOpen, Lightbulb, TrendingUp, BarChart2, Shield, ChevronRight, ArrowLeft } from 'lucide-react'
import MrGuyLogoSvg from '@/components/MrGuyLogoSvg'

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  Basics:            <BookOpen className="h-3.5 w-3.5" />,
  Charts:            <BarChart2 className="h-3.5 w-3.5" />,
  'Company Health':  <TrendingUp className="h-3.5 w-3.5" />,
  Risk:              <Shield className="h-3.5 w-3.5" />,
  Strategies:        <Lightbulb className="h-3.5 w-3.5" />,
  'Options & Bonds': <ChevronRight className="h-3.5 w-3.5" />,
}

const CATEGORY_COLORS: Record<Category, string> = {
  Basics:            'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Charts:            'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Company Health':  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Risk:              'bg-red-500/10 text-red-400 border-red-500/20',
  Strategies:        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Options & Bonds': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

export async function generateStaticParams() {
  return TERMS.map((t) => ({ term: termToSlug(t.term) }))
}

export async function generateMetadata({ params }: { params: { term: string } }): Promise<Metadata> {
  const term = TERMS.find((t) => termToSlug(t.term) === params.term)
  if (!term) return { title: 'Term Not Found' }

  const desc = `${term.simple}. ${term.explanation.slice(0, 140)}${term.explanation.length > 140 ? '...' : ''}`

  return {
    title: `What is ${term.term}? Definition & Meaning`,
    description: desc,
    keywords: [
      term.term,
      `what is ${term.term}`,
      `${term.term} definition`,
      `${term.term} meaning`,
      'investing',
      'stock market',
      term.category,
      'finance for beginners',
    ],
    openGraph: {
      title: `What is ${term.term}? — Investing Dictionary`,
      description: term.simple,
      type: 'article',
    },
    alternates: {
      canonical: `/glossary/${termToSlug(term.term)}`,
    },
  }
}

export default function GlossaryTermPage({ params }: { params: { term: string } }) {
  const term = TERMS.find((t) => termToSlug(t.term) === params.term)
  if (!term) notFound()

  // Deterministic related terms: a STABLE internal link graph helps Google crawl
  // and index these pages. (Math.random() reshuffled links on every render, so
  // Google never saw a consistent set of links to follow.) Rotate the start point
  // by a hash of the slug so each term still surfaces a different-but-fixed set.
  const pool = TERMS
    .filter((t) => t.category === term.category && t.term !== term.term)
    .sort((a, b) => a.term.localeCompare(b.term))
  const seed = [...termToSlug(term.term)].reduce((s, c) => s + c.charCodeAt(0), 0)
  const related =
    pool.length <= 4 ? pool : [0, 1, 2, 3].map((i) => pool[(seed + i) % pool.length])

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto border-b-[3px] border-[#16130a]">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="bg-white border-2 border-[#16130a] p-1 shadow-[3px_3px_0_#16130a] flex"><MrGuyLogoSvg px={2} /></span>
          <span className="font-display text-lg uppercase tracking-tight">Mr. Guy Invests</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="font-mono font-bold text-sm uppercase hover:opacity-70 px-2 py-2 hidden sm:block">
            Sign in
          </Link>
          <Link href="/register" className="font-mono font-bold text-sm uppercase bg-[#2563eb] text-[#fff] border-2 border-[#16130a] shadow-[3px_3px_0_#16130a] px-4 py-2 hover:-translate-y-0.5 transition-transform">
            Get started
          </Link>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="px-6 pt-5 max-w-4xl mx-auto">
        <Link href="/glossary" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Investing Dictionary
        </Link>
      </div>

      {/* Main */}
      <main className="px-6 pt-8 pb-24 max-w-4xl mx-auto">

        {/* Category badge */}
        <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border mb-6 ${CATEGORY_COLORS[term.category]}`}>
          {CATEGORY_ICONS[term.category]}
          {term.category}
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5">
          What is {term.term}?
        </h1>

        {/* Simple definition, the "answer" Google wants to see near top */}
        <div className="bg-blue-600/10 border border-blue-600/20 rounded-2xl px-6 py-5 mb-8">
          <p className="text-xl text-blue-200 font-medium leading-relaxed">{term.simple}</p>
        </div>

        {/* Full explanation */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7 mb-5">
          <h2 className="text-lg font-bold text-white mb-4">Full Explanation</h2>
          <p className="text-gray-300 leading-relaxed text-base">{term.explanation}</p>
        </div>

        {/* Example */}
        {term.example && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7 mb-5">
            <h2 className="text-lg font-bold text-white mb-4">Real-World Example</h2>
            <p className="text-gray-300 leading-relaxed">{term.example}</p>
          </div>
        )}

        {/* Extended sections (term-specific deep content) */}
        {term.sections && term.sections.length > 0 && (
          <div className="space-y-5 mb-5">
            {term.sections.map((s) => (
              <div key={s.heading} className="bg-gray-900 border border-gray-800 rounded-2xl p-7">
                <h2 className="text-lg font-bold text-white mb-4">{s.heading}</h2>
                <p className="text-gray-300 leading-relaxed text-base">{s.body}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tip */}
        {term.tip && (
          <div className="flex gap-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-7 mb-10">
            <Lightbulb className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-yellow-300 mb-1">Pro Tip</p>
              <p className="text-yellow-800 dark:text-yellow-200/80 leading-relaxed text-sm">{term.tip}</p>
            </div>
          </div>
        )}

        {/* Schema markup for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              term.sections && term.sections.length > 0
                ? {
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    mainEntity: term.sections.map((s) => ({
                      '@type': 'Question',
                      name: s.heading,
                      acceptedAnswer: { '@type': 'Answer', text: s.body },
                    })),
                  }
                : {
                    '@context': 'https://schema.org',
                    '@type': 'DefinedTerm',
                    name: term.term,
                    description: term.simple,
                    inDefinedTermSet: {
                      '@type': 'DefinedTermSet',
                      name: 'Mr. Guy Invests Investing Dictionary',
                      url: 'https://www.mrguyinvests.com/glossary',
                    },
                  }
            ),
          }}
        />

        {/* Breadcrumb structured data (Home › Investing Dictionary › term) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mrguyinvests.com' },
                { '@type': 'ListItem', position: 2, name: 'Investing Dictionary', item: 'https://www.mrguyinvests.com/glossary' },
                { '@type': 'ListItem', position: 3, name: `What is ${term.term}?`, item: `https://www.mrguyinvests.com/glossary/${termToSlug(term.term)}` },
              ],
            }),
          }}
        />

        {/* Related terms */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-5">Related {term.category} Terms</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {related.map((r) => (
                <Link
                  key={r.term}
                  href={`/glossary/${termToSlug(r.term)}`}
                  className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-5 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-white mb-1">{r.term}</p>
                      <p className="text-sm text-gray-400 leading-snug">{r.simple}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-700 group-hover:text-gray-400 shrink-0 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href="/glossary" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                View all {term.category} terms →
              </Link>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-blue-600/10 border border-blue-600/20 rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold mb-3">Learn Investing Like a Game</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Bite-sized lessons, a $100K practice portfolio, and Mr. Guy to explain anything in plain English.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors"
          >
            Create Free Account <ChevronRight className="h-5 w-5" />
          </Link>
          <p className="text-xs text-gray-600 mt-3">Free forever. No credit card needed.</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <MrGuyLogoSvg px={2} />
            <span className="font-mono font-bold text-sm uppercase">Mr. Guy Invests</span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <Link href="/glossary" className="hover:text-gray-400 transition-colors">Dictionary</Link>
            <Link href="/" className="hover:text-gray-400 transition-colors">Home</Link>
          </div>
          <p className="text-xs text-gray-600">For informational purposes only. Not financial advice.</p>
        </div>
      </footer>

    </div>
  )
}
