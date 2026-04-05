'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
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

const NAV_FREQUENCIES = [220, 233.08, 246.94, 261.63]

export default function HomeSplineScene() {
  const [introVisible, setIntroVisible] = useState(true)
  const [scenePath, setScenePath] = useState('/scene-desktop.splinecode')
  const [mounted, setMounted] = useState(false)
  const [hoveredHref, setHoveredHref] = useState<string | null>(null)
  const [pressedHref, setPressedHref] = useState<string | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const updateScene = () => {
      const isMobile = window.innerWidth < 768
      setScenePath(isMobile ? '/scene-mobile.splinecode' : '/scene-desktop.splinecode')
    }

    const skipIntroOnce =
      typeof window !== 'undefined'
        ? window.sessionStorage.getItem('haoye-skip-intro-once')
        : null

    if (skipIntroOnce === '1') {
      window.sessionStorage.removeItem('haoye-skip-intro-once')
      setIntroVisible(false)
    }

    updateScene()
    setMounted(true)

    window.addEventListener('resize', updateScene)

    return () => {
      window.removeEventListener('resize', updateScene)
    }
  }, [])

  const getAudioContext = () => {
    if (typeof window === 'undefined') return null

    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext
        }
      ).webkitAudioContext

    if (!AudioContextClass) return null

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass()
    }

    if (audioContextRef.current.state === 'suspended') {
      void audioContextRef.current.resume()
    }

    return audioContextRef.current
  }

  const playNavTone = (index: number) => {
    const ctx = getAudioContext()
    if (!ctx) return

    const frequency = NAV_FREQUENCIES[index] ?? NAV_FREQUENCIES[0]
    const now = ctx.currentTime + 0.005

    const masterGain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1650, now)
    filter.Q.setValueAtTime(0.6, now)

    masterGain.gain.setValueAtTime(0.0001, now)
    masterGain.gain.linearRampToValueAtTime(0.02, now + 0.012)
    masterGain.gain.exponentialRampToValueAtTime(0.004, now + 0.18)
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62)

    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const osc3 = ctx.createOscillator()

    const gain1 = ctx.createGain()
    const gain2 = ctx.createGain()
    const gain3 = ctx.createGain()

    osc1.type = 'triangle'
    osc2.type = 'sine'
    osc3.type = 'sine'

    osc1.frequency.setValueAtTime(frequency, now)
    osc2.frequency.setValueAtTime(frequency * 2, now)
    osc3.frequency.setValueAtTime(frequency * 3.01, now)

    osc1.detune.setValueAtTime(-2, now)
    osc2.detune.setValueAtTime(1, now)
    osc3.detune.setValueAtTime(3, now)

    gain1.gain.setValueAtTime(0.7, now)
    gain2.gain.setValueAtTime(0.18, now)
    gain3.gain.setValueAtTime(0.08, now)

    osc1.connect(gain1)
    osc2.connect(gain2)
    osc3.connect(gain3)

    gain1.connect(filter)
    gain2.connect(filter)
    gain3.connect(filter)

    filter.connect(masterGain)
    masterGain.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now)
    osc3.start(now)

    osc1.stop(now + 0.65)
    osc2.stop(now + 0.65)
    osc3.stop(now + 0.65)
  }

  const handleNavPress = (href: string, index: number) => {
    setPressedHref(href)
    playNavTone(index)
  }

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
        className={`absolute top-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-7 transition-all duration-700 md:top-10 md:left-[34.8%] md:gap-9 ${
          introVisible ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
        }`}
      >
        {navItems.map((item, index) => (
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
            onMouseDown={() => handleNavPress(item.href, index)}
            onMouseUp={() =>
              setPressedHref((current) => (current === item.href ? null : current))
            }
            onTouchStart={() => handleNavPress(item.href, index)}
            onTouchEnd={() =>
              setPressedHref((current) => (current === item.href ? null : current))
            }
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