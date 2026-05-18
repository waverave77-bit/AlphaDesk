import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import TopNav from '@/components/TopNav'
import TickerBar from '@/components/TickerBar'
import DemoBanner from '@/components/DemoBanner'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <DemoBanner />
      <TopNav />
      <TickerBar />
      <main className="flex-1 overflow-y-auto scrollbar-thin relative z-20">
        <div className="p-6 w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
