'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import HomeSlide from './HomeSlide'

type HomeSequenceProps = {
  settings: any
}

export default function HomeSequence({ settings }: HomeSequenceProps) {
  const [current, setCurrent] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  
  // === 🚀 高级交互：定义 3D 视轴偏移状态 ===
  const [parallax, setParallax] = useState({ rotateX: 0, rotateY: 0, tx: 0, ty: 0 })
  
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

  // === 🚀 高级交互：计算 3D 物理透视逻辑 ===
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile) return

    const { clientX, clientY } = e
    const { innerWidth, innerHeight } = window

    // 计算鼠标相对于中心的坐标 (-1 到 1)
    const x = (clientX / innerWidth) * 2 - 1
    const y = (clientY / innerHeight) * 2 - 1

    setParallax({
      rotateY: x * 2,    // 绕 Y 轴旋转（左右倾斜）
      rotateX: y * -2,   // 绕 X 轴旋转（上下倾斜）
      tx: x * -10,       // 极微小的平移偏移
      ty: y * -10
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
    return () => window.removeEventListener('resize', checkMobile)
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
      if (diff > 0) goTo(current + 1)
      else goTo(current - 1)
    }
    touchStartX.current = null
  }

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-screen overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      // === 挂载鼠标监听 ===
      onMouseMove={handleMouseMove}
    >
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
            // === 🚀 关键：将 3D 偏移量传递给每一个 Slide ===
            parallax={parallax}
          />
        ))}
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