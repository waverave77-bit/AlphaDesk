'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeId = 'default' | 'midnight' | 'emerald' | 'purple' | 'amber' | 'rose' | 'white'

export interface Theme {
  id: ThemeId
  name: string
  description: string
  accent: string        // tailwind class for preview dot
  accentRgb: string     // "R G B" for CSS variable
  accentLightRgb: string
}

export const THEMES: Theme[] = [
  { id: 'default',  name: 'Ocean Blue',   description: 'Classic blue — the default', accent: 'bg-blue-500',    accentRgb: '59 130 246',  accentLightRgb: '96 165 250' },
  { id: 'midnight', name: 'Midnight',      description: 'Cool cyan on near-black',    accent: 'bg-cyan-400',    accentRgb: '34 211 238',  accentLightRgb: '103 232 249' },
  { id: 'emerald',  name: 'Emerald',       description: 'Money green vibes',          accent: 'bg-emerald-500', accentRgb: '16 185 129',  accentLightRgb: '52 211 153' },
  { id: 'purple',   name: 'Purple Haze',   description: 'Bold violet accent',         accent: 'bg-violet-500',  accentRgb: '139 92 246',  accentLightRgb: '167 139 250' },
  { id: 'amber',    name: 'Amber',         description: 'Warm gold tones',            accent: 'bg-amber-500',   accentRgb: '245 158 11',  accentLightRgb: '251 191 36' },
  { id: 'rose',     name: 'Rose',          description: 'Soft red/pink accent',       accent: 'bg-rose-500',    accentRgb: '244 63 94',   accentLightRgb: '251 113 133' },
  { id: 'white',    name: 'Light Mode',    description: 'Clean white background',     accent: 'bg-slate-800',   accentRgb: '59 130 246',  accentLightRgb: '96 165 250' },
]

interface ThemeContextType {
  themeId: ThemeId
  theme: Theme
  setTheme: (id: ThemeId) => void
}

const defaultTheme = THEMES[0]
const ThemeContext = createContext<ThemeContextType>({ themeId: 'default', theme: defaultTheme, setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>('default')

  useEffect(() => {
    const saved = localStorage.getItem('alphadesk-theme') as ThemeId | null
    if (saved) applyTheme(saved)
  }, [])

  function applyTheme(id: ThemeId) {
    const theme = THEMES.find(t => t.id === id) ?? THEMES[0]
    const root = document.documentElement

    // Set CSS variables for accent colors
    root.style.setProperty('--accent', theme.accentRgb)
    root.style.setProperty('--accent-light', theme.accentLightRgb)

    // Set data-theme for CSS class overrides (light mode etc)
    root.setAttribute('data-theme', id)

    setThemeId(id)
    localStorage.setItem('alphadesk-theme', id)
  }

  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0]

  return (
    <ThemeContext.Provider value={{ themeId, theme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
