'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

// Two looks only now: the arcade light theme (cream) and a dark theme. The old
// per-accent colour picker (Ocean Blue / Midnight / Emerald / …) was removed — the
// brand is one consistent blue. Pro "skins" (mint/grape/sunset) still repaint the
// light theme via data-skin, and outfits dress up Mr. Guy.
export type ThemeId = 'default' | 'white'

interface ThemeContextType {
  themeId: ThemeId       // 'white' = light, 'default' = dark
  isDark: boolean
  skin: string | null    // Pro-only light-mode repaint (mint/grape/sunset)
  outfit: string | null  // Pro-only Mr. Guy outfit (royal/winter/tuxedo)
  setTheme: (id: ThemeId) => void   // 'white' = light, anything else = dark
  setDark: (dark: boolean) => void
  setSkin: (s: string | null) => void
  setOutfit: (o: string | null) => void
}

const ThemeContext = createContext<ThemeContextType>({
  themeId: 'white', isDark: false, skin: null, outfit: null,
  setTheme: () => {}, setDark: () => {}, setSkin: () => {}, setOutfit: () => {},
})

function applyToDOM(isDark: boolean, skin: string | null) {
  const root = document.documentElement
  // data-theme drives the light/dark CSS in globals.css. --accent stays at the
  // :root blue default for everyone (no per-user accent anymore).
  root.setAttribute('data-theme', isDark ? 'default' : 'white')
  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  // A Pro skin is a light-mode-only repaint. We keep the saved skin even while in
  // dark mode (just don't apply it) so it comes back when you return to light.
  if (!isDark && skin) {
    root.setAttribute('data-skin', skin)
  } else {
    root.removeAttribute('data-skin')
  }
}

function saveDB(data: { themeDark?: boolean }) {
  fetch('/api/user/preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {})
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [isDark, setIsDarkState] = useState(false)
  const [skin, setSkinState] = useState<string | null>(null)
  const [outfit, setOutfitState] = useState<string | null>(null)

  // Step 1: Apply localStorage immediately on mount to prevent flash
  useEffect(() => {
    const savedDark = localStorage.getItem('mrguy-dark') === 'true'
    const savedSkin = localStorage.getItem('mrguy-skin')
    setIsDarkState(savedDark)
    setSkinState(savedSkin)
    applyToDOM(savedDark, savedSkin)
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
        setIsDarkState(dbDark)
        applyToDOM(dbDark, localStorage.getItem('mrguy-skin'))
        localStorage.setItem('mrguy-dark', String(dbDark))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [status, session?.user?.email])

  const setDark = (dark: boolean) => {
    setIsDarkState(dark)
    localStorage.setItem('mrguy-dark', String(dark))
    // Keep the saved skin — applyToDOM hides it in dark mode and brings it back in
    // light, so toggling dark on/off restores the skin you had instead of resetting.
    applyToDOM(dark, skin)
    if (session?.user) saveDB({ themeDark: dark })
  }

  const setSkin = (s: string | null) => {
    setSkinState(s)
    if (s) localStorage.setItem('mrguy-skin', s)
    else localStorage.removeItem('mrguy-skin')
    // A skin implies light mode; switching to it also turns dark off.
    const nextDark = s ? false : isDark
    if (s && isDark) {
      setIsDarkState(false)
      localStorage.setItem('mrguy-dark', 'false')
      if (session?.user) saveDB({ themeDark: false })
    }
    applyToDOM(nextDark, s)
  }

  const setOutfit = (o: string | null) => {
    setOutfitState(o)
    if (o) localStorage.setItem('mrguy-outfit', o)
    else localStorage.removeItem('mrguy-outfit')
  }

  // 'white' = light mode; anything else = dark.
  const setTheme = (id: ThemeId) => setDark(id !== 'white')

  const themeId: ThemeId = isDark ? 'default' : 'white'

  return (
    <ThemeContext.Provider value={{ themeId, isDark, skin, outfit, setTheme, setDark, setSkin, setOutfit }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
