'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { AccentColor } from '@/types'
import { getThemeColors } from '@/lib/utils'

type ThemeColors = ReturnType<typeof getThemeColors>

interface ThemeContextType {
  darkMode: boolean
  setDarkMode: (value: boolean) => void
  accentColor: AccentColor
  setAccentColor: (value: AccentColor) => void
  theme: ThemeColors
}

// Provide default values so context is never null
const defaultTheme = getThemeColors(true, 'purple')

const ThemeContext = createContext<ThemeContextType>({
  darkMode: true,
  setDarkMode: () => {},
  accentColor: 'purple',
  setAccentColor: () => {},
  theme: defaultTheme,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkModeState] = useState(true)
  const [accentColor, setAccentColorState] = useState<AccentColor>('purple')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('watchr-dark-mode')
    if (stored !== null) {
      setDarkModeState(stored === 'true')
    } else {
      setDarkModeState(window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    
    const storedAccent = localStorage.getItem('watchr-accent-color')
    if (storedAccent) {
      setAccentColorState(storedAccent as AccentColor)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('watchr-dark-mode', String(darkMode))
  }, [darkMode, mounted])

  const setDarkMode = (value: boolean) => {
    setDarkModeState(value)
  }

  const setAccentColor = (value: AccentColor) => {
    setAccentColorState(value)
    localStorage.setItem('watchr-accent-color', value)
  }

  const theme = getThemeColors(darkMode, accentColor)

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, accentColor, setAccentColor, theme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}