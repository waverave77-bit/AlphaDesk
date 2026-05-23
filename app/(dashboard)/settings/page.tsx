'use client'
import { useSession, signOut, signIn } from 'next-auth/react'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Shield, Palette, LogOut, Sun, Moon, Brain, FlaskConical, Loader2, CreditCard } from 'lucide-react'
import { useTheme, ACCENT_THEMES } from '@/components/ThemeProvider'
import { useAdmin } from '@/hooks/useAdmin'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { data: session } = useSession()
  const { isDark, accentId, setDark, setAccent } = useTheme()
  const { isAdmin } = useAdmin()
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoError, setDemoError] = useState('')
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState('')

  const openBillingPortal = async () => {
    setPortalLoading(true)
    setPortalError('')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setPortalError(data.error || 'Could not open billing portal. Try again.')
        setPortalLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setPortalError('Something went wrong. Try again.')
      setPortalLoading(false)
    }
  }

  const enterPreview = async () => {
    setDemoLoading(true)
    setDemoError('')
    try {
      const res = await fetch('/api/admin/demo', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.demoToken) {
        setDemoError(data.error || 'Failed to enter preview. Make sure DEMO_SECRET is set in Vercel env vars.')
        setDemoLoading(false)
        return
      }
      localStorage.setItem('adminReturnEmail', session?.user?.email ?? '')
      const result = await signIn('credentials', { demoToken: data.demoToken, redirect: false })
      if (result?.error) {
        setDemoError('Sign-in as demo user failed. Check DEMO_SECRET matches between .env and Vercel.')
        setDemoLoading(false)
        return
      }
      window.location.href = '/dashboard'
    } catch (e) {
      setDemoError('Something went wrong. Try again.')
      setDemoLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Two-column grid on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-start">

        {/* LEFT COLUMN */}
        <div className="space-y-5 lg:space-y-6">

          {/* Appearance — theme + dark mode in one card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-gray-400 uppercase tracking-wider font-semibold">
                <Palette className="h-4 w-4 text-blue-400" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Dark / Light toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Dark Mode</p>
                  <p className="text-xs text-gray-500 mt-0.5">Toggle between light and dark interface</p>
                </div>
                <button
                  onClick={() => setDark(!isDark)}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors focus:outline-none',
                    isDark ? 'bg-blue-600' : 'bg-gray-300'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform flex items-center justify-center',
                    isDark ? 'translate-x-5' : 'translate-x-0'
                  )}>
                    {isDark
                      ? <Moon className="h-2.5 w-2.5 text-blue-600" />
                      : <Sun className="h-2.5 w-2.5 text-yellow-500" />
                    }
                  </span>
                </button>
              </div>

              {/* Accent colour */}
              <div>
                <p className="text-sm font-medium text-white mb-3">Accent Colour</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ACCENT_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setAccent(theme.id)}
                      style={accentId === theme.id ? {
                        borderColor: `rgb(${theme.accentRgb} / 0.6)`,
                        backgroundColor: `rgb(${theme.accentRgb} / 0.1)`,
                      } : {}}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all',
                        accentId === theme.id ? 'border-transparent' : 'border-gray-800 hover:border-gray-600 hover:bg-gray-800/40'
                      )}
                    >
                      <div className={cn('h-4 w-4 rounded-full flex-shrink-0', theme.accent)} />
                      <span className="text-sm text-white">{theme.name}</span>
                      {accentId === theme.id && <span className="ml-auto text-[10px]" style={{ color: `rgb(${theme.accentRgb})` }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>


        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5 lg:space-y-6">

          {/* AI Analysis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-gray-400 uppercase tracking-wider font-semibold">
                <Brain className="h-4 w-4 text-blue-400" />
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-gray-400">Stock and portfolio analysis runs on a 3-model ensemble:</p>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { name: 'Claude Haiku', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
                  { name: 'DeepSeek V3',  color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
                  { name: 'Grok 4',        color: 'bg-green-500/20 text-green-300 border-green-500/30' },
                ].map(m => (
                  <div key={m.name} className={cn('rounded-lg border px-3 py-2 text-center text-xs font-medium', m.color)}>{m.name}</div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">All 3 run in parallel and a 4th Claude call synthesizes a consensus answer.</p>
            </CardContent>
          </Card>

          {/* Account */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-gray-400 uppercase tracking-wider font-semibold">
                <User className="h-4 w-4 text-blue-400" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { label: 'Email', value: session?.user?.email },
                { label: 'Name',  value: session?.user?.name || 'Not set' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2.5 border-b border-gray-800 last:border-0">
                  <span className="text-sm text-gray-400">{label}</span>
                  <span className="text-sm text-gray-200">{value}</span>
                </div>
              ))}
              <div className="flex justify-between py-2.5">
                <span className="text-sm text-gray-400">Status</span>
                <Badge variant="success">Active</Badge>
              </div>
              {isAdmin && (
                <div className="pt-3 pb-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                    onClick={enterPreview}
                    disabled={demoLoading}
                  >
                    {demoLoading ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5 mr-2" />}
                    Preview as New User
                  </Button>
                  <p className="text-xs text-gray-600 mt-1.5 text-center">See the site as a brand new user. Nothing saves.</p>
                  {demoError && <p className="text-xs text-red-400 mt-1.5 text-center">{demoError}</p>}
                </div>
              )}
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-400 border-red-500/30 hover:bg-red-500/10 w-full"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  <LogOut className="h-3.5 w-3.5 mr-2" /> Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-gray-400 uppercase tracking-wider font-semibold">
                <CreditCard className="h-4 w-4 text-blue-400" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-gray-500">
                Manage your billing, update your payment method, or cancel your subscription through the Stripe portal.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                onClick={openBillingPortal}
                disabled={portalLoading}
              >
                {portalLoading
                  ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  : <CreditCard className="h-3.5 w-3.5 mr-2" />
                }
                Manage Subscription
              </Button>
              {portalError && (
                <p className="text-xs text-red-400 text-center">{portalError}</p>
              )}
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-gray-400 uppercase tracking-wider font-semibold">
                <Shield className="h-4 w-4 text-green-400" />
                Data & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-xs text-gray-500">
              <p>• Portfolio data stored securely in PostgreSQL</p>
              <p>• Stock data from third-party market data providers and public regulatory filings (SEC EDGAR)</p>
              <p>• AI analysis via Claude (Anthropic), DeepSeek, and xAI APIs</p>
              <p>• No data is sold or shared with third parties</p>
              <p className="pt-2 text-gray-600">For informational purposes only. Not financial advice.</p>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
