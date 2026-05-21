import Link from 'next/link'
import { TrendingUp, Brain, Shield, Zap, BookOpen, Bell, Users, ChevronRight, Check } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold">Mr. Guy Invests</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link href="/register" className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-20 pb-24 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-6">
          <Zap className="h-3.5 w-3.5" />
          Built for young investors who want to understand their money
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
          Investing made{' '}
          <span className="text-blue-400">simple.</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          No jargon. No confusion. See what hedge funds and insiders are buying,
          get AI analysis in plain English, and actually understand your stocks.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2">
            Start for Free <ChevronRight className="h-5 w-5" />
          </Link>
          <Link href="/login" className="border border-gray-700 hover:border-gray-500 text-gray-300 px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors">
            Sign In
          </Link>
        </div>
        <p className="text-sm text-gray-600 mt-4">Free forever. No credit card needed.</p>
      </section>

      {/* Features */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Everything you need to invest smarter</h2>
        <p className="text-gray-400 text-center mb-12">All the tools that pros use, explained so anyone can understand.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: <Brain className="h-6 w-6 text-blue-400" />,
              title: 'AI Stock Tutor',
              desc: 'Ask anything about a stock. Get a straight answer in plain English, no finance degree needed.',
            },
            {
              icon: <Users className="h-6 w-6 text-emerald-400" />,
              title: 'Smart Money Tracker',
              desc: 'See what hedge funds and corporate insiders have recently reported buying and selling, sourced from public SEC filings.',
            },
            {
              icon: <Bell className="h-6 w-6 text-yellow-400" />,
              title: 'Daily Market Brief',
              desc: 'Wake up to a quick summary of what moved your stocks overnight. Takes 10 seconds to read.',
            },
            {
              icon: <Shield className="h-6 w-6 text-purple-400" />,
              title: 'Portfolio Tracker',
              desc: 'Add your stocks and see exactly how much you\'re up or down, updated in real time.',
            },
            {
              icon: <BookOpen className="h-6 w-6 text-pink-400" />,
              title: 'Investing Dictionary',
              desc: 'Every finance term explained simply. P/E ratio, short interest, market cap, all covered.',
            },
            {
              icon: <Zap className="h-6 w-6 text-orange-400" />,
              title: 'Smart Alerts',
              desc: 'Get notified when a stock hits your price target or when an insider makes a big move.',
            },
          ].map((f) => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-colors">
              <div className="mb-4">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">Simple pricing</h2>
        <p className="text-gray-400 text-center mb-12">Start free. Upgrade when you want more.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

          {/* Free */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Free</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-gray-500 mb-1">/month</span>
            </div>
            <p className="text-sm text-gray-600 mb-6">No credit card needed</p>
            <ul className="space-y-3 mb-8">
              {[
                'Stock research & live prices',
                'Earnings calendar & markets',
                'Watchlist & price alerts',
                'Finance dictionary',
                '3 Mr. Guy chats/day',
                '2 AI stock analyses/day',
                'Smart Money preview',
              ].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-400">
                  <Check className="h-4 w-4 text-gray-600 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="block w-full py-3 rounded-xl border border-gray-700 text-center text-sm font-semibold text-gray-400 hover:border-gray-500 hover:text-white transition-colors">
              Get Started Free
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-gray-900 border-2 border-blue-500 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute -top-px left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-b-lg tracking-wide">
              MOST POPULAR
            </div>
            <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2 mt-2">Pro</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-bold">$4.99</span>
              <span className="text-gray-400 mb-1">/month</span>
            </div>
            <p className="text-sm text-gray-500 mb-6">Cancel anytime</p>
            <ul className="space-y-3 mb-8">
              {[
                'Everything in Free',
                'Unlimited Mr. Guy chat',
                'Unlimited AI stock analysis',
                'Unlimited all AI tools',
                'Full Smart Money access',
                'Full Hedge Fund tracker',
              ].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                  <Check className="h-4 w-4 text-blue-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="block w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-center text-sm font-bold text-white transition-colors shadow-lg shadow-blue-600/20">
              Get Pro — $4.99/month
            </Link>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Ready to actually understand your investments?</h2>
        <p className="text-gray-400 mb-8">Join young investors who use data and AI to learn — not to gamble.</p>
        <Link href="/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors">
          Create Free Account <ChevronRight className="h-5 w-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center">
              <TrendingUp className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold">Mr. Guy Invests</span>
          </div>
          <p className="text-xs text-gray-600">For informational purposes only. Not financial advice.</p>
          <div className="flex gap-4 text-xs text-gray-600">
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
