'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import SoundToggle from '@/components/ui/SoundToggle'
import ThemeToggle, { THEME_EVENT } from '@/components/ui/ThemeToggle'

const STORAGE_KEY = 'haoye-theme'

const navItems = [
  { href: '/poems', label: '诗' },
  { href: '/images', label: '影' },
  { href: '/notes', label: '与' },
  { href: '/about', label: '我' },
]

function skipIntroOnce() {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem('haoye-skip-intro-once', '1')
}

type ThemeMode = 'dark' | 'light'

export default function Header() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>('dark')

  useEffect(() => {
    setMounted(true)

    const saved = window.localStorage.getItem(STORAGE_KEY)
    setTheme(saved === 'light' ? 'light' : 'dark')
  }, [])

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<ThemeMode>
      if (customEvent.detail === 'light' || customEvent.detail === 'dark') {
        setTheme(customEvent.detail)
      }
    }

    window.addEventListener(THEME_EVENT, handleThemeChange as EventListener)

    return () => {
      window.removeEventListener(THEME_EVENT, handleThemeChange as EventListener)
    }
  }, [])

  if (!mounted) return null
  if (pathname === '/' || pathname === '') return null

  const isLight = theme === 'light'

  // 🚀 核心修复：彻底抛弃滚动变色逻辑，强制保持绝对透明，不再遮挡底层水流！
  const shellStyle = {
    background: 'transparent',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    boxShadow: 'none',
  }

  const lineStyle = isLight
    ? {
        background:
          'linear-gradient(90deg, transparent 0%, rgba(39,35,29,0.03) 18%, rgba(39,35,29,0.07) 50%, rgba(39,35,29,0.03) 82%, transparent 100%)',
      }
    : {
        background:
          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 18%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.08) 82%, transparent 100%)',
      }

  const brandStyle = isLight
    ? {
        color: 'var(--site-text-solid)',
        opacity: 0.84,
        letterSpacing: '0.24em',
        transition:
          'opacity 240ms ease, color 240ms ease, letter-spacing 240ms ease, transform 240ms ease',
      }
    : {
        color: 'var(--site-text-solid)',
        opacity: 0.96,
        letterSpacing: '0.2em',
        transition:
          'opacity 240ms ease, color 240ms ease, letter-spacing 240ms ease, transform 240ms ease',
      }

  const getNavStyle = (active: boolean) => {
    if (isLight) {
      return {
        color: active ? 'var(--site-text-solid)' : 'var(--site-soft)',
        opacity: active ? 0.94 : 0.72,
        letterSpacing: active ? '0.22em' : '0.18em',
        transition:
          'opacity 220ms ease, color 220ms ease, letter-spacing 220ms ease, filter 220ms ease, transform 220ms ease',
      } as const
    }

    return {
      color: active ? 'var(--site-text-solid)' : 'var(--site-muted)',
      opacity: active ? 1 : 0.92,
      letterSpacing: '0.18em',
      transition:
        'opacity 220ms ease, color 220ms ease, letter-spacing 220ms ease, filter 220ms ease, transform 220ms ease',
    } as const
  }

  const getActiveTraceStyle = (active: boolean) => {
    if (isLight) {
      return {
        width: active ? '72%' : '0%',
        opacity: active ? 0.82 : 0,
        background:
          'linear-gradient(90deg, rgba(181,155,121,0) 0%, rgba(181,155,121,0.32) 20%, rgba(181,155,121,0.78) 50%, rgba(181,155,121,0.32) 80%, rgba(181,155,121,0) 100%)',
      } as const
    }

    return {
      width: active ? '72%' : '0%',
      opacity: active ? 0.82 : 0,
      background: 'var(--site-text-solid)',
    } as const
  }

  const getHoverTraceStyle = () => {
    if (isLight) {
      return {
        width: '72%',
        background:
          'linear-gradient(90deg, rgba(181,155,121,0) 0%, rgba(181,155,121,0.18) 22%, rgba(181,155,121,0.42) 50%, rgba(181,155,121,0.18) 78%, rgba(181,155,121,0) 100%)',
      } as const
    }

    return {
      width: '72%',
      background: 'var(--site-text-solid)',
    } as const
  }

  const isActivePath = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <header className="fixed inset-x-0 top-0 z-[90]" style={shellStyle}>
      <div className="mx-auto max-w-[1440px] px-5 pt-5 md:px-8 md:pt-6">
        <div className="group relative flex items-center justify-between pb-3 md:pb-[14px]">
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
            style={lineStyle}
          />

          <Link
            href="/"
            onClick={skipIntroOnce}
            className="site-nav text-[13px] hover:opacity-90 md:text-[14px]"
            style={brandStyle}
          >
            皓野
          </Link>

          <div className="flex items-center gap-7 md:gap-10">
            <nav className="site-nav flex items-center gap-5 md:gap-8">
              {navItems.map((item) => {
                const active = isActivePath(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group/item relative pb-[2px] text-[12px] md:text-[13px]"
                    style={getNavStyle(active)}
                  >
                    {item.label}

                    <span
                      className="pointer-events-none absolute bottom-[-7px] left-1/2 h-px -translate-x-1/2 transition-all duration-300"
                      style={getActiveTraceStyle(active)}
                    />

                    <span
                      className="pointer-events-none absolute bottom-[-7px] left-1/2 h-px -translate-x-1/2 opacity-0 transition-all duration-300 group-hover/item:opacity-100"
                      style={getHoverTraceStyle()}
                    />
                  </Link>
                )
              })}
            </nav>

            <div className="flex translate-x-[4px] items-center gap-4 md:translate-x-[8px] md:gap-[18px]">
              <SoundToggle inline />
              <ThemeToggle inline />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}