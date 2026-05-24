import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import SessionProvider from '@/components/SessionProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import CookieNotice from '@/components/CookieNotice'
import ActivityTracker from '@/components/ActivityTracker'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://mrguyinvests.com'),
  title: {
    default: 'Mr. Guy Invests',
    template: '%s | Mr. Guy Invests',
  },
  description: 'Mr. Guy Invests — free stock research tools for beginners and long-term investors. Track hedge fund moves from SEC filings, get AI explanations of any stock, and build your portfolio. No credit card needed.',
  openGraph: {
    title: 'Mr. Guy Invests',
    description: 'Free stock research tools for beginners and long-term investors. Track hedge fund moves from SEC filings, get AI explanations of any stock, and build your portfolio.',
    url: 'https://mrguyinvests.com',
    siteName: 'Mr. Guy Invests',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mr. Guy Invests',
    description: 'Free stock research tools for beginners and long-term investors. Track hedge fund moves, get AI stock analysis, and build your portfolio.',
  },
}

const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Mr. Guy Invests',
  url: 'https://www.mrguyinvests.com',
  description: 'Free stock research tools for beginners and long-term investors. Track hedge fund moves from SEC filings, get AI explanations of any stock, and build your portfolio.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  offers: [
    { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD', description: 'Core research tools with daily limits. No credit card required.' },
    { '@type': 'Offer', name: 'Pro', price: '4.99', priceCurrency: 'USD', description: 'Removes all limits. Full access to Smart Money tracking and AI tools.', billingIncrement: 'P1M' },
  ],
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Mr. Guy Invests?',
      acceptedAnswer: { '@type': 'Answer', text: 'Mr. Guy Invests is a free stock research platform for beginners and long-term investors. It tracks hedge fund and insider trades from public SEC filings (Form 13F, Form 4), provides AI-powered stock analysis explained in plain English, and includes a portfolio tracker, stock screener, and price alerts.' },
    },
    {
      '@type': 'Question',
      name: 'Is Mr. Guy Invests free?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. Mr. Guy Invests has a free tier with no credit card required. A Pro plan is available for $4.99/month which removes all daily limits and unlocks full access to Smart Money tracking and AI tools.' },
    },
    {
      '@type': 'Question',
      name: 'What is the Smart Money Tracker?',
      acceptedAnswer: { '@type': 'Answer', text: 'The Smart Money Tracker shows what hedge funds and company insiders are buying and selling, using public SEC filings (Form 13F and Form 4). It makes institutional trading data accessible to everyday investors without needing a finance background.' },
    },
    {
      '@type': 'Question',
      name: 'Is Mr. Guy Invests financial advice?',
      acceptedAnswer: { '@type': 'Answer', text: 'No. Mr. Guy Invests is for informational and educational purposes only. Nothing on the site constitutes financial advice or a recommendation to buy or sell any security. Always consult a qualified financial advisor before making investment decisions.' },
    },
    {
      '@type': 'Question',
      name: 'Who is Mr. Guy Invests designed for?',
      acceptedAnswer: { '@type': 'Answer', text: 'Mr. Guy Invests is designed for beginner investors, long-term investors, and anyone who wants professional-grade stock research tools without needing a finance background. All AI analysis is written in plain English.' },
    },
    {
      '@type': 'Question',
      name: 'What stock research tools does Mr. Guy Invests include?',
      acceptedAnswer: { '@type': 'Answer', text: 'Mr. Guy Invests includes: Smart Money Tracker (hedge fund and insider activity), AI Stock Tutor (plain English stock analysis), Portfolio Tracker, Price Alerts, Stock Report Cards, Bull vs Bear debate, Earnings Calendar, Market Briefing, Finance Translator, and a $100K virtual trading challenge.' },
    },
  ],
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Mr. Guy Invests',
  url: 'https://www.mrguyinvests.com',
  description: 'Free stock research tools for beginners and long-term investors.',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://www.mrguyinvests.com/research/{search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      </head>
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`} suppressHydrationWarning>
        <SessionProvider session={session}>
          <ThemeProvider>
            {children}
            <Toaster />
            <ActivityTracker />
            <CookieNotice />
            <Analytics />
            <SpeedInsights />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
