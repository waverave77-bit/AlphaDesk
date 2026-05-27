import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bull vs Bear — AI Stock Debate | Mr. Guy Invests',
  description: 'Enter any stock ticker and get the bull case vs bear case argued by AI. Is it a buy or a sell? Get both sides in plain English.',
  keywords: ['bull vs bear stock', 'should I buy stock', 'stock analysis', 'buy or sell stock', 'AI stock analysis'],
}

export default function BullVsBearLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
