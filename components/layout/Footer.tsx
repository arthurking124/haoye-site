'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()

  // 首页不显示 footer，避免破坏序章感
  if (pathname === '/' || pathname === '') return null

  return (
    <footer className="relative z-[20] border-t border-white/8">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-6 px-6 py-8 md:flex-row md:items-end md:justify-between md:px-10 md:py-10">
        <div>
          <p className="site-nav text-[11px] tracking-[0.22em] text-[#7F7D79]">
            PERSONAL DIGITAL SPACE
          </p>
          <p className="mt-3 text-[13px] leading-[1.9] text-[#8E8C88] md:text-[14px]">
            诗、图像，以及没有说完的沉默。
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          <div className="flex items-center gap-5">
            <Link
              href="/poems"
              className="site-nav text-[11px] text-[#8E8C88] transition-colors duration-300 hover:text-[#C9C7C2]"
            >
              诗
            </Link>
            <Link
              href="/images"
              className="site-nav text-[11px] text-[#8E8C88] transition-colors duration-300 hover:text-[#C9C7C2]"
            >
              影
            </Link>
            <Link
              href="/notes"
              className="site-nav text-[11px] text-[#8E8C88] transition-colors duration-300 hover:text-[#C9C7C2]"
            >
              与
            </Link>
            <Link
              href="/about"
              className="site-nav text-[11px] text-[#8E8C88] transition-colors duration-300 hover:text-[#C9C7C2]"
            >
              我
            </Link>
          </div>

          <p className="site-nav text-[10px] text-[#6F6D69] md:text-[11px]">
            haoye.cyou
          </p>
        </div>
      </div>
    </footer>
  )
}