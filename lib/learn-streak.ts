/** Eastern-Time date string "YYYY-MM-DD", with an optional day offset. */
export function etDateString(offsetDays = 0): string {
  const now = new Date()
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  et.setDate(et.getDate() + offsetDays)
  const y = et.getFullYear()
  const m = String(et.getMonth() + 1).padStart(2, '0')
  const d = String(et.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Given the user's stored streak state and "today", compute the new streak.
 * - same day  → unchanged (already learned today)
 * - yesterday → +1
 * - older/never → reset to 1
 */
export function nextStreak(currentStreak: number, lastLearnDate: string | null): number {
  const today = etDateString(0)
  const yesterday = etDateString(-1)
  if (lastLearnDate === today) return currentStreak || 1
  if (lastLearnDate === yesterday) return currentStreak + 1
  return 1
}
