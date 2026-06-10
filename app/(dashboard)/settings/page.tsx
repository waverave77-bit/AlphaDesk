'use client'
import { useSession, signOut, signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Shield, Palette, LogOut, Sun, Moon, Brain, FlaskConical, Loader2, CreditCard, Mail, Trash2, GraduationCap, TrendingUp, Award, Check, Pencil, X, LogIn } from 'lucide-react'
import { useTheme, ACCENT_THEMES } from '@/components/ThemeProvider'
import { useAdmin } from '@/hooks/useAdmin'
import { cn } from '@/lib/utils'
import { type ExperienceLevel, EXPERIENCE_LABELS, EXPERIENCE_DESCS } from '@/lib/experience'

const EXPERIENCE_ICONS: Record<ExperienceLevel, React.ElementType> = {
  beginner: GraduationCap,
  some: TrendingUp,
  experienced: Award,
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const isPro = !!(session?.user as any)?.isPro
  const { isDark, accentId, setDark, setAccent, skin, setSkin, outfit, setOutfit } = useTheme()
  const PRO_SKINS = [
    { id: 'mint',   name: 'Mint',   canvas: '#e7f7ee', primary: '#0e9f6e', hi: '#ffd23f' },
    { id: 'grape',  name: 'Grape',  canvas: '#f3ecff', primary: '#7c4dff', hi: '#ff8fc7' },
    { id: 'sunset', name: 'Sunset', canvas: '#ffe9d6', primary: '#ff6b35', hi: '#ffd23f' },
  ]
  const { isAdmin } = useAdmin()
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoError, setDemoError] = useState('')
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('beginner')
  const [experienceSaving, setExperienceSaving] = useState(false)
  const [usernameEditing, setUsernameEditing] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [usernameSaving, setUsernameSaving] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [usernameSuccess, setUsernameSuccess] = useState(false)
  const [currentUsername, setCurrentUsername] = useState<string | null>(null)

  // Load experience level from session JWT first (instant, no API call), then verify with DB
  useEffect(() => {
    const sessionLevel = (session?.user as any)?.experienceLevel as ExperienceLevel | undefined
    if (sessionLevel) {
      setExperienceLevel(sessionLevel)
      localStorage.setItem('zg_experience', sessionLevel)
    }
    fetch('/api/user/experience')
      .then(r => r.json())
      .then(d => {
        if (d.experienceLevel) {
          setExperienceLevel(d.experienceLevel as ExperienceLevel)
          localStorage.setItem('zg_experience', d.experienceLevel)
        }
        if (d.username !== undefined) setCurrentUsername(d.username ?? null)
      })
      .catch(() => {
        const saved = localStorage.getItem('zg_experience') as ExperienceLevel | null
        if (saved) setExperienceLevel(saved)
      })
  }, [session?.user?.email])

  // Fallback: derive username from session name if DB didn't return it
  useEffect(() => {
    if (currentUsername === null && session?.user?.name) {
      setCurrentUsername(session.user.name)
    }
  }, [session, currentUsername])

  const handleUsernameSave = async () => {
    setUsernameError('')
    setUsernameSuccess(false)
    if (!usernameInput.trim()) return
    setUsernameSaving(true)
    try {
      const res = await fetch('/api/user/username', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setUsernameError(data.error || 'Failed to update username.')
        setUsernameSaving(false)
        return
      }
      setCurrentUsername(data.username)
      setUsernameEditing(false)
      setUsernameInput('')
      setUsernameSuccess(true)
      setTimeout(() => setUsernameSuccess(false), 3000)
    } catch {
      setUsernameError('Something went wrong. Try again.')
    } finally {
      setUsernameSaving(false)
    }
  }

  const handleExperienceChange = async (level: ExperienceLevel) => {
    setExperienceLevel(level)
    localStorage.setItem('zg_experience', level)
    setExperienceSaving(true)
    try {
      await fetch('/api/user/experience', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experienceLevel: level }),
      })
    } finally {
      setExperienceSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    setDeleteError('')
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        setDeleteError(d.error || 'Failed to delete account. Try again or contact support.')
        setDeleteLoading(false)
        return
      }
      await signOut({ callbackUrl: '/' })
    } catch {
      setDeleteError('Something went wrong. Contact support@mrguyinvests.com')
      setDeleteLoading(false)
    }
  }

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

  // Guest guard
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-gray-800 flex items-center justify-center">
          <LogIn className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Sign in to access Settings</h2>
        <p className="text-sm text-gray-400 max-w-xs">Create a free account or sign in to manage your preferences, experience level, and account details.</p>
        <div className="flex gap-3">
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">Create Account</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-start">

        {/* LEFT COLUMN — Appearance · AI Analysis · Support */}
        <div className="space-y-5 lg:space-y-6">

          {/* Appearance */}
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
                  {ACCENT_THEMES.map((theme) => {
                    const isSelected = accentId === theme.id
                    return (
                      <button
                        key={theme.id}
                        onClick={() => setAccent(theme.id)}
                        style={isSelected ? {
                          borderColor: `rgb(${theme.accentRgb} / 0.6)`,
                          backgroundColor: `rgb(${theme.accentRgb} / 0.1)`,
                        } : {}}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all',
                          isSelected ? 'border-transparent' : 'border-gray-800 hover:border-gray-600 hover:bg-gray-800/40'
                        )}
                      >
                        {/* Always use inline style so the dot colour never changes with the theme */}
                        <div
                          className="h-4 w-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: `rgb(${theme.accentRgb})` }}
                        />
                        <span className="text-sm text-white">{theme.name}</span>
                        {isSelected && (
                          <Check className="ml-auto h-3.5 w-3.5" style={{ color: `rgb(${theme.accentRgb})` }} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Pro themes (light-mode skins) */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-white">Mr. Guy Themes</p>
                  <span className="text-[10px] font-bold uppercase bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 rounded px-1.5 py-0.5">Pro</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">Full-colour repaints of the light theme.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Default (blue arcade) */}
                  <button
                    onClick={() => setSkin(null)}
                    className={cn('rounded-lg border p-2 text-left transition-all', !skin ? 'border-blue-500' : 'border-gray-800 hover:border-gray-600')}
                  >
                    <div className="h-9 rounded-md mb-1.5 flex items-center gap-1.5 px-2 border border-black/10" style={{ background: '#fdf3d7' }}>
                      <span className="h-3.5 w-3.5 rounded-full" style={{ background: '#2563eb' }} />
                      <span className="h-3.5 w-3.5 rounded-full" style={{ background: '#ffd23f' }} />
                    </div>
                    <span className="text-xs text-white flex items-center gap-1">Blue{!skin && <Check className="h-3 w-3 text-blue-400" />}</span>
                  </button>
                  {PRO_SKINS.map((s) => {
                    const sel = skin === s.id
                    return (
                      <button
                        key={s.id}
                        onClick={() => { if (isPro) setSkin(s.id); else window.location.href = '/upgrade' }}
                        className={cn('rounded-lg border p-2 text-left transition-all relative', sel ? 'border-blue-500' : 'border-gray-800 hover:border-gray-600')}
                      >
                        <div className="h-9 rounded-md mb-1.5 flex items-center gap-1.5 px-2 border border-black/10" style={{ background: s.canvas }}>
                          <span className="h-3.5 w-3.5 rounded-full" style={{ background: s.primary }} />
                          <span className="h-3.5 w-3.5 rounded-full" style={{ background: s.hi }} />
                        </div>
                        <span className="text-xs text-white flex items-center gap-1">{s.name}{sel && <Check className="h-3 w-3 text-blue-400" />}</span>
                        {!isPro && <span className="absolute top-1.5 right-1.5 text-[8px] font-bold uppercase bg-yellow-400 text-gray-950 rounded px-1 leading-tight">Pro</span>}
                      </button>
                    )
                  })}
                </div>
                {!isPro && (
                  <p className="text-xs text-gray-500 mt-2">
                    Themes are a <Link href="/upgrade" className="text-blue-400 hover:underline">Pro</Link> perk.
                  </p>
                )}
              </div>

              {/* Pro outfits */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-white">Mr. Guy Outfit</p>
                  <span className="text-[10px] font-bold uppercase bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 rounded px-1.5 py-0.5">Pro</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">A hat + outfit for Mr. Guy — shows in lessons, the dashboard & the $100K Challenge.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([
                    { id: null,     name: 'None',   svg: <span className="h-6 w-6 rounded-full border-2 border-gray-600" /> },
                    { id: 'royal',  name: 'Royal',  svg: (
                      <svg viewBox="0 0 24 24" className="h-6 w-6"><path d="M3 19V8l4 4 5-7 5 7 4-4v11Z" fill="#ffcf33" stroke="#6a35a8" strokeWidth="1.2" strokeLinejoin="round" /><circle cx="12" cy="13" r="1.4" fill="#e0384e" /></svg>
                    ) },
                    { id: 'winter', name: 'Winter', svg: (
                      <svg viewBox="0 0 24 24" className="h-6 w-6"><circle cx="12" cy="4" r="2" fill="#f5f5f5" /><path d="M3 16a9 9 0 0 1 18 0Z" fill="#e05a5a" /><rect x="2" y="15" width="20" height="4" rx="1.5" fill="#277a4a" /></svg>
                    ) },
                    { id: 'tuxedo', name: 'Tuxedo', svg: (
                      <svg viewBox="0 0 24 24" className="h-6 w-6"><rect x="2" y="17" width="20" height="3" rx="1" fill="#16161e" /><rect x="7" y="5" width="10" height="13" fill="#16161e" /><rect x="7" y="13" width="10" height="2.5" fill="#6a1a2a" /></svg>
                    ) },
                  ] as { id: string | null; name: string; svg: React.ReactNode }[]).map((o) => {
                    const sel = outfit === o.id
                    return (
                      <button
                        key={o.name}
                        onClick={() => { if (o.id === null || isPro) setOutfit(o.id); else window.location.href = '/upgrade' }}
                        className={cn('flex flex-col items-center gap-1.5 rounded-lg border py-3 transition-all relative', sel ? 'border-blue-500 bg-blue-600/10' : 'border-gray-800 hover:border-gray-600')}
                      >
                        {o.svg}
                        <span className="text-xs text-white flex items-center gap-1">{o.name}{sel && <Check className="h-3 w-3 text-blue-400" />}</span>
                        {o.id !== null && !isPro && <span className="absolute top-1.5 right-1.5 text-[8px] font-bold uppercase bg-yellow-400 text-gray-950 rounded px-1 leading-tight">Pro</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

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
                  { name: 'Grok 4',       color: 'bg-green-500/20 text-green-300 border-green-500/30' },
                ].map(m => (
                  <div key={m.name} className={cn('rounded-lg border px-3 py-2 text-center text-xs font-medium', m.color)}>{m.name}</div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">All 3 run in parallel and a 4th Claude call synthesizes a consensus answer.</p>
            </CardContent>
          </Card>

          {/* AI Experience Level */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-gray-400 uppercase tracking-wider font-semibold">
                  <Brain className="h-4 w-4 text-blue-400" />
                  AI Experience Level
                </span>
                {experienceSaving && <Loader2 className="h-3.5 w-3.5 text-gray-500 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-gray-500">Controls how Mr. Guy explains things to you across all AI features.</p>
              <div className="space-y-2">
                {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((level) => {
                  const Icon = EXPERIENCE_ICONS[level]
                  const selected = experienceLevel === level
                  return (
                    <button
                      key={level}
                      onClick={() => handleExperienceChange(level)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                        selected ? 'border-blue-500 bg-blue-600/10' : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                      )}
                    >
                      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', selected ? 'bg-blue-600/20' : 'bg-gray-800')}>
                        <Icon className={cn('h-4 w-4', selected ? 'text-blue-400' : 'text-gray-400')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-semibold', selected ? 'text-white' : 'text-gray-300')}>{EXPERIENCE_LABELS[level]}</p>
                        <p className="text-xs text-gray-500 truncate">{EXPERIENCE_DESCS[level]}</p>
                      </div>
                      {selected && <Check className="h-4 w-4 text-blue-400 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-gray-400 uppercase tracking-wider font-semibold">
                <Mail className="h-4 w-4 text-blue-400" />
                Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-gray-500">Questions, concerns, or feedback? We&apos;d love to hear from you.</p>
              <a
                href="mailto:support@mrguyinvests.com"
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                <Mail className="h-3.5 w-3.5" />
                support@mrguyinvests.com
              </a>
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN — Account · Subscription · Data & Privacy */}
        <div className="space-y-5 lg:space-y-6">

          {/* Account */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-gray-400 uppercase tracking-wider font-semibold">
                <User className="h-4 w-4 text-blue-400" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex justify-between py-2.5 border-b border-gray-800">
                <span className="text-sm text-gray-400">Email</span>
                <span className="text-sm text-gray-200">{session?.user?.email}</span>
              </div>

              {/* Username with edit */}
              <div className="py-2.5 border-b border-gray-800">
                {usernameEditing ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400 mb-1">Username</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={e => { setUsernameInput(e.target.value); setUsernameError('') }}
                        placeholder="3–20 chars, letters/numbers/_"
                        maxLength={20}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-base text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        onKeyDown={e => { if (e.key === 'Enter') handleUsernameSave(); if (e.key === 'Escape') { setUsernameEditing(false); setUsernameError('') } }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white border-0 px-3"
                        onClick={handleUsernameSave}
                        disabled={usernameSaving || !usernameInput.trim()}
                      >
                        {usernameSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                      </Button>
                      <button
                        onClick={() => { setUsernameEditing(false); setUsernameInput(''); setUsernameError('') }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {usernameError && <p className="text-xs text-red-400">{usernameError}</p>}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Username</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-200">{currentUsername || 'Not set'}</span>
                      <button
                        onClick={() => { setUsernameEditing(true); setUsernameInput(currentUsername || ''); setUsernameSuccess(false) }}
                        className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
                        title="Change username"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
                {usernameSuccess && <p className="text-xs text-green-400 mt-1">Username updated!</p>}
              </div>

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
                <p className="text-xs text-red-400 text-center">
                  {portalError}{' '}
                  <a href="mailto:support@mrguyinvests.com" className="underline">
                    support@mrguyinvests.com
                  </a>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-gray-400 uppercase tracking-wider font-semibold">
                <Shield className="h-4 w-4 text-green-400" />
                Data & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-xs text-gray-500">
              <p>• Account data stored securely in PostgreSQL</p>
              <p>• Stock data from third-party market data providers and public regulatory filings (SEC EDGAR)</p>
              <p>• AI analysis via Claude (Anthropic), DeepSeek, and xAI APIs</p>
              <p>• No data is sold or shared with third parties</p>
              <div className="flex gap-3 pt-2">
                <a href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</a>
                <a href="/terms" className="text-blue-400 hover:underline">Terms of Service</a>
              </div>
              <p className="pt-1 text-gray-600">For informational purposes only. Not financial advice.</p>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="border-red-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-red-400 uppercase tracking-wider font-semibold">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-gray-500">
                Permanently delete your account and all associated data — watchlist, portfolio, trade history, and alerts. This cannot be undone. Stripe billing records are retained as required by law.
              </p>
              {!deleteConfirm ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  onClick={() => setDeleteConfirm(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete My Account
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-red-400">Are you sure? This is permanent.</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-gray-400"
                      onClick={() => { setDeleteConfirm(false); setDeleteError('') }}
                      disabled={deleteLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Yes, delete everything'}
                    </Button>
                  </div>
                  {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
