import Link from 'next/link'
import type { Metadata } from 'next'
import { GUIDES } from '@/lib/guides'
import { ChevronRight, BookOpen } from 'lucide-react'
import MrGuyLogoSvg from '@/components/MrGuyLogoSvg'

export const metadata: Metadata = {
  title: 'Money Guides — Real Answers for First-Time Investors',
  description:
    'Plain-English guides to the money questions school never answered: investing as a teen, first paychecks, credit, scholarships, and more.',
  alternates: { canonical: '/guides' },
}

export default function GuidesIndexPage() {
  const guides = [...GUIDES].sort((a, b) => b.date.localeCompare(a.date))

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

      <main className="px-6 pt-12 pb-24 max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">Money Guides</h1>
        <p className="text-lg text-gray-400 mb-12 max-w-2xl">
          Real answers to the money questions school never covered — written in plain English, no jargon, no course to buy at the end.
        </p>

        <div className="space-y-5">
          {guides.map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="group block bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl px-7 py-6 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">
                  <BookOpen className="h-3 w-3" />
                  {g.category}
                </span>
                <span className="text-xs text-gray-600">{g.date}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold group-hover:text-blue-400 transition-colors">{g.title}</h2>
                <ChevronRight className="h-5 w-5 text-gray-600 shrink-0" />
              </div>
              <p className="text-gray-400 mt-2 leading-relaxed">{g.description}</p>
            </Link>
          ))}
        </div>

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
    </div>
  )
}
