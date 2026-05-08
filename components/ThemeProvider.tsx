'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeId = 'default' | 'midnight' | 'emerald' | 'purple' | 'amber' | 'rose'

export interface Theme {
  id: ThemeId
  name: string
  description: string
  accent: string        // Tailwind class for preview dot
  cssVars: Record<string, string>
}

export const THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Ocean Blue',
    description: 'Classic blue — the default',
    accent: 'bg-blue-500',
    cssVars: {
      '--accent': '59 130 246',       // blue-500
      '--accent-light': '96 165 250', // blue-400
      '--accent-bg': '59 130 246',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Cool cyan on near-black',
    accent: 'bg-cyan-400',
    cssVars: {
      '--accent': '34 211 238',
      '--accent-light': '103 232 249',
      '--accent-bg': '34 211 238',
    },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    description: 'Money green vibes',
    accent: 'bg-emerald-500',
    cssVars: {
      '--accent': '16 185 129',
      '--accent-light': '52 211 153',
      '--accent-bg': '16 185 129',
    },
  },
  {
    id: 'purple',
    name: 'Purple Haze',
    description: 'Bold violet accent',
    accent: 'bg-violet-500',
    cssVars: {
      '--accent': '139 92 246',
      '--accent-light': '167 139 250',
      '--accent-bg': '139 92 246',
    },
  },
  {
    id: 'amber',
    name: 'Amber',
    description: 'Warm gold tones',
    accent: 'bg-amber-500',
    cssVars: {
      '--accent': '245 158 11',
      '--accent-light': '251 191 36',
      '--accent-bg': '245 158 11',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Soft red/pink accent',
    accent: 'bg-rose-500',
    cssVars: {
      '--accent': '244 63 94',
      '--accent-light': '251 113 133',
      '--accent-bg': '244 63 94',
    },
  },
]

interface ThemeContextType {
  themeId: ThemeId
  setTheme: (id: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextType>({ themeId: 'default', setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>('default')

  useEffect(() => {
    const saved = localStorage.getItem('alphadesk-theme') as ThemeId | null
    if (saved) applyTheme(saved)
  }, [])

  function applyTheme(id: ThemeId) {
    const theme = THEMES.find(t => t.id === id) ?? THEMES[0]
    const root = document.documentElement
    Object.entries(theme.cssVars).forEach(([key, val]) => root.style.setProperty(key, val))
    setThemeId(id)
    localStorage.setItem('alphadesk-theme', id)
  }

  return (
    <ThemeContext.Provider value={{ themeId, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
