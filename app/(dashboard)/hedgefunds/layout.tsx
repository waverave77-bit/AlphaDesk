import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hedge Fund Tracker — Zains Game',
  description: 'See what top hedge funds are buying and selling, sourced from SEC 13F filings. Updated quarterly.',
}

export default function HedgeFundsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
