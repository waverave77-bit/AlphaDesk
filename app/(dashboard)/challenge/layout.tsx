import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pick of the Week — Beat Mr. Guy | Mr. Guy Invests',
  description: 'Every week Mr. Guy picks a stock. You pick one too. See who wins. Free weekly stock picking game — no account required to view.',
  keywords: ['stock pick of the week', 'weekly stock pick', 'stock picking game', 'beat the market', 'stock challenge'],
}

export default function ChallengeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
