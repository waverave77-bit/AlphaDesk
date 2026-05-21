import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Smart Money Tracker — Zains Game',
  description: 'Track corporate insider trades from SEC Form 4 filings and top fund manager holdings from 13F disclosures. All publicly reported data.',
}

export default function InsidersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
