import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Go Pro',
  description: 'Upgrade to Mr. Guy Invests Pro — unlimited Mr. Guy chat, unlimited AI stock breakdowns, a second $100K portfolio, and no daily limits. $4.99/month, cancel anytime.',
}

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
