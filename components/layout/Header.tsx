'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()

  // 首页隐藏 Header，让首页更像序章
  if (pathname === '/') return null

  return (
    <header className="fixed left-0 top-0 z-50 w-full">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-6 md:px-8 md:py-7">
        <Link
          href="/"
          className="site-nav text-[13px] text-[#C9C7C2] transition-colors duration-300 hover:text-white md:text-[14px]"
        >
          皓野
        </Link>

        <nav className="site-nav flex items-center gap-5 text-[12px] text-[#8E8C88] md:gap-6 md:text-[13px]">
          <Link
            href="/poems"
            className="transition-colors duration-300 hover:text-[#C9C7C2]"
          >
            诗
          </Link>
          <Link
            href="/images"
            className="transition-colors duration-300 hover:text-[#C9C7C2]"
          >
            影
          </Link>
          <Link
            href="/notes"
            className="transition-colors duration-300 hover:text-[#C9C7C2]"
          >
            与
          </Link>
          <Link
            href="/about"
            className="transition-colors duration-300 hover:text-[#C9C7C2]"
          >
            我
          </Link>
        </nav>
      </div>
    </header>
  )
}
