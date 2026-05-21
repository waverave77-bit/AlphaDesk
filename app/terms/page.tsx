import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service — Mr. Guy Invests',
  description: 'Terms and conditions for using Mr. Guy Invests.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold">Mr. Guy Invests</span>
        </Link>
        <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
          Sign In
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div>
          <h1 className="text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-gray-400 text-sm">Last updated: May 2025</p>
        </div>

        <section className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5">
          <p className="text-yellow-300 font-semibold mb-2">Important Notice</p>
          <p className="text-gray-300 text-sm leading-relaxed">
            Mr. Guy Invests is an educational and informational platform only.{' '}
            <strong>Nothing on this site constitutes financial advice, investment advice, or a
            recommendation to buy, sell, or hold any security.</strong> All data, AI-generated analysis,
            grades, translations, and commentary are for informational purposes only. You should always
            consult a qualified financial advisor before making any investment decision.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
          <p className="text-gray-400 leading-relaxed">
            By accessing or using Mr. Guy Invests (&ldquo;the Service&rdquo;), you agree to be bound by these
            Terms of Service. If you do not agree, do not use the Service. These terms apply to all visitors,
            registered users, and anyone who accesses the Service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">2. Eligibility</h2>
          <p className="text-gray-400 leading-relaxed">
            You must be at least 13 years old to use this Service. By using the Service, you represent that
            you are at least 13 years of age. Users under 18 must have parental or legal guardian permission.
            We reserve the right to terminate accounts of users who do not meet these requirements.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">3. Not Financial Advice</h2>
          <p className="text-gray-400 leading-relaxed">
            The content on Mr. Guy Invests — including but not limited to AI-generated stock grades, market
            commentary, portfolio analysis, bull/bear arguments, earnings summaries, macro data, insider
            trade data, and financial translations — is provided <strong className="text-gray-300">for
            informational and educational purposes only</strong>.
          </p>
          <p className="text-gray-400 leading-relaxed">
            This content does not constitute:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-400 leading-relaxed ml-2">
            <li>Financial advice or investment advice</li>
            <li>A recommendation to buy, sell, or hold any security</li>
            <li>A solicitation or offer to buy or sell any investment product</li>
            <li>Legal, tax, or accounting advice</li>
          </ul>
          <p className="text-gray-400 leading-relaxed">
            Past performance data shown on this site does not guarantee or predict future results.
            All investments involve risk, including the possible loss of principal.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">4. Data Accuracy</h2>
          <p className="text-gray-400 leading-relaxed">
            Financial data displayed on this site is sourced from third-party market data providers,
            SEC EDGAR, and other public sources. We make no warranty that data is accurate, complete,
            up-to-date, or suitable for any particular purpose. Market data may be delayed. AI-generated
            analysis may contain errors or omissions. Always verify data independently before relying on it.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">5. AI-Generated Content</h2>
          <p className="text-gray-400 leading-relaxed">
            Several features on this site use artificial intelligence (Anthropic Claude) to generate content.
            AI-generated content may be inaccurate, incomplete, or outdated. It is provided for entertainment
            and educational purposes only. We are not responsible for any decisions made based on AI-generated
            analysis, grades, translations, or commentary.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">6. Simulated Features</h2>
          <p className="text-gray-400 leading-relaxed">
            The &ldquo;$100K Challenge&rdquo; and virtual trading features use simulated money only. No real
            funds are involved. Simulated trading results do not reflect or predict real-world investment
            performance. These features are provided for educational and entertainment purposes only.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">7. Limitation of Liability</h2>
          <p className="text-gray-400 leading-relaxed">
            To the maximum extent permitted by applicable law, Mr. Guy Invests and its operators shall not be
            liable for any direct, indirect, incidental, special, or consequential damages arising from your
            use of the Service, including but not limited to financial losses resulting from investment
            decisions made based on content from this site.
          </p>
          <p className="text-gray-400 leading-relaxed">
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties
            of any kind, express or implied.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">8. User Accounts</h2>
          <p className="text-gray-400 leading-relaxed">
            You are responsible for maintaining the security of your account credentials. You must not share
            your account with others. We reserve the right to suspend or terminate accounts that violate
            these terms or that are used for unauthorized purposes.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">9. Intellectual Property</h2>
          <p className="text-gray-400 leading-relaxed">
            The Mr. Guy Invests name, logo, and original content are owned by us. Financial data displayed on
            the site belongs to its respective data providers. You may not reproduce or redistribute content
            from this site without permission.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">10. Changes to Terms</h2>
          <p className="text-gray-400 leading-relaxed">
            We reserve the right to update these Terms at any time. Changes will be posted on this page
            with an updated date. Continued use of the Service after changes constitutes your acceptance
            of the revised Terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">11. Contact</h2>
          <p className="text-gray-400 leading-relaxed">
            For questions about these Terms, contact us at:{' '}
            <span className="text-blue-400">waverave77@gmail.com</span>
          </p>
        </section>
      </main>

      <footer className="border-t border-gray-800 px-6 py-8 mt-10">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
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
