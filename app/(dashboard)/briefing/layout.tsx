import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Daily Market Briefing — Morning & Midday | Mr. Guy Invests',
  description: 'Get a quick daily market briefing in plain English. AI-generated morning and midday summaries of what is moving markets today.',
  keywords: ['daily market briefing', 'stock market today', 'market summary', 'morning market update', 'what is moving markets today'],
}

export default function BriefingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
