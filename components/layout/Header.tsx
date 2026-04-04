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
        <div
          className="flex items-center justify-between border-b pb-3 md:pb-[14px]"
          style={{
            borderColor: scrolled
              ? 'var(--site-border)'
              : 'color-mix(in srgb, var(--site-border) 78%, transparent)',
            background: 'transparent',
          }}
        >
          <Link
            href="/"
            onClick={skipIntroOnce}
            className="site-nav text-[13px] tracking-[0.22em] transition-opacity duration-300 hover:opacity-70 md:text-[14px]"
            style={{ color: 'var(--site-text-solid)' }}
          >
            皓野
          </Link>

          <div className="flex items-center gap-7 md:gap-10">
            <nav className="site-nav flex items-center gap-6 md:gap-8">
              {navItems.map((item) => {
                const active = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-[12px] tracking-[0.2em] transition-opacity duration-300 md:text-[13px]"
                    style={{
                      color: active
                        ? 'var(--site-text-solid)'
                        : 'var(--site-muted)',
                      opacity: active ? 1 : 0.94,
                    }}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-3 md:gap-4">
              <SoundToggle inline />
              <ThemeToggle inline />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
