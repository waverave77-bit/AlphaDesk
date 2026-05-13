import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import TopNav from '@/components/TopNav'
import TickerBar from '@/components/TickerBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <TopNav />
      <TickerBar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1440px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
