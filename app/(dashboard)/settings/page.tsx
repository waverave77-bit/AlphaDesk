'use client'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Shield, Info } from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account and preferences</p>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-green-400" />
            Data & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-400">
          <p>&bull; All portfolio data is stored locally in SQLite on your machine</p>
          <p>&bull; Stock data is fetched from Yahoo Finance &mdash; no API key required</p>
          <p>&bull; AI analysis calls are sent to Anthropic&apos;s API (requires ANTHROPIC_API_KEY)</p>
          <p>&bull; No data is shared with third parties</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-yellow-400" />
            About AlphaDesk
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-400">
          <p>Version 1.0.0</p>
          <p className="text-xs text-gray-600 mt-3 leading-relaxed">
            AlphaDesk is for informational and educational purposes only. The information provided does not constitute investment advice, financial advice, trading advice, or any other sort of advice. You should conduct your own research before making any investment decisions. Past performance is not indicative of future results.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
