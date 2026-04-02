'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()

  // 首页不显示 footer，避免破坏序章感
  if (pathname === '/' || pathname === '') return null

  return (
    <footer className="relative z-[20] border-t border-white/8">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between px-6 py-6 md:px-10 md:py-8">
        <Link
          href="/"
          className="site-nav text-[11px] tracking-[0.18em] text-[#8E8C88] transition-colors duration-300 hover:text-[#C9C7C2]"
        >
          皓野
        </Link>

        <p className="site-nav text-[10px] tracking-[0.18em] text-[#6F6D69] md:text-[11px]">
          haoye.cyou
        </p>
      </div>
    </footer>
  )
}