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
    <header
      className={`fixed inset-x-0 top-0 z-[120] transition-all duration-500 ${
        scrolled
          ? 'border-b border-white/8 bg-[rgba(13,13,13,0.72)] backdrop-blur-xl'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-[68px] max-w-[1360px] items-center justify-between px-6 md:h-[76px] md:px-10">
        <Link
          href="/"
          className="site-nav text-[11px] tracking-[0.22em] text-[#C9C7C2] transition-colors duration-300 hover:text-[#F2F1EE] md:text-[12px]"
        >
          皓野
        </Link>

        <nav className="flex items-center gap-4 md:gap-8">
          {navItems.map((item) => {
            const active = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`site-nav relative text-[11px] transition-colors duration-300 md:text-[12px] ${
                  active
                    ? 'text-[#F2F1EE]'
                    : 'text-[#8E8C88] hover:text-[#C9C7C2]'
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`absolute left-1/2 top-[calc(100%+8px)] h-[1px] -translate-x-1/2 bg-white/40 transition-all duration-500 ${
                    active ? 'w-4 opacity-100' : 'w-0 opacity-0'
                  }`}
                />
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}