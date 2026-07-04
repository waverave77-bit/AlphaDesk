import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Your Free Account',
  description: 'Join Mr. Guy Invests free — bite-sized investing lessons, a $100K practice portfolio, and plain-English answers to any money question.',
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
