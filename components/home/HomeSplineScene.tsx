'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import HomeIntroOverlay from './HomeIntroOverlay'

const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
})

const navItems = [
  { href: '/poems', label: '诗' },
  { href: '/images', label: '影' },
  { href: '/notes', label: '与' },
  { href: '/about', label: '我' },
]

export default function HomeSplineScene() {
  const [introVisible, setIntroVisible] = useState(true)

  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-black text-white">
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-700 ${
          introVisible ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="h-full w-full">
          <Spline scene="/scene.splinecode" />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/10 via-transparent to-black/10" />

      <nav
        className={`absolute left-1/2 top-6 z-20 flex -translate-x-1/2 items-center gap-6 transition-all duration-700 md:top-8 md:gap-8 ${
          introVisible ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
        }`}
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-[12px] tracking-[0.28em] text-white/82 transition-colors duration-300 hover:text-white md:text-[13px]"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <HomeIntroOverlay
        visible={introVisible}
        onEnter={() => {}}
        onComplete={() => {
          setIntroVisible(false)
        }}
      />
    </main>
  )
}