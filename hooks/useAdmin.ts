'use client'
import { useEffect, useState } from 'react'

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.isAdmin ?? false))
      .finally(() => setLoading(false))
  }, [])

  return { isAdmin, loading }
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/flags')
      .then((r) => r.json())
      .then(setFlags)
      .finally(() => setLoading(false))
  }, [])

  return { flags, loading }
}
