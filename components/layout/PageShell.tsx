'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PageShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isHome = pathname === '/' || pathname === ''
  const [visible, setVisible] = useState(isHome)

  useEffect(() => {
    if (isHome) {
      setVisible(true)
      return
    }

    setVisible(false)

    const id = window.requestAnimationFrame(() => {
      setVisible(true)
    })

    return () => window.cancelAnimationFrame(id)
  }, [isHome, pathname])

  if (isHome) return <>{children}</>

  return (
    <div
      className={`transition-all ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
        visible
          ? 'translate-y-0 opacity-100 blur-0 duration-[760ms]'
          : 'translate-y-[10px] opacity-0 blur-[4px] duration-[520ms]'
      }`}
    >
      {children}
    </div>
  )
}