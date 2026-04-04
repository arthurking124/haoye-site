'use client'

import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()

  // 首页不显示 footer，避免破坏四屏序章
  if (pathname === '/' || pathname === '') return null

  return (
    <footer className="relative z-[20] border-t border-[color:var(--site-border-soft)]">
      <div className="mx-auto max-w-[1360px] px-6 py-10 md:px-10 md:py-14">
        <p
          className="
            text-center
            text-[12px] leading-[2.1]
            tracking-[0.08em]
            text-[var(--site-dim)]
            md:text-[13px]
          "
        >
          生活有留白，灵魂自有回音。
        </p>

        <p
          className="
            mt-3
            text-center
            text-[10px]
            tracking-[0.12em]
            text-[var(--site-faint)]
            md:text-[11px]
          "
        >
          © haoye.cyou
        </p>
      </div>
    </footer>
  )
}