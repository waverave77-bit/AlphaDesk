import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Investing Dictionary — Mr. Guy Invests',
  description: 'Every finance term explained in plain English. P/E ratio, short interest, market cap, options, and hundreds more — no jargon.',
}

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
