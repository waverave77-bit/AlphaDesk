import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import YTDashboard from '@/components/yt-dashboard/YTDashboard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'PowerScale Command Center',
  robots: { index: false, follow: false },
}

export default async function YTPage() {
  const session = await getServerSession(authOptions).catch(() => null)
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    notFound()
  }

  return <YTDashboard />
}
