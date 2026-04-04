'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import SoundToggle from '@/components/ui/SoundToggle'
import ThemeToggle from '@/components/ui/ThemeToggle'

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

export default function Header() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 18)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!mounted) return null
  if (pathname === '/' || pathname === '') return null

  return (
    <header className="fixed inset-x-0 top-0 z-[90]">
      <div className="mx-auto max-w-[1440px] px-5 pt-5 md:px-8 md:pt-6">
        <div className="group relative flex items-center justify-between pb-3 md:pb-[14px]">
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--site-text-solid) 18%, transparent) 12%, color-mix(in srgb, var(--site-text-solid) 38%, transparent) 50%, color-mix(in srgb, var(--site-text-solid) 18%, transparent) 88%, transparent 100%)',
            }}
          />

          <Link
            href="/"
            onClick={skipIntroOnce}
            className="site-nav text-[13px] tracking-[0.22em] transition-all duration-300 hover:opacity-72 md:text-[14px]"
            style={{ color: 'var(--site-text-solid)' }}
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
                    className="group/item relative pb-[2px] text-[12px] tracking-[0.2em] transition-all duration-300 md:text-[13px]"
                    style={{
                      color: active
                        ? 'var(--site-text-solid)'
                        : 'var(--site-muted)',
                      opacity: active ? 1 : 0.96,
                    }}
                  >
                    <span className="transition-all duration-300 group-hover/item:opacity-100 group-hover/item:text-[var(--site-text-solid)]">
                      {item.label}
                    </span>

                    <span
                      className="pointer-events-none absolute bottom-[-7px] left-1/2 h-px -translate-x-1/2 transition-all duration-300"
                      style={{
                        width: active ? '100%' : '0%',
                        background: 'var(--site-text-solid)',
                        opacity: active ? 0.82 : 0,
                      }}
                    />

                    <span className="pointer-events-none absolute bottom-[-7px] left-1/2 h-px w-0 -translate-x-1/2 bg-[var(--site-text-solid)] opacity-0 transition-all duration-300 group-hover/item:w-full group-hover/item:opacity-70" />
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
