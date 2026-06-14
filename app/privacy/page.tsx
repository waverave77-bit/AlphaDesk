import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — Mr. Guy Invests',
  description: 'How Mr. Guy Invests collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-xl font-bold tracking-tight text-white">Mr. Guy Invests</span>
        </Link>
        <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
          Sign In
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3 text-white">Privacy Policy</h1>
          <p className="text-gray-400 text-sm">Effective date: May 25, 2026</p>
        </div>

        {/* 1. Who We Are */}
        <section>
          <h2 className="text-xl font-bold text-white mb-3 mt-10">1. Who We Are</h2>
          <p className="text-gray-300 leading-relaxed">
            Mr. Guy Invests (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the financial
            data and education platform available at{' '}
            <span className="text-blue-400">mrguyinvests.com</span>. This Privacy Policy explains what
            personal information we collect when you use the Service, how we use it, who we share it
            with, and the rights you have over your data.
          </p>
          <p className="text-gray-300 leading-relaxed mt-3">
            For data privacy enquiries or to exercise your rights, contact the data controller at:{' '}
            <a href="mailto:support@mrguyinvests.com" className="text-blue-400 hover:underline">
              support@mrguyinvests.com
            </a>
          </p>
          <p className="text-gray-300 leading-relaxed mt-3">
            By using Mr. Guy Invests you agree to the collection and use of information as described in
            this policy. If you do not agree, please do not use the Service.
          </p>
        </section>

        {/* 2. What We Collect */}
        <section>
          <h2 className="text-xl font-bold text-white mb-3 mt-10">2. Information We Collect</h2>
          <div className="space-y-3 text-gray-300 leading-relaxed">
            <p>
              <strong className="text-white">Account information:</strong> When you register we
              collect your name (if provided) and email address. Passwords are stored using
              bcrypt hashing — we never store your password in plain text.
            </p>
            <p>
              <strong className="text-white">Portfolio and watchlist data:</strong> Stocks, assets,
              and positions you add to your portfolio or watchlist are stored in our database
              associated with your account.
            </p>
            <p>
              <strong className="text-white">Inputs to AI features:</strong> When you use
              AI-powered analysis, chat, or Q&amp;A features your queries and any context you
              provide are transmitted to our AI provider(s) to generate a response. See Section 4
              for details on those providers and how inputs are handled.
            </p>
            <p>
              <strong className="text-white">Billing information:</strong> If you subscribe to
              Mr. Guy Invests Pro, payment is processed by Stripe. We store only your Stripe customer ID
              and subscription status — we never see or store your full card number.
            </p>
            <p>
              <strong className="text-white">Usage analytics:</strong> We collect information about
              how you interact with the Service in two ways. Vercel Analytics collects anonymised,
              cookieless page-view data. Additionally, for logged-in users, we record page visits in
              our own database (the pages you navigate to, timestamps, and your account ID) to
              understand feature usage and improve the product.
            </p>
            <p>
              <strong className="text-white">Onboarding survey responses:</strong> When you first sign
              up, we ask about your investing experience level and goals. These responses are stored
              anonymously — they are not linked to your account — and are used only for aggregate
              product analytics. Because they are not linked to you, they cannot be attributed to your
              account and are not removed when you delete your account.
            </p>
            <p>
              <strong className="text-white">IP address and device data:</strong> Our servers and
              hosting provider automatically record your IP address, browser type, operating system,
              and referring URL as part of standard web server logs. This data is used for security,
              fraud prevention, and aggregate analytics.
            </p>
            <p>
              <strong className="text-white">Session cookies:</strong> We use secure session
              cookies required for authentication. See Section 6 for details.
            </p>
            <p>
              <strong className="text-white">What we do not collect:</strong> We do not collect
              Social Security numbers, government-issued ID numbers, brokerage account credentials,
              or any other sensitive financial account identifiers.
            </p>
          </div>
        </section>

        {/* 3. How We Use Your Information */}
        <section>
          <h2 className="text-xl font-bold text-white mb-3 mt-10">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300 leading-relaxed">
            <li>To create and operate your account and provide the Service</li>
            <li>To power AI-driven analysis and personalized features using your portfolio data
              and query inputs</li>
            <li>To personalise your dashboard, watchlist, alerts, and content recommendations</li>
            <li>To manage your Pro subscription and billing via Stripe</li>
            <li>To send transactional emails — such as email verification, password reset, and
              subscription receipts — via our email provider</li>
            <li>To generate aggregate, anonymised analytics that help us understand how the
              product is used and guide product decisions</li>
            <li>To detect fraud, enforce usage limits, and protect the security of the Service</li>
            <li>To comply with legal obligations</li>
          </ul>
          <p className="text-gray-300 leading-relaxed mt-3">
            We do <strong className="text-white">not</strong> sell, rent, or share your personal
            information with third parties for their marketing or advertising purposes.
          </p>
          <p className="text-gray-300 leading-relaxed mt-3 font-semibold text-white">Legal basis for processing (GDPR)</p>
          <p className="text-gray-300 leading-relaxed mb-2">
            If you are located in the EEA or UK, the following legal bases apply:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300 border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 pr-4 text-white font-semibold">Processing activity</th>
                  <th className="text-left py-2 text-white font-semibold">Legal basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <tr><td className="py-2 pr-4">Account creation &amp; authentication</td><td className="py-2">Contract</td></tr>
                <tr><td className="py-2 pr-4">Portfolio, watchlist &amp; AI features</td><td className="py-2">Contract</td></tr>
                <tr><td className="py-2 pr-4">Billing &amp; subscription management</td><td className="py-2">Contract</td></tr>
                <tr><td className="py-2 pr-4">Transactional emails</td><td className="py-2">Contract</td></tr>
                <tr><td className="py-2 pr-4">Page-level usage analytics</td><td className="py-2">Legitimate interests (improving the Service)</td></tr>
                <tr><td className="py-2 pr-4">Security logging &amp; fraud prevention</td><td className="py-2">Legitimate interests (protecting the Service)</td></tr>
                <tr><td className="py-2 pr-4">Legal compliance</td><td className="py-2">Legal obligation</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Third-Party Services */}
        <section>
          <h2 className="text-xl font-bold text-white mb-3 mt-10">4. Third-Party Services</h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            We rely on the following third-party providers to deliver the Service. Each provider
            operates under its own privacy policy and data processing terms.
          </p>
          <div className="space-y-3 text-gray-300 leading-relaxed">
            <p>
              <strong className="text-white">Vercel</strong> — cloud hosting, deployment, and
              infrastructure. Vercel processes server logs including IP addresses. Vercel Analytics
              and Speed Insights collect anonymised page-view and performance data.
            </p>
            <p>
              <strong className="text-white">Neon / PostgreSQL</strong> — managed database hosting.
              Your account data, portfolio data, and watchlist data are stored here.
            </p>
            <p>
              <strong className="text-white">Stripe</strong> — payment processing and subscription
              management. When you subscribe, your payment details are submitted directly to Stripe.
              We receive only a customer ID and subscription status. Stripe&apos;s privacy policy
              governs all payment data.
            </p>
            <p>
              <strong className="text-white">Resend</strong> — transactional email delivery.
              Your email address is shared with Resend solely to deliver emails we send you
              (verification links, password resets, subscription notices).
            </p>
            <p>
              <strong className="text-white">Anthropic Claude API</strong> — AI-generated analysis
              and responses. Queries you submit to AI features are sent to Anthropic&apos;s servers
              for processing. We do not store your AI inputs beyond the current session; Anthropic
              may retain inputs subject to their own data retention policies.
            </p>
            <p>
              <strong className="text-white">xAI (Grok API)</strong> — AI-generated features.
              Certain AI features route queries through xAI&apos;s servers. The same session-only
              retention policy applies on our end; xAI&apos;s policies govern their handling.
            </p>
            <p>
              <strong className="text-white">Third-party market data providers and SEC EDGAR</strong>{' '}
              — stock prices, financial data, and public regulatory filings. These are read-only
              data sources; we do not share your personal information with them.
            </p>
          </div>
          <p className="text-gray-300 leading-relaxed mt-3">
            We are not responsible for the independent privacy practices of these third-party
            providers. We encourage you to review their privacy policies directly.
          </p>
        </section>

        {/* 5. Data Retention */}
        <section>
          <h2 className="text-xl font-bold text-white mb-3 mt-10">5. Data Retention</h2>
          <p className="text-gray-300 leading-relaxed">
            Your account data — including your email address, name, portfolio data, watchlist, and
            preferences — is retained for as long as your account is active. You may request deletion
            of your account and all associated personal data at any time (see Section 7). Upon a
            valid deletion request we will remove your personal data from our systems within 30 days.
          </p>
          <p className="text-gray-300 leading-relaxed mt-3">
            <strong className="text-white">AI inputs:</strong> We do not store queries or responses
            from AI features beyond the current browser session. Your inputs are sent to the
            applicable AI provider in real time and are not persisted in our database after the
            session ends.
          </p>
          <p className="text-gray-300 leading-relaxed mt-3">
            Stripe independently retains billing records as required by financial and tax
            regulations. Server logs are retained for a limited period for security and
            debugging purposes.
          </p>
        </section>

        {/* 6. Cookies and Tracking */}
        <section>
          <h2 className="text-xl font-bold text-white mb-3 mt-10">6. Cookies and Tracking</h2>
          <p className="text-gray-300 leading-relaxed">
            We use functional session cookies that are strictly necessary to keep you authenticated
            while you use the Service (managed via NextAuth.js). We do not use advertising cookies,
            third-party tracking cookies, or behavioural profiling cookies.
          </p>
          <p className="text-gray-300 leading-relaxed mt-3">
            Vercel Analytics collects anonymised performance and page-view data using
            privacy-preserving methods that do not require persistent cookies or fingerprinting.
          </p>
          <p className="text-gray-300 leading-relaxed mt-3">
            For logged-in users, we also record page navigation events in our own database to
            understand how features are used (see Section 2). This is first-party tracking tied to
            your account and is not shared with third parties. You may opt out by contacting us at{' '}
            <a href="mailto:support@mrguyinvests.com" className="text-blue-400 hover:underline">
              support@mrguyinvests.com
            </a>.
          </p>
          <p className="text-gray-300 leading-relaxed mt-3">
            A cookie notice is displayed on your first visit. You may accept or decline non-essential
            analytics at any time.
          </p>
        </section>

        {/* 7. Children's Privacy (COPPA) */}
        <section>
          <h2 className="text-xl font-bold text-white mb-3 mt-10">7. Children&apos;s Privacy</h2>
          <p className="text-gray-300 leading-relaxed">
            The Service is available to users aged 13 and older. We do not knowingly collect personal
            information from children under 13. If we become aware that a child under 13 has registered
            an account, we will promptly delete that account and any associated personal data.
          </p>
          <p className="text-gray-300 leading-relaxed mt-3">
            If you are a parent or guardian and believe your child under 13 has created an account,
            please contact us immediately at{' '}
            <a href="mailto:support@mrguyinvests.com" className="text-blue-400 hover:underline">
              support@mrguyinvests.com
            </a>{' '}
            so we can remove the account. Users aged 13–17 should review this Privacy Policy with a
            parent or guardian.
          </p>
        </section>

        {/* 8. Your Rights */}
        <section>
          <h2 className="text-xl font-bold text-white mb-3 mt-10">8. Your Rights</h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            Depending on your location you may have the following rights regarding your personal
            data. To exercise any of them, contact us at the address in Section 11.
          </p>
          <div className="space-y-3 text-gray-300 leading-relaxed">
            <p>
              <strong className="text-white">Delete your account:</strong> You may request deletion
              of your account and all associated personal data at any time. We will process the
              request within 30 days.
            </p>
            <p>
              <strong className="text-white">Export your data:</strong> You may request a copy of
              the personal data we hold about you in a portable, machine-readable format.
            </p>
            <p>
              <strong className="text-white">Opt out of analytics:</strong> You may opt out of
              usage analytics collection by contacting us. Note that strictly necessary session
              cookies required for authentication cannot be disabled without affecting your ability
              to sign in.
            </p>
            <p>
              <strong className="text-white">Access and correction:</strong> You may request access
              to your personal data or ask us to correct inaccurate information.
            </p>
            <p>
              <strong className="text-white">GDPR (EEA / UK) rights:</strong> If you are located in
              the European Economic Area or United Kingdom, you have rights under the GDPR including
              the right to access, rectify, erase, restrict processing, and object to processing of
              your personal data, as well as the right to data portability.
            </p>
            <p>
              <strong className="text-white">CCPA (California) rights:</strong> California residents
              have the right to know what personal information we collect and how it is used, the
              right to delete personal information, and the right to opt out of sale of personal
              information. We do not sell personal information.
            </p>
          </div>
        </section>

        {/* 9. Security */}
        <section>
          <h2 className="text-xl font-bold text-white mb-3 mt-10">9. Security</h2>
          <p className="text-gray-300 leading-relaxed">
            We implement industry-standard security measures including bcrypt password hashing,
            HTTPS encryption on all connections, and JWT-based secure session management. Access to
            production data is restricted to authorised personnel only.
          </p>
          <p className="text-gray-300 leading-relaxed mt-3">
            No system is 100% secure and we cannot guarantee the absolute security of your
            information. In the event of a data breach that materially affects your personal data,
            we will notify affected users as required by applicable law.
          </p>
        </section>

        {/* 10. Changes to This Policy */}
        <section>
          <h2 className="text-xl font-bold text-white mb-3 mt-10">10. Changes to This Policy</h2>
          <p className="text-gray-300 leading-relaxed">
            We may update this Privacy Policy from time to time. When we make material changes we
            will update the effective date at the top of this page and, where appropriate, notify
            registered users via email. Continued use of the Service after changes take effect
            constitutes your acceptance of the updated policy.
          </p>
        </section>

        {/* 11. Contact */}
        <section>
          <h2 className="text-xl font-bold text-white mb-3 mt-10">11. Contact Us</h2>
          <p className="text-gray-300 leading-relaxed">
            For privacy-related questions, data deletion requests, or data export requests,
            please contact us at:{' '}
            <a href="mailto:support@mrguyinvests.com" className="text-blue-400 hover:underline">
              support@mrguyinvests.com
            </a>
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
