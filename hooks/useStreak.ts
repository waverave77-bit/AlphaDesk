'use client'
import { useEffect, useState } from 'react'

const STREAK_KEY = 'zg_streak'
const LAST_VISIT_KEY = 'zg_last_visit'

export function useStreak() {
  const [streak, setStreak] = useState(0)
  const [isNewDay, setIsNewDay] = useState(false)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY)
    const storedStreak = parseInt(localStorage.getItem(STREAK_KEY) ?? '0', 10)

    let newStreak = storedStreak

    if (!lastVisit) {
      // First ever visit
      newStreak = 1
      setIsNewDay(true)
    } else if (lastVisit === today) {
      // Already visited today — keep streak
      newStreak = storedStreak || 1
    } else {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().slice(0, 10)

      if (lastVisit === yesterdayStr) {
        // Visited yesterday — increment
        newStreak = storedStreak + 1
        setIsNewDay(true)
      } else {
        // Missed a day — reset
        newStreak = 1
        setIsNewDay(true)
      }
    }

    localStorage.setItem(STREAK_KEY, String(newStreak))
    localStorage.setItem(LAST_VISIT_KEY, today)
    setStreak(newStreak)
  }, [])

  return { streak, isNewDay }
}
