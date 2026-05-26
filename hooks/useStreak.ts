'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

const STREAK_KEY    = 'zg_streak'
const LAST_VISIT_KEY = 'zg_last_visit'

export function useStreak() {
  const { data: session, status } = useSession()
  const [streak, setStreak] = useState(0)
  const [isNewDay, setIsNewDay] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

    if (status === 'authenticated' && session?.user) {
      // Logged-in: use DB values from session JWT
      const user = session.user as any
      const dbStreak     = user.loginStreak   ?? 0
      const lastDate     = user.lastStreakDate ?? null

      let newStreak = dbStreak

      if (!lastDate) {
        newStreak = 1
        setIsNewDay(true)
      } else if (lastDate === today) {
        // Already tracked today
        newStreak = dbStreak || 1
      } else {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().slice(0, 10)

        if (lastDate === yesterdayStr) {
          newStreak = dbStreak + 1
          setIsNewDay(true)
        } else {
          newStreak = 1
          setIsNewDay(true)
        }
      }

      setStreak(newStreak)

      // If the day changed, persist to DB (fire and forget) + localStorage cache
      if (lastDate !== today) {
        localStorage.setItem(STREAK_KEY, String(newStreak))
        localStorage.setItem(LAST_VISIT_KEY, today)
        fetch('/api/user/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loginStreak: newStreak, lastStreakDate: today }),
        }).catch(() => {})
      }
    } else {
      // Guest: use localStorage only
      const lastVisit    = localStorage.getItem(LAST_VISIT_KEY)
      const storedStreak = parseInt(localStorage.getItem(STREAK_KEY) ?? '0', 10)

      let newStreak = storedStreak

      if (!lastVisit) {
        newStreak = 1
        setIsNewDay(true)
      } else if (lastVisit === today) {
        newStreak = storedStreak || 1
      } else {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().slice(0, 10)

        if (lastVisit === yesterdayStr) {
          newStreak = storedStreak + 1
          setIsNewDay(true)
        } else {
          newStreak = 1
          setIsNewDay(true)
        }
      }

      localStorage.setItem(STREAK_KEY, String(newStreak))
      localStorage.setItem(LAST_VISIT_KEY, today)
      setStreak(newStreak)
    }
  }, [status, session?.user?.email])

  return { streak, isNewDay }
}
