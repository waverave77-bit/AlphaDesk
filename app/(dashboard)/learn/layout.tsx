import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Learn Investing — Bite-Sized Lessons',
  description: 'Go from clueless to confident with bite-sized investing lessons. Earn XP, keep your streak, and level up — no finance degree needed.',
}

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
