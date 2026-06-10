'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export type ThemeId = 'default' | 'midnight' | 'emerald' | 'purple' | 'amber' | 'rose' | 'white'

export interface Theme {
  id: ThemeId
  name: string
  description: string
  accent: string
  accentRgb: string
  accentLightRgb: string
}

export const THEMES: Theme[] = [
  { id: 'default',  name: 'Ocean Blue',  description: 'Classic blue',      accent: 'bg-blue-500',    accentRgb: '59 130 246',  accentLightRgb: '96 165 250' },
  { id: 'midnight', name: 'Midnight',    description: 'Cool cyan',          accent: 'bg-cyan-400',    accentRgb: '34 211 238',  accentLightRgb: '103 232 249' },
  { id: 'emerald',  name: 'Emerald',     description: 'Money green',        accent: 'bg-emerald-500', accentRgb: '16 185 129',  accentLightRgb: '52 211 153' },
  { id: 'purple',   name: 'Purple Haze', description: 'Bold violet',        accent: 'bg-violet-500',  accentRgb: '139 92 246',  accentLightRgb: '167 139 250' },
  { id: 'amber',    name: 'Amber',       description: 'Warm gold',          accent: 'bg-amber-500',   accentRgb: '245 158 11',  accentLightRgb: '251 191 36' },
  { id: 'rose',     name: 'Rose',        description: 'Soft red/pink',      accent: 'bg-rose-500',    accentRgb: '244 63 94',   accentLightRgb: '251 113 133' },
  { id: 'white',    name: 'Light Mode',  description: 'Light background',   accent: 'bg-slate-400',   accentRgb: '59 130 246',  accentLightRgb: '96 165 250' },
]

const ACCENT_THEMES = THEMES.filter(t => t.id !== 'white')

interface ThemeContextType {
  themeId: ThemeId       // computed: isDark ? accentId : 'white'
  theme: Theme
  isDark: boolean
  accentId: ThemeId
  skin: string | null    // Pro-only light-mode repaint (mint/grape/sunset)
  outfit: string | null  // Pro-only Mr. Guy outfit (beanie/crown)
  setTheme: (id: ThemeId) => void   // legacy: 'white' = light, anything else = dark+accent
  setDark: (dark: boolean) => void
  setAccent: (id: ThemeId) => void
  setSkin: (s: string | null) => void
  setOutfit: (o: string | null) => void
}

const ThemeContext = createContext<ThemeContextType>({
  themeId: 'white', theme: THEMES.find(t => t.id === 'white')!, isDark: false,
  accentId: 'default', skin: null, outfit: null,
  setTheme: () => {}, setDark: () => {}, setAccent: () => {}, setSkin: () => {}, setOutfit: () => {},
})

function applyToDOM(isDark: boolean, accentId: ThemeId) {
  const accent = THEMES.find(t => t.id === accentId) ?? THEMES[0]
  const root = document.documentElement
  root.style.setProperty('--accent', accent.accentRgb)
  root.style.setProperty('--accent-light', accent.accentLightRgb)
  root.setAttribute('data-theme', isDark ? accentId : 'white')
  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

function saveDB(data: { themeDark?: boolean; themeAccent?: string }) {
  fetch('/api/user/preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {})
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [isDark, setIsDarkState] = useState(false)
  const [accentId, setAccentIdState] = useState<ThemeId>('default')
  const [skin, setSkinState] = useState<string | null>(null)
  const [outfit, setOutfitState] = useState<string | null>(null)

  // Step 1: Apply localStorage immediately on mount to prevent flash
  useEffect(() => {
    const savedDark   = localStorage.getItem('mrguy-dark') === 'true'
    const savedAccent = (localStorage.getItem('mrguy-accent') as ThemeId) || 'default'
    setIsDarkState(savedDark)
    setAccentIdState(savedAccent)
    applyToDOM(savedDark, savedAccent)
    // Pro skin is a light-mode-only repaint
    const savedSkin = localStorage.getItem('mrguy-skin')
    if (savedSkin && !savedDark) {
      setSkinState(savedSkin)
      document.documentElement.setAttribute('data-skin', savedSkin)
    }
    const savedOutfit = localStorage.getItem('mrguy-outfit')
    if (savedOutfit) setOutfitState(savedOutfit)
  }, [])

  // Step 2: Once authenticated, fetch the saved theme straight from the DB —
  // the source of truth. (The JWT/session copy is only refreshed at login, so
  // it goes stale the moment you change your theme; reading it here would
  // revert your choice on every refresh.)
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return
    let cancelled = false
    fetch('/api/user/preferences')
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (cancelled || !p) return
        const dbDark = p.themeDark ?? true
        const dbAccent = (p.themeAccent as ThemeId) ?? 'default'
        setIsDarkState(dbDark)
        setAccentIdState(dbAccent)
        applyToDOM(dbDark, dbAccent)
        localStorage.setItem('mrguy-dark', String(dbDark))
        localStorage.setItem('mrguy-accent', dbAccent)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [status, session?.user?.email])

  const setDark = (dark: boolean) => {
    setIsDarkState(dark)
    localStorage.setItem('mrguy-dark', String(dark))
    applyToDOM(dark, accentId)
    // Skins are light-only; switching to dark clears the active skin.
    if (dark && skin) {
      setSkinState(null)
      localStorage.removeItem('mrguy-skin')
      document.documentElement.removeAttribute('data-skin')
    }
    if (session?.user) saveDB({ themeDark: dark })
  }

  const setSkin = (s: string | null) => {
    setSkinState(s)
    if (s) {
      localStorage.setItem('mrguy-skin', s)
      document.documentElement.setAttribute('data-skin', s)
      if (isDark) setDark(false)   // a skin implies light mode
    } else {
      localStorage.removeItem('mrguy-skin')
      document.documentElement.removeAttribute('data-skin')
    }
  }

  const setOutfit = (o: string | null) => {
    setOutfitState(o)
    if (o) localStorage.setItem('mrguy-outfit', o)
    else localStorage.removeItem('mrguy-outfit')
  }

  const setAccent = (id: ThemeId) => {
    if (id === 'white') return  // 'white' is not an accent, it's a mode
    setAccentIdState(id)
    localStorage.setItem('mrguy-accent', id)
    applyToDOM(isDark, id)
    if (session?.user) saveDB({ themeAccent: id })
  }

  // Legacy: setTheme('white') = light mode; anything else = dark + set accent
  const setTheme = (id: ThemeId) => {
    if (id === 'white') {
      setDark(false)
    } else {
      setAccent(id)
      setDark(true)
    }
  }

  const themeId: ThemeId = isDark ? accentId : 'white'
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0]

  return (
    <ThemeContext.Provider value={{ themeId, theme, isDark, accentId, skin, outfit, setTheme, setDark, setAccent, setSkin, setOutfit }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

export { ACCENT_THEMES }
