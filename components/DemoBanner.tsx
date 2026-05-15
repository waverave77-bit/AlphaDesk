'use client'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { FlaskConical, X, Loader2 } from 'lucide-react'

export default function DemoBanner() {
  const { data: session } = useSession()
  const [exiting, setExiting] = useState(false)

  if (!(session?.user as any)?.isDemo) return null

  const exit = async () => {
    setExiting(true)
    await fetch('/api/admin/demo', { method: 'DELETE' })
    // Get the admin email stored before entering demo
    const adminEmail = localStorage.getItem('adminReturnEmail') ?? ''
    localStorage.removeItem('adminReturnEmail')
    await signOut({ redirect: false })
    window.location.href = `/login${adminEmail ? `?email=${encodeURIComponent(adminEmail)}` : ''}`
  }

  return (
    <div className="w-full bg-purple-600 text-white px-4 py-2 flex items-center justify-between text-sm z-50">
      <div className="flex items-center gap-2 font-medium">
        <FlaskConical className="h-4 w-4" />
        Preview Mode — you are seeing the new user experience. Nothing you do here is saved permanently.
      </div>
      <button
        onClick={exit}
        disabled={exiting}
        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1 font-semibold transition-colors shrink-0"
      >
        {exiting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        Exit Preview
      </button>
    </div>
  )
}
