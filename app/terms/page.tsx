import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using Mr. Guy Invests.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-xl font-bold tracking-tight">Mr. Guy Invests</span>
        </Link>
        <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
          Sign In
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-10">
        <div>
          <h1 className="text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-gray-400 text-sm">Last updated: May 25, 2026</p>
        </div>

        {/* Important notice banner */}
        <section className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5">
          <p className="text-yellow-300 font-semibold mb-2">Important Notice — Not Financial Advice</p>
          <p className="text-gray-300 text-sm leading-relaxed">
            Mr. Guy Invests provides AI-generated analysis for informational and educational purposes only.{' '}
            <strong>Nothing on this platform constitutes financial advice, investment advice, or a
            recommendation to buy, sell, or hold any security.</strong> Past performance does not guarantee
            future results. All investments involve risk, including the possible loss of principal.
            Always consult a qualified financial advisor before making any investment decision.
          </p>
        </section>

        {/* 1. Acceptance */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold mb-3 mt-8 text-white">1. Acceptance of Terms</h2>
          <p className="text-gray-300 leading-relaxed">
            By accessing or using Mr. Guy Invests (&ldquo;the Service&rdquo;), you agree to be bound by these
            Terms of Service (&ldquo;Terms&rdquo;) and our{' '}
            <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>.
            If you do not agree to these Terms, you must not use the Service. These Terms apply to all
            visitors, registered users, and anyone who accesses or uses the Service in any manner.
          </p>
          <p className="text-gray-300 leading-relaxed">
            We reserve the right to update these Terms at any time. We will notify you of material
            changes via email or an in-app notice. Continued use of the Service after changes take
            effect constitutes acceptance of the revised Terms.
          </p>
        </section>

        {/* 2. Eligibility */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold mb-3 mt-8 text-white">2. Eligibility</h2>
          <p className="text-gray-300 leading-relaxed">
            You must be at least <strong className="text-white">18 years of age</strong> to create an
            account or use the Service. By registering, you represent and warrant that you are 18 or
            older and have the legal capacity to enter into a binding agreement. If you are accessing the
            Service on behalf of an organization, you represent that you have authority to bind that
            organization to these Terms.
          </p>
          <p className="text-gray-300 leading-relaxed">
            We reserve the right to terminate or suspend accounts that do not meet eligibility
            requirements without notice.
          </p>
        </section>

        {/* 3. Service Description */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold mb-3 mt-8 text-white">3. Service Description</h2>
          <p className="text-gray-300 leading-relaxed">
            Mr. Guy Invests is a financial data and education platform that provides:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 leading-relaxed ml-2">
            <li>AI-generated stock analysis, market commentary, and financial Q&amp;A</li>
            <li>Portfolio and watchlist tracking tools</li>
            <li>Insider trade and institutional holding data sourced from public SEC filings</li>
            <li>Earnings calendars and market briefings</li>
            <li>Stock screeners, price alerts, and research tools</li>
            <li>Virtual (simulated) portfolio and trading features</li>
          </ul>
          <p className="text-gray-300 leading-relaxed">
            All content and tools are provided for <strong className="text-white">informational and
            educational purposes only</strong>. Mr. Guy Invests is not a registered investment adviser,
            broker-dealer, or financial planning firm.
          </p>
        </section>

        {/* 4. Not Financial Advice */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold mb-3 mt-8 text-white">4. Not Financial Advice</h2>
          <p className="text-gray-300 leading-relaxed">
            The content on Mr. Guy Invests — including AI-generated analysis, stock grades, market commentary,
            bull/bear arguments, earnings summaries, insider trade data, hedge fund tracking, and
            financial translations — does <strong className="text-white">not</strong> constitute:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 leading-relaxed ml-2">
            <li>Financial advice or investment advice of any kind</li>
            <li>A recommendation to buy, sell, or hold any security or financial instrument</li>
            <li>A solicitation or offer to buy or sell any investment product</li>
            <li>Legal, tax, or accounting advice</li>
          </ul>
          <p className="text-gray-300 leading-relaxed">
            Past performance data shown on this platform does not guarantee or predict future results.
            All investments involve risk, including the possible loss of principal. You are solely
            responsible for your own investment decisions. Mr. Guy Invests expressly disclaims any liability
            for financial losses arising from reliance on content provided through the Service.
          </p>
        </section>

        {/* 5. AI-Generated Content */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold mb-3 mt-8 text-white">5. AI-Generated Content Disclaimer</h2>

          {/* Prominent disclaimer box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
            <p className="text-blue-200 text-sm leading-relaxed">
              <strong>Disclaimer:</strong> Mr. Guy Invests provides AI-generated analysis for informational and
              educational purposes only. This is not financial advice. Past performance does not guarantee
              future results. Always consult a qualified financial advisor before making investment decisions.
            </p>
          </div>

          <p className="text-gray-300 leading-relaxed">
            Several features use artificial intelligence — including models provided by Anthropic (Claude),
            xAI (Grok), DeepSeek, and other AI providers — to generate content. AI-generated content:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 leading-relaxed ml-2">
            <li>May be inaccurate, incomplete, outdated, or inconsistent</li>
            <li>May reflect the biases or limitations of the underlying AI model</li>
            <li>Is not reviewed or verified by licensed financial professionals</li>
            <li>Should not be the sole basis for any financial decision</li>
          </ul>
          <p className="text-gray-300 leading-relaxed">
            We are not responsible for any decisions, losses, or outcomes resulting from reliance on
            AI-generated analysis, grades, commentary, or other AI-powered features.
          </p>
        </section>

        {/* 6. Data Accuracy */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold mb-3 mt-8 text-white">6. Data Accuracy</h2>
          <p className="text-gray-300 leading-relaxed">
            Financial data on Mr. Guy Invests is sourced from third-party market data providers, SEC EDGAR,
            and other public sources. We make no warranty that data is accurate, complete, up-to-date,
            or suitable for any purpose. Market data may be delayed. Always verify data independently
            before relying on it for any financial decision.
          </p>
        </section>

        {/* 7. Acceptable Use */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold mb-3 mt-8 text-white">7. Acceptable Use</h2>
          <p className="text-gray-300 leading-relaxed">
            You agree to use the Service only for lawful purposes and in accordance with these Terms.
            You must not:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 leading-relaxed ml-2">
            <li>Scrape, crawl, or systematically extract data from the Service without our prior
              written permission</li>
            <li>Use automated tools, bots, or scripts to access the Service beyond normal usage</li>
            <li>Attempt to manipulate, reverse-engineer, or circumvent usage limits, paywalls,
              or security measures</li>
            <li>Use the Service to engage in market manipulation, fraud, or any illegal activity</li>
            <li>Reproduce, redistribute, or commercially exploit content from the Service without
              prior written permission</li>
            <li>Share your account credentials or allow others to access your account</li>
            <li>Upload or transmit malware, viruses, or any malicious code</li>
            <li>Use the Service in any way that could damage, disable, or impair its operation</li>
          </ul>
          <p className="text-gray-300 leading-relaxed">
            We reserve the right to terminate accounts that violate these provisions, with or without
            prior notice.
          </p>
        </section>

        {/* 8. Subscriptions and Billing */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold mb-3 mt-8 text-white">8. Pro Subscription — Billing and Cancellation</h2>
          <p className="text-gray-300 leading-relaxed">
            Mr. Guy Invests offers a free tier and an optional paid Pro subscription. The following terms
            apply to Pro subscribers:
          </p>
          <div className="space-y-3 text-gray-300 leading-relaxed">
            <p>
              <strong className="text-white">Billing:</strong> Pro subscriptions are billed on a
              recurring monthly basis through Stripe. By subscribing, you authorize us to charge your
              payment method automatically on each renewal date until you cancel.
            </p>
            <p>
              <strong className="text-white">Cancellation:</strong> You may cancel your subscription
              at any time through the &ldquo;Manage Subscription&rdquo; option in your account Settings.
              Upon cancellation, you retain access to Pro features until the end of your current billing
              period. No prorated refunds are issued for unused time within a billing period.
            </p>
            <p>
              <strong className="text-white">Refund policy:</strong> We offer refunds within 7 days of
              your initial subscription purchase if you are unsatisfied with the Service. After 7 days,
              no refunds will be issued. Refund requests must be submitted to{' '}
              <a href="mailto:support@alphadesk.app" className="text-blue-400 hover:underline">
                support@alphadesk.app
              </a>{' '}
              within the 7-day window.
            </p>
            <p>
              <strong className="text-white">Price changes:</strong> We reserve the right to change
              subscription pricing with at least 30 days&apos; notice provided to active subscribers
              via email. Continued use of the Service after a price change takes effect constitutes
              acceptance of the new pricing.
            </p>
            <p>
              <strong className="text-white">Failed payments:</strong> If a payment fails, we may
              suspend or downgrade your account to the free tier until payment is resolved.
            </p>
          </div>
        </section>

        {/* 9. Simulated Features */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold mb-3 mt-8 text-white">9. Simulated / Virtual Trading Features</h2>
          <p className="text-gray-300 leading-relaxed">
            Virtual portfolio and simulated trading features use fictional capital only. No real money
            is involved, wagered, or at risk. Simulated trading results are not representative of actual
            market conditions and do not predict real investment performance. These features are provided
            solely for educational and entertainment purposes.
          </p>
        </section>

        {/* 10. User Accounts */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold mb-3 mt-8 text-white">10. User Accounts</h2>
          <p className="text-gray-300 leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials and for
            all activity that occurs under your account. You must notify us immediately of any unauthorized
            access or security breach. We reserve the right to suspend or terminate accounts at our
            discretion if we determine they are being used in violation of these Terms or in a way that
            could harm the Service or other users.
          </p>
        </section>

        {/* 11. Intellectual Property */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold mb-3 mt-8 text-white">11. Intellectual Property</h2>
          <p className="text-gray-300 leading-relaxed">
            The Mr. Guy Invests name, logo, branding, and all original platform content are owned by Mr. Guy Invests
            and are protected by applicable intellectual property laws. Financial data displayed on the
            platform belongs to its respective data providers. You may not reproduce, redistribute,
            sublicense, or commercially exploit any content from the Service without our prior written
            permission.
          </p>
        </section>

        {/* 12. Limitation of Liability */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold mb-3 mt-8 text-white">12. Limitation of Liability</h2>
          <p className="text-gray-300 leading-relaxed">
            To the maximum extent permitted by applicable law, Mr. Guy Invests and its operators, directors,
            employees, and agents shall not be liable for any direct, indirect, incidental, special,
            consequential, or punitive damages arising from or related to your use of the Service.
            This includes, without limitation, financial losses resulting from investment decisions made
            based on content from this platform, loss of data, loss of profits, or service interruptions.
          </p>
          <p className="text-gray-300 leading-relaxed">
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties
            of any kind, express or implied, including but not limited to warranties of merchantability,
            fitness for a particular purpose, or non-infringement. We do not warrant that the Service
            will be uninterrupted, error-free, or free of viruses or other harmful components.
          </p>
          <p className="text-gray-300 leading-relaxed">
            In jurisdictions that do not allow the exclusion of certain warranties or limitation of
            liability, our liability is limited to the fullest extent permitted by law. In no event shall
            our total liability to you exceed the amount you paid us in the 12 months preceding the claim.
          </p>
        </section>

        {/* 13. Indemnification */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold mb-3 mt-8 text-white">13. Indemnification</h2>
          <p className="text-gray-300 leading-relaxed">
            You agree to indemnify and hold harmless Mr. Guy Invests and its operators from any claims,
            damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising
            from your use of the Service, your violation of these Terms, or your violation of any rights
            of a third party.
          </p>
        </section>

        {/* 14. Governing Law */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold mb-3 mt-8 text-white">14. Governing Law and Disputes</h2>
          <p className="text-gray-300 leading-relaxed">
            These Terms are governed by the laws of the State of California, United States, without
            regard to its conflict-of-law provisions. Any disputes arising from these Terms or your use
            of the Service shall be resolved in the state or federal courts located in California, and
            you consent to the personal jurisdiction of such courts. If any provision of these Terms is
            found to be unenforceable, the remaining provisions will remain in full force and effect.
          </p>
        </section>

        {/* 15. Changes to Terms */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold mb-3 mt-8 text-white">15. Changes to These Terms</h2>
          <p className="text-gray-300 leading-relaxed">
            We reserve the right to modify these Terms at any time. When we make material changes, we
            will provide at least <strong className="text-white">30 days&apos;</strong> notice by
            posting the updated Terms on this page and sending an email notification to all registered
            users. The &ldquo;Last updated&rdquo; date at the top of this page reflects when the most
            recent changes took effect. Continued use of the Service after the effective date
            constitutes your acceptance of the revised Terms.
          </p>
        </section>

        {/* 16. Contact */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold mb-3 mt-8 text-white">16. Contact Us</h2>
          <p className="text-gray-300 leading-relaxed">
            For questions about these Terms, subscription issues, or refund requests, contact us at:{' '}
            <a href="mailto:support@alphadesk.app" className="text-blue-400 hover:underline">
              support@alphadesk.app
            </a>
          </p>
        </section>
      </main>

      <footer className="border-t border-gray-800 px-6 py-8 mt-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
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
