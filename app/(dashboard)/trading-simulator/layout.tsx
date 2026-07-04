import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stock Trading Simulator — Practice With $100,000 Virtual Money',
  description: 'Practice stock trading with $100,000 of virtual money. No real funds, no risk. Learn how to invest, test strategies, and compete on the leaderboard — free forever.',
  keywords: ['stock trading simulator', 'virtual stock trading', 'paper trading', 'stock market simulator', 'practice investing', 'virtual portfolio', 'learn to trade stocks'],
  alternates: {
    canonical: '/trading-simulator',
  },
}

export default function TradingSimulatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
