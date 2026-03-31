'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import HomeSlide from './HomeSlide'

type HomeSequenceProps = {
  settings: any
}

export default function HomeSequence({ settings }: HomeSequenceProps) {
  const [current, setCurrent] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  // === INTERACTION ADDED: 状态管理背景偏移 ===
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  
  const isAnimatingRef = useRef(false)
  const touchStartX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

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

  // === INTERACTION ADDED: 鼠标移动监听函数 ===
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile) return // 移动端关闭位移，节省性能

    const { clientX, clientY } = e
    const { innerWidth, innerHeight } = window

    // 计算中心偏移量 (-1 到 1)
    const x = (clientX / innerWidth) * 2 - 1
    const y = (clientY / innerHeight) * 2 - 1

    // 设置偏移像素 (数值越小越克制，这里设为 18px)
    setParallax({
      x: x * -18,
      y: y * -18
    })
  }

  const goTo = (nextIndex: number) => {
    if (isAnimatingRef.current) return
    if (nextIndex < 0 || nextIndex > slides.length - 1) return

    isAnimatingRef.current = true
    setCurrent(nextIndex)

    window.setTimeout(() => {
      isAnimatingRef.current = false
    }, 900)
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onWheel = (e: WheelEvent) => {
      if (isMobile) return

      e.preventDefault()

      if (isAnimatingRef.current) return
      if (Math.abs(e.deltaY) < 20) return

      if (e.deltaY > 0) {
        goTo(current + 1)
      } else {
        goTo(current - 1)
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
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
  }, [current, isMobile])

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return

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
  }

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-screen overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      // === INTERACTION ADDED: 挂载鼠标监听 ===
      onMouseMove={handleMouseMove}
    >
      {/* === INTERACTION ADDED: 呼吸位移外层容器 ===
          这里的 transform 负责鼠标跟随的微动
      */}
      <div
        className="absolute inset-0 z-0 transition-transform duration-[1000ms] ease-[cubic-bezier(0.15,0.85,0.35,1)]"
        style={{ 
          transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0) scale(1.1)`,
          willChange: 'transform'
        }}
      >
        {/* 这里是你原有的翻页容器，它现在嵌套在位移层里 */}
        <div
          className="pointer-events-none flex h-screen transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${current * 100}vw)` }}
        >
          {slides.map((slide, index) => (
            <HomeSlide
              key={index}
              imageUrl={slide.bg}
              text={slide.text}
              signature={settings?.signature}
              domainText={settings?.domainText}
              align={slide.align}
              isLast={!!slide.isLast}
              index={index}
              total={slides.length}
              active={current === index}
              mobile={isMobile}
            />
          ))}
        </div>
      </div>

      {!isMobile && (
        <>
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            className="pointer-events-auto fixed left-6 top-1/2 z-[60] -translate-y-1/2 text-[24px] text-white/18 transition-all duration-300 hover:text-white/55"
            aria-label="Previous slide"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={() => goTo(current + 1)}
            className="pointer-events-auto fixed right-6 top-1/2 z-[60] -translate-y-1/2 text-[24px] text-white/18 transition-all duration-300 hover:text-white/55"
            aria-label="Next slide"
          >
            ›
          </button>
        </>
      )}

      <div
        className={`pointer-events-auto fixed left-1/2 z-[60] -translate-x-1/2 flex gap-2 ${
          isMobile ? 'bottom-12' : 'bottom-8'
        }`}
      >
        {slides.map((_: any, index: number) => (
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