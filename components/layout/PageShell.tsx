'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PageShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(pathname === '/')

  useEffect(() => {
    if (pathname === '/') {
      setVisible(true)
      return
    }

    setVisible(false)

    const id = window.requestAnimationFrame(() => {
      setVisible(true)
    })

    return () => window.cancelAnimationFrame(id)
  }, [pathname])

  // 首页不加这层过渡，避免破坏你的四屏节奏
  if (pathname === '/') {
    return <>{children}</>
  }

  return (
    <div
      className={`transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
        visible
          ? 'translate-y-0 opacity-100 blur-0'
          : 'translate-y-[14px] opacity-0 blur-[6px]'
      }`}
    >
      {children}
    </div>
  )
}