'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import HomeSlide from './HomeSlide'

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

export default function HomeSequence({ settings }: HomeSequenceProps) {
  const [current, setCurrent] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [introVisible, setIntroVisible] = useState(true)
  const [parallax, setParallax] = useState<ParallaxState>(INITIAL_PARALLAX)

  const isAnimatingRef = useRef(false)
  const touchStartX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const rafRef = useRef<number | null>(null)
  const targetRef = useRef<ParallaxState>(INITIAL_PARALLAX)
  const currentRef = useRef<ParallaxState>(INITIAL_PARALLAX)

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

  const goTo = useCallback(
    (nextIndex: number) => {
      if (isAnimatingRef.current) return
      if (nextIndex < 0 || nextIndex > slides.length - 1) return

      isAnimatingRef.current = true
      setCurrent(nextIndex)

      window.setTimeout(() => {
        isAnimatingRef.current = false
      }, 900)
    },
    [slides.length]
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
      setIntroVisible(false)
      return
    }

    sessionStorage.setItem('haoye-home-intro-seen', '1')

    const timer = window.setTimeout(() => {
      setIntroVisible(false)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const animate = () => {
      const ease = 0.085

      currentRef.current = {
        rotateX:
          currentRef.current.rotateX +
          (targetRef.current.rotateX - currentRef.current.rotateX) * ease,
        rotateY:
          currentRef.current.rotateY +
          (targetRef.current.rotateY - currentRef.current.rotateY) * ease,
        tx: currentRef.current.tx + (targetRef.current.tx - currentRef.current.tx) * ease,
        ty: currentRef.current.ty + (targetRef.current.ty - currentRef.current.ty) * ease,
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
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isMobile) return

      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window

      const rawX = (clientX / innerWidth) * 2 - 1
      const rawY = (clientY / innerHeight) * 2 - 1

      const deadZone = 0.04
      const x = Math.abs(rawX) < deadZone ? 0 : rawX
      const y = Math.abs(rawY) < deadZone ? 0 : rawY

      targetRef.current = {
        rotateY: x * 1.5,
        rotateX: y * -1.5,
        tx: x * -8,
        ty: y * -8,
      }
    },
    [isMobile]
  )

  const handleMouseLeave = useCallback(() => {
    targetRef.current = INITIAL_PARALLAX
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

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (introVisible) return
    if (touchStartX.current === null) return

    const endX = e.changedTouches[0].clientX
    const diff = touchStartX.current - endX

    if (Math.abs(diff) > 40) {
      if (diff > 0) goTo(current + 1)
      else goTo(current - 1)
    }

    touchStartX.current = null
  }

  return (
    <div
      ref={containerRef}
      className="relative h-[100svh] w-full overflow-hidden bg-[#0D0D0D]"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute inset-0">
        {slides.map((slide, index) => {
          const offset = (index - current) * 100
          const isActive = index === current

          return (
            <div
              key={index}
              className="absolute inset-0 will-change-transform"
              style={{
                transform: `translate3d(${offset}%, 0, 0)`,
                transition: 'transform 900ms cubic-bezier(0.22, 1, 0.36, 1)',
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

      <div
        className={`pointer-events-none absolute inset-0 z-[70] bg-[#0D0D0D] transition-opacity duration-[1200ms] ease-out ${
          introVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {!isMobile && (
        <>
          <button
            onClick={() => goTo(current - 1)}
            className="pointer-events-auto fixed left-6 top-1/2 z-[60] -translate-y-1/2 text-[24px] text-white/18 transition-all duration-300 hover:text-white/55"
            aria-label="Previous slide"
            type="button"
          >
            ‹
          </button>

          <button
            onClick={() => goTo(current + 1)}
            className="pointer-events-auto fixed right-6 top-1/2 z-[60] -translate-y-1/2 text-[24px] text-white/18 transition-all duration-300 hover:text-white/55"
            aria-label="Next slide"
            type="button"
          >
            ›
          </button>
        </>
      )}

      <div className="pointer-events-auto fixed bottom-8 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 md:bottom-10 md:gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            className={`h-[3px] rounded-full transition-all duration-500 ${
              current === index
                ? isMobile
                  ? 'w-8 bg-white/55'
                  : 'w-10 bg-white/65'
                : isMobile
                ? 'w-5 bg-white/12'
                : 'w-6 bg-white/15'
            }`}
            aria-label={`Go to screen ${index + 1}`}
            type="button"
          />
        ))}
      </div>
    </div>
  )
}