'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
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
  const [scenePath, setScenePath] = useState('/scene-desktop.splinecode')
  const [mounted, setMounted] = useState(false)
  const [hoveredHref, setHoveredHref] = useState<string | null>(null)
  const [pressedHref, setPressedHref] = useState<string | null>(null)

  useEffect(() => {
    const updateScene = () => {
      const isMobile = window.innerWidth < 768
      setScenePath(isMobile ? '/scene-mobile.splinecode' : '/scene-desktop.splinecode')
    }

    updateScene()
    setMounted(true)

    window.addEventListener('resize', updateScene)
    return () => window.removeEventListener('resize', updateScene)
  }, [])

  const getNavStyle = (href: string) => {
    const isPressed = pressedHref === href
    const isHovered = hoveredHref === href

    return {
      transform: isPressed
        ? 'translateY(1.5px) scale(0.985)'
        : 'translateY(0px) scale(1)',
      opacity: isPressed ? 0.72 : isHovered ? 0.96 : 0.8,
      letterSpacing: isPressed ? '0.28em' : isHovered ? '0.38em' : '0.34em',
      filter: isPressed
        ? 'brightness(0.82)'
        : isHovered
          ? 'brightness(1.06)'
          : 'brightness(1)',
      transition:
        'transform 140ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease, letter-spacing 180ms ease, filter 180ms ease',
    } as const
  }

  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-black text-white">
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-700 ${
          introVisible ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="h-full w-full">
          {mounted && <Spline key={scenePath} scene={scenePath} />}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/10 via-transparent to-black/10" />

      <nav
        className={`absolute top-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-7 transition-all duration-700 md:top-8 md:left-[47.2%] md:gap-9 ${
          introVisible ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
        }`}
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="select-none text-[11px] md:text-[12px]"
            style={getNavStyle(item.href)}
            onMouseEnter={() => setHoveredHref(item.href)}
            onMouseLeave={() => {
              setHoveredHref((current) => (current === item.href ? null : current))
              setPressedHref((current) => (current === item.href ? null : current))
            }}
            onMouseDown={() => setPressedHref(item.href)}
            onMouseUp={() => setPressedHref((current) => (current === item.href ? null : current))}
            onTouchStart={() => setPressedHref(item.href)}
            onTouchEnd={() => setPressedHref((current) => (current === item.href ? null : current))}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <HomeIntroOverlay
        visible={introVisible}
        onEnter={() => {
          setIntroVisible(false)
        }}
        onComplete={() => {
          setIntroVisible(false)
        }}
      />
    </main>
  )
}