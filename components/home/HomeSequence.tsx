'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type TouchEvent } from 'react'
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

type IntroStage = 'idle' | 'spinning' | 'forming' | 'revealing' | 'done'

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
  const [introStage, setIntroStage] = useState<IntroStage>('idle')
  const [parallax, setParallax] = useState<ParallaxState>(INITIAL_PARALLAX)
  const [transitionDuration, setTransitionDuration] = useState(900)

  const isAnimatingRef = useRef(false)
  const touchStartX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const introTimersRef = useRef<number[]>([])
  const rafRef = useRef<number | null>(null)
  const targetRef = useRef<ParallaxState>(INITIAL_PARALLAX)
  const currentRef = useRef<ParallaxState>(INITIAL_PARALLAX)
  const velocityRef = useRef<ParallaxState>(INITIAL_PARALLAX)

  const introVisible = introStage !== 'done'
  const homeRevealActive = introStage === 'revealing' || introStage === 'done'

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

  const getTransitionDuration = useCallback((from: number, to: number) => {
    if (from === 2 && to === 3) return 1260
    if (from !== 3 && to === 3) return 1160
    if (from === 3 && to !== 3) return 980
    return 900
  }, [])

  const clearIntroTimers = useCallback(() => {
    introTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    introTimersRef.current = []
  }, [])

  const startIntro = useCallback(() => {
    if (introStage !== 'idle') return

    setIntroStage('spinning')
    clearIntroTimers()

    introTimersRef.current = [
      window.setTimeout(() => setIntroStage('forming'), 1500),
      window.setTimeout(() => setIntroStage('revealing'), 2450),
      window.setTimeout(() => setIntroStage('done'), 3850),
    ]
  }, [clearIntroTimers, introStage])

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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('haoye-home-intro-seen')

    if (hasVisited) {
      setIntroStage('done')
      return
    }

    sessionStorage.setItem('haoye-home-intro-seen', '1')
    setIntroStage('idle')

    return () => clearIntroTimers()
  }, [clearIntroTimers])

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
          (velocityRef.current.tx + (targetRef.current.tx - currentRef.current.tx) * spring) *
          damping,
        ty:
          (velocityRef.current.ty + (targetRef.current.ty - currentRef.current.ty) * spring) *
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
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isMobile])

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
    touchStartX.current = e.touches[0].clientX

    if (e.touches[0]) {
      updateTargetFromPoint(e.touches[0].clientX, e.touches[0].clientY, 'touch')
    }
  }

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (introVisible) return
    if (!e.touches[0]) return

    updateTargetFromPoint(e.touches[0].clientX, e.touches[0].clientY, 'touch')
  }

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (introVisible) return

    if (touchStartX.current === null) {
      targetRef.current = INITIAL_PARALLAX
      return
    }

    const endX = e.changedTouches[0].clientX
    const diff = touchStartX.current - endX

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        goTo(current + 1)
      } else {
        goTo(current - 1)
      }
    }

    touchStartX.current = null
    targetRef.current = INITIAL_PARALLAX
  }

  const homeClassName = [
    'absolute inset-0 transition-[transform,opacity,filter] duration-[1800ms]',
    'ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform',
  ].join(' ')

  return (
    <div
      ref={containerRef}
      className="relative h-[100svh] w-full overflow-hidden bg-[#0D0D0D]"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={homeClassName}
        style={{
          transform: homeRevealActive ? 'scale(1)' : 'scale(0.78)',
          opacity: homeRevealActive ? 1 : 0,
          filter: homeRevealActive ? 'blur(0px)' : 'blur(8px)',
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
                transform: 'translate3d(' + offset + '%, 0, 0)',
                transition: 'transform ' + transitionDuration + 'ms cubic-bezier(0.22, 1, 0.36, 1)',
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

      <HomeIntroOverlay stage={introStage} onEnter={startIntro} mobile={isMobile} />

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
            let dotClassName = 'h-[3px] rounded-full transition-all duration-500 '

            if (current === index) {
              dotClassName += isMobile ? 'w-8 bg-white/55' : 'w-10 bg-white/65'
            } else {
              dotClassName += isMobile ? 'w-5 bg-white/12' : 'w-6 bg-white/15'
            }

            return (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={dotClassName}
                aria-label={'Go to screen ' + (index + 1)}
                type="button"
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
