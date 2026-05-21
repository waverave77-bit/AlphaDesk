import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '$100K Challenge — Mr. Guy Invests',
  description: 'Practice investing with $100,000 of virtual money. No real funds involved. Compete on the leaderboard and learn how markets work.',
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
