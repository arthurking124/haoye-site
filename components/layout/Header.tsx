'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/poems', label: '诗' },
  { href: '/images', label: '影' },
  { href: '/notes', label: '与' },
  { href: '/about', label: '我' },
]

export default function Header() {
  const pathname = usePathname()
  const isHome = pathname === '/' || pathname === ''

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[90] transition-all duration-500 ${
        isHome ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
    >
      <div className="mx-auto max-w-[1360px] px-6 py-6 md:px-10 md:py-8">
        <div className="flex items-center justify-between">
          <div
            className={`transition-opacity duration-500 ${
              isHome ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <Link
              href="/"
              className="site-nav text-[12px] tracking-[0.12em] text-[#8A8782] transition-colors duration-300 hover:text-[#BDB9B2] md:text-[13px]"
            >
              皓野
            </Link>
          </div>

          <nav
            className={`flex items-center gap-5 md:gap-7 transition-opacity duration-500 ${
              isHome ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`site-nav text-[12px] tracking-[0.1em] transition-colors duration-300 md:text-[13px] ${
                    active
                      ? 'text-[#C8C3BC]'
                      : 'text-[#7E7B76] hover:text-[#B6B1AA]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}