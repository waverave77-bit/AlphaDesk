'use client'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Shield, Info, Palette } from 'lucide-react'
import { useTheme, THEMES } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { data: session } = useSession()
  const { themeId, setTheme } = useTheme()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-blue-400" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500 mb-4">Choose your accent colour. Changes apply instantly.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all',
                  themeId === theme.id
                    ? 'border-white/30 bg-white/5 ring-1 ring-white/20'
                    : 'border-gray-800 hover:border-gray-600 hover:bg-gray-800/40'
                )}
              >
                <div className={cn('h-5 w-5 rounded-full flex-shrink-0', theme.accent)} />
                <div>
                  <p className="text-sm font-medium text-white leading-tight">{theme.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{theme.description}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-blue-400" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-800">
            <span className="text-sm text-gray-400">Email</span>
            <span className="text-sm text-gray-200">{session?.user?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-800">
            <span className="text-sm text-gray-400">Name</span>
            <span className="text-sm text-gray-200">{session?.user?.name || 'Not set'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-gray-400">Status</span>
            <Badge variant="success">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-green-400" />
            Data & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-400">
          <p>&bull; Portfolio data is stored securely in PostgreSQL (Neon)</p>
          <p>&bull; Stock data is fetched from Yahoo Finance &mdash; no API key required</p>
          <p>&bull; AI analysis calls are sent to Anthropic&apos;s API</p>
          <p>&bull; No data is shared with third parties</p>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-yellow-400" />
            About AlphaDesk
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-400">
          <p>Version 1.1.0</p>
          <p className="text-xs text-gray-600 mt-3 leading-relaxed">
            AlphaDesk is for informational and educational purposes only. Nothing here constitutes investment advice. Always do your own research before making investment decisions.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
