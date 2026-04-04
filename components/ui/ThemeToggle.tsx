'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type ThemeMode = 'dark' | 'light'

const STORAGE_KEY = 'haoye-theme'

export default function ThemeToggle() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>('dark')

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    const nextTheme: ThemeMode = saved === 'light' ? 'light' : 'dark'

    setTheme(nextTheme)
    document.documentElement.dataset.theme = nextTheme
    setMounted(true)
  }, [])

  const applyTheme = (nextTheme: ThemeMode) => {
    setTheme(nextTheme)
    document.documentElement.dataset.theme = nextTheme
    window.localStorage.setItem(STORAGE_KEY, nextTheme)
  }

  const toggleTheme = () => {
    applyTheme(theme === 'dark' ? 'light' : 'dark')
  }

  if (!mounted || pathname === '/' || pathname === '') {
    return null
  }

  const isLight = theme === 'light'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? 'Switch to dark background' : 'Switch to light background'}
      title={isLight ? 'Switch to dark background' : 'Switch to light background'}
      className={
        isLight
          ? 'fixed right-5 top-[18px] z-[120] h-[26px] w-[46px] rounded-full bg-[#d9d9d4] ring-1 ring-black/55 transition-all duration-200 ease-out hover:scale-105 md:right-8 md:top-[20px] md:h-[28px] md:w-[48px]'
          : 'fixed right-5 top-[18px] z-[120] h-[26px] w-[46px] rounded-full bg-black ring-1 ring-white/80 transition-all duration-200 ease-out hover:scale-105 md:right-8 md:top-[20px] md:h-[28px] md:w-[48px]'
      }
      style={{ pointerEvents: 'auto' }}
    >
      <span
        className={
          isLight
            ? 'absolute left-[4px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-black transition-all duration-200 ease-out md:h-[20px] md:w-[20px]'
            : 'absolute left-[24px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white transition-all duration-200 ease-out md:left-[24px] md:h-[20px] md:w-[20px]'
        }
      />
    </button>
  )
}
