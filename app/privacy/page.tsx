import Link from 'next/link'
import MrGuyLogoSvg from '@/components/MrGuyLogoSvg'

export const metadata = {
  title: 'Privacy Policy',
  description: 'How Mr. Guy Invests collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2.5">
          <MrGuyLogoSvg px={3} />
          <span className="text-xl font-bold">Mr. Guy Invests</span>
        </Link>
        <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
          Sign In
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div>
          <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-gray-400 text-sm">Last updated: May 2026</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">1. Who We Are</h2>
          <p className="text-gray-400 leading-relaxed">
            Mr. Guy Invests (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the website at{' '}
            <span className="text-blue-400">mrguyinvests.com</span>. This Privacy Policy explains what personal
            information we collect, how we use it, and your rights regarding that information.
          </p>
          <p className="text-gray-400 leading-relaxed">
            This service is intended for users who are 13 years of age or older. Users under 18 should have
            parental or guardian permission before creating an account. We do not knowingly collect personal
            information from children under 13. If you believe a child under 13 has created an account, please
            contact us immediately so we can delete the information.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">2. What We Collect</h2>
          <div className="space-y-3 text-gray-400 leading-relaxed">
            <p><strong className="text-gray-300">Account information:</strong> When you register, we collect your email address and a hashed (encrypted) password. We never store your password in plain text.</p>
            <p><strong className="text-gray-300">Watchlist data:</strong> If you add stocks to your watchlist, that data is stored in our database associated with your account.</p>
            <p><strong className="text-gray-300">Billing information:</strong> If you subscribe to Mr. Guy Invests Pro, payment is handled by Stripe. We store only your Stripe customer ID and subscription status — we never see or store your full card details.</p>
            <p><strong className="text-gray-300">Usage data:</strong> We may collect basic information about how you use the service (pages visited, features used) to improve the product. We do not sell this data.</p>
            <p><strong className="text-gray-300">Session data:</strong> We use secure session cookies (via NextAuth.js) to keep you signed in. These are necessary for the service to function.</p>
            <p><strong className="text-gray-300">Virtual portfolio data:</strong> If you participate in the $100K Challenge or other virtual trading features, we store your simulated trades, portfolio holdings, and game history. This is fictional/game data only — no real money is involved.</p>
            <p><strong className="text-gray-300">We do not collect:</strong> social security numbers, government IDs, brokerage account numbers, or any other sensitive financial account details.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-400 leading-relaxed">
            <li>To operate your account and provide the service</li>
            <li>To display your saved watchlist and preferences</li>
            <li>To manage your subscription and billing via Stripe</li>
            <li>To send transactional emails (e.g., password reset) — we do not send marketing emails</li>
            <li>To enforce usage limits and prevent abuse of AI features</li>
            <li>To improve and debug the service</li>
          </ul>
          <p className="text-gray-400">
            We do <strong className="text-gray-300">not</strong> sell, rent, or share your personal information
            with third parties for their marketing purposes.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">4. Third-Party Services</h2>
          <p className="text-gray-400 leading-relaxed">
            The service uses the following third-party providers to function:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-400 leading-relaxed">
            <li><strong className="text-gray-300">Vercel</strong> — hosting, deployment, Vercel Analytics (anonymised page-view data), and Vercel Speed Insights (anonymised Core Web Vitals performance data)</li>
            <li><strong className="text-gray-300">Neon (PostgreSQL)</strong> — database hosting for account and watchlist data</li>
            <li><strong className="text-gray-300">Stripe</strong> — payment processing and subscription management. Stripe&apos;s privacy policy applies to payment data.</li>
            <li><strong className="text-gray-300">Third-party market data providers</strong> — stock prices and financial data (Yahoo Finance, etc.)</li>
            <li><strong className="text-gray-300">SEC EDGAR</strong> — public regulatory filings (Form 4, 13F)</li>
            <li><strong className="text-gray-300">Anthropic Claude API</strong> — AI-generated analysis and responses</li>
            <li><strong className="text-gray-300">xAI (Grok API)</strong> — used for certain AI-generated features; your queries may be processed by xAI&apos;s servers</li>
            <li><strong className="text-gray-300">DeepSeek API</strong> — used for certain AI-generated features; your queries may be processed by DeepSeek&apos;s servers</li>
          </ul>
          <p className="text-gray-400">
            These providers may have access to minimal technical data (e.g., IP addresses) as part of standard
            internet operations. We are not responsible for their independent privacy practices.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">5. Data Retention and Deletion</h2>
          <p className="text-gray-400 leading-relaxed">
            Your account data is retained as long as your account is active. You may request deletion of your
            account and all associated data at any time by contacting us. Upon request, we will delete your
            email address, watchlist, and any other personal data within 30 days. Note that Stripe retains
            billing records independently as required by financial regulations.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">6. Cookies</h2>
          <p className="text-gray-400 leading-relaxed">
            We use only functional session cookies required for authentication (via NextAuth.js). We do not
            use advertising cookies or third-party tracking cookies for our own purposes. Vercel Analytics
            collects anonymised performance data. No cookie consent banner is shown for strictly necessary
            cookies.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">7. Your Rights</h2>
          <p className="text-gray-400 leading-relaxed">
            Depending on your location, you may have rights to access, correct, or delete your personal data.
            If you are located in the European Economic Area (EEA) or the UK, you have rights under the GDPR.
            California residents have rights under the CCPA, including the right to know what data we collect
            and the right to request deletion. To exercise any of these rights, contact us at the address below.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">8. Security</h2>
          <p className="text-gray-400 leading-relaxed">
            We use industry-standard practices to protect your data, including bcrypt password hashing,
            encrypted HTTPS connections on all pages, and JWT-based secure sessions. No system is 100% secure,
            and we cannot guarantee the absolute security of your information. In the event of a data breach
            that affects your personal data, we will notify affected users as required by applicable law.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">9. Changes to This Policy</h2>
          <p className="text-gray-400 leading-relaxed">
            We may update this Privacy Policy from time to time. Changes will be posted on this page with an
            updated date. Continued use of the service after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">10. Contact</h2>
          <p className="text-gray-400 leading-relaxed">
            For privacy-related questions or data deletion requests, contact us at:{' '}
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
