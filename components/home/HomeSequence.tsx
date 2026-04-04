'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent, TouchEvent } from 'react'
import HomeSlide from './HomeSlide'
import HomeIntroOverlay from './HomeIntroOverlay'

type HomeSequenceProps = {
  settings: any
}

type ParallaxState = {
  rotateX: number
  rotateY: number
  tx: number
  ty: number
}

const INITIAL_PARALLAX: ParallaxState = {
  rotateX: 0,
  rotateY: 0,
  tx: 0,
  ty: 0,
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function soften(value: number) {
  const sign = Math.sign(value)
  const amount = Math.min(1, Math.abs(value))
  return sign * Math.pow(amount, 1.18)
}

export default function HomeSequence({ settings }: HomeSequenceProps) {
  const [current, setCurrent] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [introVisible, setIntroVisible] = useState(true)
  const [transitionDuration, setTransitionDuration] = useState(900)
  const [parallax, setParallax] = useState<ParallaxState>(INITIAL_PARALLAX)

  const isAnimatingRef = useRef(false)
  const touchStartX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const rafRef = useRef<number | null>(null)
  const targetRef = useRef<ParallaxState>(INITIAL_PARALLAX)
  const currentRef = useRef<ParallaxState>(INITIAL_PARALLAX)
  const velocityRef = useRef<ParallaxState>(INITIAL_PARALLAX)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const volumeTimerRef = useRef<number | null>(null)

  const slides = useMemo(
    () => [
      {
        text: settings?.homeScreen1Text,
        bg: settings?.homeScreen1ImageUrl,
        align: 'left' as const,
      },
      {
        text: settings?.homeScreen2Text,
        bg: settings?.homeScreen2ImageUrl,
        align: 'left' as const,
      },
      {
        text: settings?.homeScreen3Text,
        bg: settings?.homeScreen3ImageUrl,
        align: 'right' as const,
      },
      {
        text: settings?.homeScreen4Text,
        bg: settings?.homeScreen4ImageUrl,
        align: 'center' as const,
        isLast: true,
      },
    ],
    [settings]
  )

  const homeAudioSrc =
    settings?.homeAudioUrl ||
    settings?.homeMusicUrl ||
    settings?.bgmUrl ||
    settings?.siteMusicUrl ||
    '/audio/home.mp3'

  const getTransitionDuration = useCallback((from: number, to: number) => {
    if (from === 2 && to === 3) return 1260
    if (from !== 3 && to === 3) return 1160
    if (from === 3 && to !== 3) return 980
    return 900
  }, [])

  const goTo = useCallback(
    (nextIndex: number) => {
      if (isAnimatingRef.current) return
      if (nextIndex < 0 || nextIndex > slides.length - 1) return
      if (nextIndex === current) return

      const duration = getTransitionDuration(current, nextIndex)
      isAnimatingRef.current = true
      setTransitionDuration(duration)
      setCurrent(nextIndex)

      window.setTimeout(() => {
        isAnimatingRef.current = false
      }, duration + 60)
    },
    [current, getTransitionDuration, slides.length]
  )

  const prepareAndPlayMusic = useCallback(() => {
    if (typeof window === 'undefined') return
    if (!homeAudioSrc) return

    let audio = audioRef.current

    if (!audio) {
      audio = new Audio(homeAudioSrc)
      audio.loop = true
      audio.preload = 'auto'
      audioRef.current = audio
    }

    if (audio.src !== new URL(homeAudioSrc, window.location.origin).toString()) {
      audio.src = homeAudioSrc
      audio.loop = true
      audio.preload = 'auto'
    }

    audio.volume = 0.01
    const playPromise = audio.play()
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {})
    }
  }, [homeAudioSrc])

  const fadeMusicToTarget = useCallback((targetVolume = 0.62) => {
    const audio = audioRef.current
    if (!audio) return

    if (volumeTimerRef.current !== null) {
      window.clearInterval(volumeTimerRef.current)
      volumeTimerRef.current = null
    }

    const startVolume = Number.isFinite(audio.volume) ? audio.volume : 0.01
    const steps = 18
    const stepDuration = 70
    let step = 0

    volumeTimerRef.current = window.setInterval(() => {
      step += 1
      const progress = Math.min(step / steps, 1)
      audio.volume = startVolume + (targetVolume - startVolume) * progress

      if (progress >= 1 && volumeTimerRef.current !== null) {
        window.clearInterval(volumeTimerRef.current)
        volumeTimerRef.current = null
      }
    }, stepDuration)
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const skipIntroOnce = sessionStorage.getItem('haoye-skip-intro-once')

    if (skipIntroOnce === '1') {
      sessionStorage.removeItem('haoye-skip-intro-once')
      setCurrent(0)
      setIntroVisible(false)
      prepareAndPlayMusic()
      fadeMusicToTarget()
      return
    }

    setCurrent(0)
    setIntroVisible(true)
  }, [fadeMusicToTarget, prepareAndPlayMusic])

  useEffect(() => {
    const spring = isMobile ? 0.09 : 0.105
    const damping = isMobile ? 0.78 : 0.8

    const animate = () => {
      const nextVelocity: ParallaxState = {
        rotateX:
          (velocityRef.current.rotateX +
            (targetRef.current.rotateX - currentRef.current.rotateX) * spring) *
          damping,
        rotateY:
          (velocityRef.current.rotateY +
            (targetRef.current.rotateY - currentRef.current.rotateY) * spring) *
          damping,
        tx:
          (velocityRef.current.tx +
            (targetRef.current.tx - currentRef.current.tx) * spring) *
          damping,
        ty:
          (velocityRef.current.ty +
            (targetRef.current.ty - currentRef.current.ty) * spring) *
          damping,
      }

      velocityRef.current = nextVelocity

      currentRef.current = {
        rotateX: currentRef.current.rotateX + nextVelocity.rotateX,
        rotateY: currentRef.current.rotateY + nextVelocity.rotateY,
        tx: currentRef.current.tx + nextVelocity.tx,
        ty: currentRef.current.ty + nextVelocity.ty,
      }

      setParallax({
        rotateX: Number(currentRef.current.rotateX.toFixed(4)),
        rotateY: Number(currentRef.current.rotateY.toFixed(4)),
        tx: Number(currentRef.current.tx.toFixed(4)),
        ty: Number(currentRef.current.ty.toFixed(4)),
      })

      rafRef.current = window.requestAnimationFrame(animate)
    }

    rafRef.current = window.requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isMobile])

  useEffect(() => {
    return () => {
      if (volumeTimerRef.current !== null) {
        window.clearInterval(volumeTimerRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  const updateTargetFromPoint = useCallback(
    (clientX: number, clientY: number, pointerType: 'mouse' | 'touch') => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const x = clamp((clientX - rect.left) / rect.width, 0, 1)
      const y = clamp((clientY - rect.top) / rect.height, 0, 1)

      const nx = x * 2 - 1
      const ny = y * 2 - 1

      const deadZone = pointerType === 'touch' ? 0.09 : 0.055
      const dx = Math.abs(nx) < deadZone ? 0 : nx
      const dy = Math.abs(ny) < deadZone ? 0 : ny

      const sx = soften(dx)
      const sy = soften(dy)

      const rotateAmount = pointerType === 'touch' ? 0.9 : 1.18
      const translateAmount = pointerType === 'touch' ? 4.6 : 6.2

      targetRef.current = {
        rotateY: sx * rotateAmount,
        rotateX: sy * -rotateAmount,
        tx: sx * -translateAmount,
        ty: sy * -translateAmount,
      }
    },
    []
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (isMobile) return
      updateTargetFromPoint(e.clientX, e.clientY, 'mouse')
    },
    [isMobile, updateTargetFromPoint]
  )

  const handleMouseLeave = useCallback(() => {
    targetRef.current = INITIAL_PARALLAX
  }, [])

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        targetRef.current = INITIAL_PARALLAX
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onWheel = (e: WheelEvent) => {
      if (isMobile) return
      e.preventDefault()
      if (introVisible) return
      if (isAnimatingRef.current) return
      if (Math.abs(e.deltaY) < 24) return

      if (e.deltaY > 0) {
        goTo(current + 1)
      } else {
        goTo(current - 1)
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (introVisible) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(current + 1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(current - 1)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [current, goTo, introVisible, isMobile])

  useEffect(() => {
    if (introVisible) return
    window.dispatchEvent(new CustomEvent('haoye:intro-ready'))
  }, [introVisible])

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('haoye:screen-change', {
        detail: { index: current },
      })
    )
  }, [current])

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0]
    if (!touch) return
    touchStartX.current = touch.clientX
    updateTargetFromPoint(touch.clientX, touch.clientY, 'touch')
  }

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (introVisible) return
    const touch = e.touches[0]
    if (!touch) return
    updateTargetFromPoint(touch.clientX, touch.clientY, 'touch')
  }

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (introVisible) return
    if (touchStartX.current === null) {
      targetRef.current = INITIAL_PARALLAX
      return
    }

    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current
    const diff = touchStartX.current - endX

    if (Math.abs(diff) > 40) {
      if (diff > 0) goTo(current + 1)
      else goTo(current - 1)
    }

    touchStartX.current = null
    targetRef.current = INITIAL_PARALLAX
  }

  return (
    <div
      ref={containerRef}
      className="relative h-[100svh] w-full overflow-hidden bg-[#000]"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute inset-0 transition-[opacity,transform,filter] duration-1000 ease-out"
        style={{
          opacity: introVisible ? 0 : 1,
          transform: introVisible ? 'scale(1.01)' : 'scale(1)',
          filter: introVisible ? 'blur(4px)' : 'blur(0px)',
        }}
      >
        {slides.map((slide, index) => {
          const offset = (index - current) * 100
          const isActive = index === current

          return (
            <div
              key={index}
              className="absolute inset-0 will-change-transform"
              style={{
                transform: `translate3d(${offset}%, 0, 0)`,
                transition: `transform ${transitionDuration}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                pointerEvents: isActive ? 'auto' : 'none',
              }}
              aria-hidden={!isActive}
            >
              <HomeSlide
                imageUrl={slide.bg}
                text={slide.text}
                align={slide.align}
                isLast={slide.isLast}
                index={index}
                total={slides.length}
                active={isActive}
                mobile={isMobile}
                parallax={isActive ? parallax : INITIAL_PARALLAX}
              />
            </div>
          )
        })}
      </div>

      <HomeIntroOverlay
        visible={introVisible}
        onEnter={(soundEnabled) => {
          if (soundEnabled) {
            prepareAndPlayMusic()
          }
        }}
        onComplete={() => {
          setCurrent(0)
          setIntroVisible(false)
          fadeMusicToTarget()
        }}
      />

      {!isMobile && !introVisible && (
        <>
          <button
            onClick={() => goTo(current - 1)}
            className="pointer-events-auto fixed left-6 top-1/2 z-[80] -translate-y-1/2 text-[24px] text-white/18 transition-all duration-300 hover:text-white/55"
            aria-label="Previous slide"
            type="button"
          >
            ‹
          </button>

          <button
            onClick={() => goTo(current + 1)}
            className="pointer-events-auto fixed right-6 top-1/2 z-[80] -translate-y-1/2 text-[24px] text-white/18 transition-all duration-300 hover:text-white/55"
            aria-label="Next slide"
            type="button"
          >
            ›
          </button>
        </>
      )}

      {!introVisible && (
        <div className="pointer-events-auto fixed bottom-8 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2 md:bottom-10 md:gap-3">
          {slides.map((_, index) => {
            const active = current === index
            const className = active
              ? isMobile
                ? 'h-[3px] w-8 rounded-full bg-white/55 transition-all duration-500'
                : 'h-[3px] w-10 rounded-full bg-white/65 transition-all duration-500'
              : isMobile
                ? 'h-[3px] w-5 rounded-full bg-white/12 transition-all duration-500'
                : 'h-[3px] w-6 rounded-full bg-white/15 transition-all duration-500'

            return (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={className}
                aria-label={`Go to screen ${index + 1}`}
                type="button"
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
