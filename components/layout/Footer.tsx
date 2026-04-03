'use client'

import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  const isHome = pathname === '/' || pathname === ''

  if (isHome) return null

  return (
    <footer className="relative z-[20] border-t border-white/6">
      <div className="mx-auto max-w-[1360px] px-6 py-10 md:px-10 md:py-14">
        <p
          className="
            text-center
            text-[12px] leading-[2.1]
            tracking-[0.08em]
            text-[#7E7B76]
            md:text-[13px]
          "
        >
          生活有留白，灵魂自有回音。
        </p>
      </div>
    </footer>
  )
}