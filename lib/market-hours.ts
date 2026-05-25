/**
 * Shared US equity market hours + holiday logic.
 * Used by market-brief API and anywhere else that needs to know if the market is open.
 */

export type MarketStatus = 'open' | 'pre' | 'after' | 'closed' | 'weekend' | 'holiday'

// ── Easter (Anonymous Gregorian algorithm) ────────────────────────────────────
function getEasterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

// nth weekday of a month — e.g. 3rd Monday of January
// weekday: 0=Sun, 1=Mon … 6=Sat | month: 1-based | n: 1-based
function getNthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month - 1, 1)
  const diff = (weekday - first.getDay() + 7) % 7
  return new Date(year, month - 1, 1 + diff + (n - 1) * 7)
}

// Last weekday in a month
function getLastWeekday(year: number, month: number, weekday: number): Date {
  const last = new Date(year, month, 0)
  const diff = (last.getDay() - weekday + 7) % 7
  return new Date(year, month - 1, last.getDate() - diff)
}

// 'YYYY-MM-DD' key for a local Date
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Weekend observance: Sat → prior Fri, Sun → next Mon
function observed(d: Date): Date {
  const dow = d.getDay()
  if (dow === 6) return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)
  if (dow === 0) return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  return d
}

/** Returns a map of { 'YYYY-MM-DD' → holiday name } for NYSE/NASDAQ holidays in a given year. */
export function getMarketHolidays(year: number): Map<string, string> {
  const h = new Map<string, string>()
  const add = (d: Date, name: string) => h.set(dateKey(observed(d)), name)

  // New Year's Day — Jan 1
  add(new Date(year, 0, 1), "New Year's Day")

  // MLK Day — 3rd Monday in January
  add(getNthWeekday(year, 1, 1, 3), 'MLK Day')

  // Presidents' Day — 3rd Monday in February
  add(getNthWeekday(year, 2, 1, 3), "Presidents' Day")

  // Good Friday — Friday before Easter (always a weekday, no observance shift needed)
  const easter = getEasterSunday(year)
  const goodFriday = new Date(easter)
  goodFriday.setDate(goodFriday.getDate() - 2)
  h.set(dateKey(goodFriday), 'Good Friday')

  // Memorial Day — last Monday in May
  add(getLastWeekday(year, 5, 1), 'Memorial Day')

  // Juneteenth — June 19
  add(new Date(year, 5, 19), 'Juneteenth')

  // Independence Day — July 4
  add(new Date(year, 6, 4), 'Independence Day')

  // Labor Day — 1st Monday in September
  add(getNthWeekday(year, 9, 1, 1), 'Labor Day')

  // Thanksgiving — 4th Thursday in November
  add(getNthWeekday(year, 11, 4, 4), 'Thanksgiving')

  // Christmas — Dec 25
  add(new Date(year, 11, 25), 'Christmas')

  return h
}

/** Returns the current NYSE/NASDAQ market status based on Eastern time + holidays. */
export function getMarketStatus(): {
  status: MarketStatus
  label: string
  dayName: string
} {
  const now = new Date()

  // Determine ET offset (rough DST: 2nd Sun of March → 1st Sun of November)
  const yr = now.getUTCFullYear()
  const dstStart = new Date(Date.UTC(yr, 2, 8))
  dstStart.setUTCDate(8 + ((7 - dstStart.getUTCDay()) % 7))
  const dstEnd = new Date(Date.UTC(yr, 10, 1))
  dstEnd.setUTCDate(1 + ((7 - dstEnd.getUTCDay()) % 7))
  const etOffset = now >= dstStart && now < dstEnd ? -4 : -5

  const etMs = now.getTime() + etOffset * 3600_000
  const et = new Date(etMs)
  const day = et.getUTCDay() // 0=Sun … 6=Sat
  const mins = et.getUTCHours() * 60 + et.getUTCMinutes()
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  // Weekend check first
  if (day === 0 || day === 6) {
    return { status: 'weekend', label: 'Weekend', dayName: dayNames[day] }
  }

  // Holiday check
  const mo = String(et.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(et.getUTCDate()).padStart(2, '0')
  const todayKey = `${et.getUTCFullYear()}-${mo}-${dd}`
  const holidays = getMarketHolidays(et.getUTCFullYear())
  const holidayName = holidays.get(todayKey)
  if (holidayName) {
    return { status: 'holiday', label: `Closed · ${holidayName}`, dayName: dayNames[day] }
  }

  // Trading hours (all times ET)
  if (mins >= 9 * 60 + 30 && mins < 16 * 60)  return { status: 'open',    label: 'Open',        dayName: dayNames[day] }
  if (mins >= 4 * 60       && mins < 9 * 60 + 30) return { status: 'pre',  label: 'Pre-Market',  dayName: dayNames[day] }
  if (mins >= 16 * 60      && mins < 20 * 60)  return { status: 'after',   label: 'After Hours', dayName: dayNames[day] }
  return { status: 'closed', label: 'Closed', dayName: dayNames[day] }
}
