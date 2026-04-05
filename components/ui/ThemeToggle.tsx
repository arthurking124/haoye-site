'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type ThemeMode = 'dark' | 'light'

const STORAGE_KEY = 'haoye-theme'
export const THEME_EVENT = 'haoye-theme-change'

type ThemeToggleProps = {
  inline?: boolean
}

export default function ThemeToggle({ inline = false }: ThemeToggleProps) {
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
    window.dispatchEvent(
      new CustomEvent(THEME_EVENT, {
        detail: nextTheme,
      })
    )
  }

  const toggleTheme = () => {
    applyTheme(theme === 'dark' ? 'light' : 'dark')
  }

  if (!mounted || pathname === '/' || pathname === '') {
    return null
  }

  if (inline) {
    const isLight = theme === 'light'

    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isLight ? 'Switch to dark background' : 'Switch to light background'}
        title={isLight ? 'Switch to dark background' : 'Switch to light background'}
        className="relative h-[18px] w-[34px] rounded-full border transition-transform duration-200 ease-out hover:scale-105"
        style={{
          background: isLight ? '#d9d9d4' : '#050505',
          borderColor: isLight ? 'rgba(17,17,17,0.48)' : 'rgba(255,255,255,0.72)',
        }}
      >
        <span
          className="absolute top-1/2 h-[14px] w-[14px] -translate-y-1/2 rounded-full transition-all duration-200 ease-out"
          style={{
            left: isLight ? '16px' : '2px',
            background: isLight ? '#111111' : '#f2f1ee',
            boxShadow: isLight
              ? '0 0 0 1px rgba(17,17,17,0.08)'
              : '0 0 0 1px rgba(255,255,255,0.06)',
          }}
        />
      </button>
    )
  }

  const isLight = theme === 'light'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? 'Switch to dark background' : 'Switch to light background'}
      title={isLight ? 'Switch to dark background' : 'Switch to light background'}
      className="fixed right-4 top-5 z-[120] h-[18px] w-[34px] rounded-full border transition-transform duration-200 ease-out hover:scale-105 md:right-6 md:top-6"
      style={{
        background: isLight ? '#d9d9d4' : '#050505',
        borderColor: isLight ? 'rgba(17,17,17,0.48)' : 'rgba(255,255,255,0.72)',
      }}
    >
      <span
        className="absolute top-1/2 h-[14px] w-[14px] -translate-y-1/2 rounded-full transition-all duration-200 ease-out"
        style={{
          left: isLight ? '16px' : '2px',
          background: isLight ? '#111111' : '#f2f1ee',
          boxShadow: isLight
            ? '0 0 0 1px rgba(17,17,17,0.08)'
            : '0 0 0 1px rgba(255,255,255,0.06)',
        }}
      />
    </button>
  )
}