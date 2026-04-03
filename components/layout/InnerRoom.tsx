'use client'

import { useEffect, useState, type ReactNode } from 'react'

type InnerRoomProps = {
  children: ReactNode
  variant?: 'archive' | 'inner'
}

export default function InnerRoom({
  children,
  variant = 'inner',
}: InnerRoomProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      setVisible(true)
    })

    return () => window.cancelAnimationFrame(id)
  }, [])

  const isArchive = variant === 'archive'

  return (
    <div className="relative">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-0 h-24 transition-opacity duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className={`absolute inset-0 ${
            isArchive
              ? 'bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent)]'
              : 'bg-[linear-gradient(to_bottom,rgba(255,255,255,0.015),transparent)]'
          }`}
        />
      </div>

      <div
        className={`relative z-[1] transition-all ease-[cubic-bezier(0.22,1,0.36,1)] ${
          visible
            ? 'translate-y-0 opacity-100 blur-0'
            : isArchive
            ? 'translate-y-[10px] opacity-0 blur-[4px]'
            : 'translate-y-[8px] opacity-0 blur-[3px]'
        } ${isArchive ? 'duration-[820ms]' : 'duration-[760ms]'}`}
      >
        {children}
      </div>
    </div>
  )
}