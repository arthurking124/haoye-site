'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

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
      setScrolled(window.scrollY > 16)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!mounted) return null

  // 首页保持纯净，不显示顶部导航
  if (pathname === '/' || pathname === '') return null

  return (
    <header className="fixed inset-x-0 top-0 z-[80] px-5 pt-5 md:px-8 md:pt-6">
      <div
        className="mx-auto flex max-w-[1400px] items-center justify-between rounded-full border px-5 py-3 backdrop-blur-md transition-all duration-300 md:px-6"
        style={{
          background: scrolled
            ? 'rgba(var(--site-surface-rgb), 0.82)'
            : 'rgba(var(--site-surface-rgb), 0.58)',
          borderColor: 'var(--site-border)',
          boxShadow: scrolled
            ? '0 10px 28px rgba(0, 0, 0, 0.12)'
            : '0 0 0 rgba(0, 0, 0, 0)',
        }}
      >
        <Link
          href="/"
          onClick={skipIntroOnce}
          className="site-nav text-[13px] tracking-[0.22em] transition-opacity duration-300 hover:opacity-75 md:text-[14px]"
          style={{ color: 'var(--site-text-solid)' }}
        >
          皓野
        </Link>

        <nav className="site-nav flex items-center gap-5 md:gap-7">
          {navItems.map((item) => {
            const active = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className="text-[12px] tracking-[0.2em] transition-colors duration-300 md:text-[13px]"
                style={{
                  color: active
                    ? 'var(--site-text-solid)'
                    : 'var(--site-muted)',
                  opacity: active ? 1 : 0.92,
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.color =
                    'var(--site-text-solid)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.color = active
                    ? 'var(--site-text-solid)'
                    : 'var(--site-muted)'
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
