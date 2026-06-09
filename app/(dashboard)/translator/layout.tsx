import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Finance Translator — Decode Earnings Calls in Plain English | Mr. Guy Invests',
  description: 'Paste any earnings call transcript or finance article and get it translated into plain English instantly. Free AI finance translator.',
  keywords: ['earnings call translator', 'finance terms explained', 'decode earnings call', 'plain english finance', 'earnings transcript explainer'],
}

export default function TranslatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
