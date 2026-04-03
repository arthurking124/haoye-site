'use client'

import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()

  // 首页不显示 footer，避免破坏四屏序章
  if (pathname === '/' || pathname === '') return null

  return (
    <footer className="relative z-[20] border-t border-white/8">
      <div className="mx-auto max-w-[1360px] px-6 py-8 md:px-10 md:py-10">
        <p className="text-center text-[13px] leading-[1.9] text-[#8E8C88] md:text-[14px]">
          生活有留白，灵魂自有回音。
        </p>
      </div>
    </footer>
  )
}