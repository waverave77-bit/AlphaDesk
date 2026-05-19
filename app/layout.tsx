import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import SessionProvider from '@/components/SessionProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://zainsgame.vercel.app'),
  title: 'Zains Game, Professional Stock Research & Portfolio Tracker',
  description: 'AI-powered stock research, earnings calendar, and portfolio management.',
  openGraph: {
    title: 'Zains Game, Professional Stock Research & Portfolio Tracker',
    description: 'AI-powered stock research, earnings calendar, and portfolio management.',
    url: 'https://zainsgame.vercel.app',
    siteName: 'Zains Game',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zains Game, Stock Research & Portfolio Tracker',
    description: 'AI-powered stock research, earnings calendar, and portfolio management.',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`} suppressHydrationWarning>
        <SessionProvider session={session}>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
