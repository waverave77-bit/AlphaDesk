'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Loader2, Check, X, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function UsernameHint({ username }: { username: string }) {
  if (!username) return null
  const tooShort = username.length < 3
  const tooLong = username.length > 20
  const badChars = !/^[a-zA-Z0-9_]+$/.test(username)
  const ok = !tooShort && !tooLong && !badChars

  if (ok) return <p className="text-xs text-green-500 flex items-center gap-1 mt-1"><Check className="h-3 w-3" /> Looks good</p>
  if (tooShort) return <p className="text-xs text-red-400 flex items-center gap-1 mt-1"><X className="h-3 w-3" /> At least 3 characters</p>
  if (tooLong) return <p className="text-xs text-red-400 flex items-center gap-1 mt-1"><X className="h-3 w-3" /> Max 20 characters</p>
  if (badChars) return <p className="text-xs text-red-400 flex items-center gap-1 mt-1"><X className="h-3 w-3" /> Letters, numbers, and underscores only</p>
  return null
}

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username.trim()) { setError('Please enter a username'); return }
    if (!form.email.trim()) { setError('Please enter your email'); return }
    if (!form.password) { setError('Please enter a password'); return }
    if (!form.confirm) { setError('Please confirm your password'); return }
    if (!agreedToTerms) { setError('Please agree to the Terms of Service and Privacy Policy'); return }
    if (form.username.length < 3) { setError('Username must be at least 3 characters'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) { setError('Username can only contain letters, numbers, and underscores'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }

    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, password: form.password, username: form.username }),
    })

    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Registration failed')
      setLoading(false)
      return
    }

    await signIn('credentials', { login: form.email, password: form.password, redirect: false })
    router.push('/dashboard')
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Create account</CardTitle>
        <CardDescription>Pick a username and get started for free</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              inputMode="text"
              placeholder="e.g. zain_trades"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              autoComplete="username"
            />
            <UsernameHint username={form.username} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={e => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-600 accent-blue-500 cursor-pointer shrink-0"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              I agree to the{' '}
              <Link href="/terms" className="text-blue-400 hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>.
              I confirm I am 13 years of age or older.
            </span>
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || !agreedToTerms}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Create Account
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  )
}
