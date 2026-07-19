import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { GUIDES } from '@/lib/guides'
import { TERMS, termToSlug } from '@/lib/glossary-terms'
import { ArrowLeft, ChevronRight, BookOpen } from 'lucide-react'
import MrGuyLogoSvg from '@/components/MrGuyLogoSvg'

export async function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const guide = GUIDES.find((g) => g.slug === params.slug)
  if (!guide) return { title: 'Guide Not Found' }

  return {
    title: guide.metaTitle,
    description: guide.description,
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: 'article',
      publishedTime: guide.date,
    },
    alternates: {
      canonical: `/guides/${guide.slug}`,
    },
  }
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const guide = GUIDES.find((g) => g.slug === params.slug)
  if (!guide) notFound()

  const related = guide.relatedTerms
    .map((name) => TERMS.find((t) => t.term === name))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))

  // Relevance-ranked internal links: same-category guides first (newest first),
  // then fill from the rest by recency. A plain slice(0,3) meant every guide
  // linked the SAME first three array entries — early guides hoarded all the
  // internal links while newer daily guides got none pointing at them.
  const others = GUIDES.filter((g) => g.slug !== guide.slug)
  const byDate = (a: (typeof GUIDES)[number], b: (typeof GUIDES)[number]) => b.date.localeCompare(a.date)
  const otherGuides = [
    ...others.filter((g) => g.category === guide.category).sort(byDate),
    ...others.filter((g) => g.category !== guide.category).sort(byDate),
  ].slice(0, 3)
  const base = 'https://www.mrguyinvests.com'

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
        <Link href="/guides" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Money Guides
        </Link>
      </div>

      <main className="px-6 pt-8 pb-24 max-w-4xl mx-auto">

        {/* Category + date */}
        <div className="flex items-center gap-3 mb-6">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">
            <BookOpen className="h-3.5 w-3.5" />
            {guide.category}
          </span>
          <span className="text-xs text-gray-600">{guide.date}</span>
        </div>

        {/* Title + intro */}
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5">{guide.title}</h1>
        <div className="bg-blue-600/10 border border-blue-600/20 rounded-2xl px-6 py-5 mb-10">
          <p className="text-lg text-blue-200 font-medium leading-relaxed">{guide.intro}</p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {guide.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-2xl font-bold mb-4">{s.heading}</h2>
              {s.body.split('\n\n').map((p, i) => (
                <p key={i} className="text-gray-300 leading-relaxed mb-4 whitespace-pre-line">{p}</p>
              ))}
            </section>
          ))}
        </div>

        {/* FAQ */}
        {guide.faq && guide.faq.length > 0 && (
          <div className="mt-14">
            <h2 className="text-2xl font-bold mb-6">Quick answers</h2>
            <div className="space-y-4">
              {guide.faq.map((f) => (
                <div key={f.q} className="bg-gray-900 border border-gray-800 rounded-2xl px-6 py-5">
                  <p className="font-semibold text-white mb-2">{f.q}</p>
                  <p className="text-gray-400 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related glossary terms — internal link graph into the dictionary */}
        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-bold mb-5">Terms used in this guide</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {related.map((t) => (
                <Link
                  key={t.term}
                  href={`/glossary/${termToSlug(t.term)}`}
                  className="group bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl px-6 py-5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold group-hover:text-blue-400 transition-colors">{t.term}</p>
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1.5">{t.simple}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* More guides */}
        {otherGuides.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-bold mb-5">Keep reading</h2>
            <div className="space-y-3">
              {otherGuides.map((g) => (
                <Link key={g.slug} href={`/guides/${g.slug}`} className="group flex items-center justify-between bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl px-6 py-4 transition-colors">
                  <span className="font-medium group-hover:text-blue-400 transition-colors">{g.title}</span>
                  <ChevronRight className="h-4 w-4 text-gray-600 shrink-0" />
                </Link>
              ))}
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

        <p className="text-xs text-gray-600 mt-10 text-center">
          For informational and educational purposes only. Not financial or tax advice. Always consult a qualified professional.
        </p>
      </main>

      {/* Structured data: Article + FAQ + Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: guide.title,
              description: guide.description,
              datePublished: guide.date,
              author: { '@type': 'Organization', name: 'Mr. Guy Invests', url: base },
              publisher: { '@type': 'Organization', name: 'Mr. Guy Invests', url: base },
              mainEntityOfPage: `${base}/guides/${guide.slug}`,
            },
            ...(guide.faq && guide.faq.length > 0
              ? [{
                  '@context': 'https://schema.org',
                  '@type': 'FAQPage',
                  mainEntity: guide.faq.map((f) => ({
                    '@type': 'Question',
                    name: f.q,
                    acceptedAnswer: { '@type': 'Answer', text: f.a },
                  })),
                }]
              : []),
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: base },
                { '@type': 'ListItem', position: 2, name: 'Money Guides', item: `${base}/guides` },
                { '@type': 'ListItem', position: 3, name: guide.title, item: `${base}/guides/${guide.slug}` },
              ],
            },
          ]),
        }}
      />
    </div>
  )
}
