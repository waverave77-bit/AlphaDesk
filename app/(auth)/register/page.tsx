'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Loader2, Check, X } from 'lucide-react'
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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (form.username.length < 3) { setError('Username must be at least 3 characters'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) { setError('Username can only contain letters, numbers, and underscores'); return }

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

    await signIn('credentials', { login: form.username, password: form.password, redirect: false })
    router.push('/')
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
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="••••••••"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
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
