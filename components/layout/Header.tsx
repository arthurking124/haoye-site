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
  const [scrolled, setScrolled] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>('dark')

  useEffect(() => {
    setMounted(true)

    const saved = window.localStorage.getItem(STORAGE_KEY)
    setTheme(saved === 'light' ? 'light' : 'dark')
  }, [])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 18)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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

  const shellStyle = isLight
    ? {
        background: scrolled ? 'rgba(248,245,238,0.68)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
      }
    : {
        background: scrolled ? 'rgba(13,13,13,0.34)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }

  const lineStyle = isLight
    ? {
        background:
          'linear-gradient(90deg, transparent 0%, rgba(56,47,37,0.04) 18%, rgba(56,47,37,0.08) 50%, rgba(56,47,37,0.04) 82%, transparent 100%)',
      }
    : {
        background:
          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 18%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.08) 82%, transparent 100%)',
      }

  const brandStyle = isLight
    ? {
        color: 'var(--site-text-solid)',
        opacity: 0.82,
        letterSpacing: '0.22em',
        transition: 'opacity 240ms ease, color 240ms ease, letter-spacing 240ms ease',
      }
    : {
        color: 'var(--site-text-solid)',
        opacity: 0.96,
        letterSpacing: '0.2em',
        transition: 'opacity 240ms ease, color 240ms ease, letter-spacing 240ms ease',
      }

  const getNavStyle = (active: boolean) => {
    if (isLight) {
      return {
        color: active ? 'var(--site-text-solid)' : 'var(--site-dim)',
        opacity: active ? 0.88 : 0.66,
        letterSpacing: active ? '0.22em' : '0.18em',
        transition:
          'opacity 220ms ease, color 220ms ease, letter-spacing 220ms ease, filter 220ms ease',
      } as const
    }

    return {
      color: active ? 'var(--site-text-solid)' : 'var(--site-muted)',
      opacity: active ? 1 : 0.92,
      letterSpacing: '0.18em',
      transition:
        'opacity 220ms ease, color 220ms ease, letter-spacing 220ms ease, filter 220ms ease',
    } as const
  }

  const getHoverTraceStyle = (active: boolean) => {
    if (isLight) {
      return {
        width: active ? '100%' : '0%',
        opacity: active ? 0.3 : 0,
        background:
          'linear-gradient(90deg, transparent 0%, rgba(179,164,139,0.20) 24%, rgba(179,164,139,0.42) 50%, rgba(179,164,139,0.20) 76%, transparent 100%)',
      } as const
    }

    return {
      width: active ? '100%' : '0%',
      opacity: active ? 0.82 : 0,
      background: 'var(--site-text-solid)',
    } as const
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
            className="site-nav text-[13px] hover:opacity-72 md:text-[14px]"
            style={brandStyle}
          >
            皓野
          </Link>

          <div className="flex items-center gap-8 md:gap-10">
            <nav className="site-nav flex items-center gap-6 md:gap-8">
              {navItems.map((item) => {
                const active = pathname === item.href

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
                      style={getHoverTraceStyle(active)}
                    />

                    <span
                      className="pointer-events-none absolute bottom-[-7px] left-1/2 h-px -translate-x-1/2 opacity-0 transition-all duration-300 group-hover/item:opacity-100"
                      style={
                        isLight
                          ? {
                              width: '100%',
                              background:
                                'linear-gradient(90deg, transparent 0%, rgba(179,164,139,0.14) 24%, rgba(179,164,139,0.30) 50%, rgba(179,164,139,0.14) 76%, transparent 100%)',
                            }
                          : {
                              width: '100%',
                              background: 'var(--site-text-solid)',
                            }
                      }
                    />
                  </Link>
                )
              })}
            </nav>

            <div className="flex translate-x-[6px] items-center gap-4 md:translate-x-[10px] md:gap-[18px]">
              <SoundToggle inline />
              <ThemeToggle inline />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}