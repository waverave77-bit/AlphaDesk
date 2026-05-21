'use client'
import { useEffect, useState } from 'react'

export function useIsPro() {
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/pro')
      .then(r => r.json())
      .then(d => setIsPro(d.isPro ?? false))
      .finally(() => setLoading(false))
  }, [])

  return { isPro, loading }
}
