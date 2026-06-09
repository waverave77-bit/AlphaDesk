import type { Metadata } from 'next'
import { Inter, Archivo_Black, Space_Mono } from 'next/font/google'
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
// Brand display + mono (arcade-pixel identity). Exposed as CSS vars so any
// page/component can opt in via the `font-display` / `font-mono` utilities.
const archivoBlack = Archivo_Black({ subsets: ['latin'], weight: '400', variable: '--font-display' })
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-mono' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? 'https://www.mrguyinvests.com'),
  title: {
    default: 'Mr. Guy Invests — Learn Investing the Fun Way',
    template: '%s | Mr. Guy Invests',
  },
  description: 'Mr. Guy Invests is the beginner-friendly way to learn investing: bite-sized lessons, a $100K virtual practice account, and an AI tutor that explains any stock in plain English.',
  keywords: ['learn investing', 'investing for beginners', 'stock market basics', 'how to invest', 'virtual trading game', 'paper trading', 'stock market simulator', 'investing course', 'AI stock explainer', 'investing dictionary'],
  authors: [{ name: 'Mr. Guy Invests' }],
  creator: 'Mr. Guy Invests',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_URL ?? 'https://mrguyinvests.com',
    siteName: 'Mr. Guy Invests',
    title: 'Mr. Guy Invests — Learn Investing the Fun Way',
    description: 'Bite-sized lessons, a $100K practice account, and an AI tutor that explains any stock in plain English. Built for total beginners.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Mr. Guy Invests — Learn Investing the Fun Way' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mr. Guy Invests — Learn Investing the Fun Way',
    description: 'Bite-sized lessons, a $100K practice account, and an AI tutor that explains any stock in plain English. Built for total beginners.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Mr. Guy Invests',
  url: 'https://www.mrguyinvests.com',
  description: 'A beginner-friendly way to learn investing: gamified bite-sized lessons, a $100K virtual practice account, and an AI tutor that explains any stock in plain English.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  offers: [
    { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD', description: 'All lessons, the full $100K Challenge, the dictionary, and daily AI tools. No credit card required.' },
    { '@type': 'Offer', name: 'Pro', price: '4.99', priceCurrency: 'USD', description: 'Removes the daily limits on every AI tool.', billingIncrement: 'P1M' },
  ],
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Mr. Guy Invests?',
      acceptedAnswer: { '@type': 'Answer', text: 'Mr. Guy Invests is a beginner-friendly way to learn investing. It combines gamified bite-sized lessons, a $100K virtual practice account, an investing dictionary, and an AI tutor that explains any stock in plain English.' },
    },
    {
      '@type': 'Question',
      name: 'Is Mr. Guy Invests free?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. The lessons, the investing dictionary, and the full $100K Challenge are free with no credit card required. A Pro plan ($4.99/month) removes the daily limits on the AI tools.' },
    },
    {
      '@type': 'Question',
      name: 'What is the $100K Challenge?',
      acceptedAnswer: { '@type': 'Answer', text: 'The $100K Challenge is a free game where you start with $100,000 in virtual cash and buy and sell real stocks at real prices. It is a risk-free way for beginners to practice investing and climb the leaderboard.' },
    },
    {
      '@type': 'Question',
      name: 'Is Mr. Guy Invests financial advice?',
      acceptedAnswer: { '@type': 'Answer', text: 'No. Mr. Guy Invests is for informational and educational purposes only. Nothing on the site constitutes financial advice or a recommendation to buy or sell any security. Always consult a qualified financial advisor before making investment decisions.' },
    },
    {
      '@type': 'Question',
      name: 'Who is Mr. Guy Invests designed for?',
      acceptedAnswer: { '@type': 'Answer', text: 'Mr. Guy Invests is designed for complete beginners who want to learn investing without the confusing finance-speak. Everything — the lessons, the practice account, and the AI tutor — is written in plain English, no finance background needed.' },
    },
    {
      '@type': 'Question',
      name: 'What is included in Mr. Guy Invests?',
      acceptedAnswer: { '@type': 'Answer', text: 'Mr. Guy Invests includes a gamified learning path, the $100K Challenge virtual trading game, Ask Mr. Guy (plain-English AI answers about any stock), an investing dictionary, stock research, a markets overview, and an earnings calendar.' },
    },
  ],
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Mr. Guy Invests',
  url: 'https://www.mrguyinvests.com',
  description: 'Learn investing the fun way — gamified lessons, a $100K practice account, and an AI tutor for total beginners.',
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
      <body className={`${inter.className} ${archivoBlack.variable} ${spaceMono.variable} bg-slate-50 text-slate-900 antialiased`} suppressHydrationWarning>
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
