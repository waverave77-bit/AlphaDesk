import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import TopNav from '@/components/TopNav'
import TickerBar from '@/components/TickerBar'
import DemoBanner from '@/components/DemoBanner'
import GuestBanner from '@/components/GuestBanner'
import EmailVerificationBanner from '@/components/EmailVerificationBanner'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions).catch(() => null)
  const isGuest = !session

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-950 overflow-x-hidden">
      {isGuest ? <GuestBanner /> : <DemoBanner />}
      <EmailVerificationBanner />
      <TopNav />
      <TickerBar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin relative z-20">
        <div className="p-4 sm:p-6 w-full">
          {children}
        </div>
        <footer className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 mt-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">For informational purposes only. Not financial advice.</p>
            <div className="flex gap-4 text-xs text-gray-400">
              <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
