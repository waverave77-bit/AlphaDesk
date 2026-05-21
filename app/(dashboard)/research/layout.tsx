import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stock Research — Zains Game',
  description: 'Deep-dive any stock. Get AI-powered analysis, analyst ratings, earnings history, SEC filings, and options data in plain English.',
}

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
