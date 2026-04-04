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
          ? 'fixed right-3 top-[20px] z-[120] h-[22px] w-[38px] rounded-full bg-[#d9d9d4] ring-1 ring-black/55 transition-all duration-200 ease-out hover:scale-105 md:right-5 md:top-[22px] md:h-[24px] md:w-[40px]'
          : 'fixed right-3 top-[20px] z-[120] h-[22px] w-[38px] rounded-full bg-black ring-1 ring-white/80 transition-all duration-200 ease-out hover:scale-105 md:right-5 md:top-[22px] md:h-[24px] md:w-[40px]'
      }
      style={{ pointerEvents: 'auto' }}
    >
      <span
        className={
          isLight
            ? 'absolute left-[3px] top-1/2 h-[16px] w-[16px] -translate-y-1/2 rounded-full bg-black transition-all duration-200 ease-out md:h-[18px] md:w-[18px]'
            : 'absolute left-[19px] top-1/2 h-[16px] w-[16px] -translate-y-1/2 rounded-full bg-white transition-all duration-200 ease-out md:left-[19px] md:h-[18px] md:w-[18px]'
        }
      />
    </button>
  )
}
