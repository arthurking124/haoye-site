'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import HomeSlide from './HomeSlide'

type Settings = {
  homeScreen1Text?: string
  homeScreen1ImageUrl?: string
  homeScreen2Text?: string
  homeScreen2ImageUrl?: string
  homeScreen3Text?: string
  homeScreen3ImageUrl?: string
  homeScreen4Text?: string
  homeScreen4ImageUrl?: string
  signature?: string
  domainText?: string
}

type Slide = {
  theme: 'distant' | 'approach' | 'weight' | 'portal'
  align: 'left' | 'right' | 'center'
  eyebrow: string
  caption?: string
  text?: string
  imageUrl?: string
  isLast?: boolean
}

export default function HomeSequence({ settings }: { settings: Settings }) {
  const [current, setCurrent] = useState(0)
  const [isCoarsePointer, setIsCoarsePointer] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const animationLockRef = useRef(false)
  const touchStartX = useRef<number | null>(null)

  const target = useRef({ x: 0, y: 0, rx: 0, ry: 0 })
  const live = useRef({ x: 0, y: 0, rx: 0, ry: 0 })

  const slides = useMemo<Slide[]>(
    () => [
      {
        theme: 'distant',
        align: 'left',
        eyebrow: 'Act I · Exposure',
        text: settings?.homeScreen1Text || '沉默也需要空间。',
        caption: '不是欢迎，不是说明。只是让一个空间，先从黑里慢慢亮起来。',
        imageUrl: settings?.homeScreen1ImageUrl,
      },
      {
        theme: 'approach',
        align: 'left',
        eyebrow: 'Act II · Approach',
        text: settings?.homeScreen2Text || '靠近以后，光才开始带出时间。',
        caption: '第二幕不再只是看见，而是向内部再走近一步。',
        imageUrl: settings?.homeScreen2ImageUrl,
      },
      {
        theme: 'weight',
        align: 'right',
        eyebrow: 'Act III · Weight',
        text: settings?.homeScreen3Text || '光停下来的地方，时间才开始说话。',
        caption: '这里不是气氛，而是整个网站真正的精神重心。',
        imageUrl: settings?.homeScreen3ImageUrl,
      },
      {
        theme: 'portal',
        align: 'center',
        eyebrow: 'Act IV · Portal',
        text: settings?.homeScreen4Text || '从这里进入，不同的沉默会通往不同的房间。',
        caption: '最后一幕不是结尾，而是门被打开的时刻。',
        imageUrl: settings?.homeScreen4ImageUrl,
        isLast: true,
      },
    ],
    [settings]
  )

  const goTo = (nextIndex: number) => {
    if (animationLockRef.current) return
    if (nextIndex < 0 || nextIndex > slides.length - 1) return

    animationLockRef.current = true
    setCurrent(nextIndex)

    window.setTimeout(() => {
      animationLockRef.current = false
    }, 1100)
  }

  useEffect(() => {
    const media = window.matchMedia('(pointer: coarse)')
    const onChange = () => setIsCoarsePointer(media.matches)

    onChange()
    media.addEventListener?.('change', onChange)

    return () => media.removeEventListener?.('change', onChange)
  }, [])

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    let raf = 0

    const render = () => {
      live.current.x += (target.current.x - live.current.x) * 0.08
      live.current.y += (target.current.y - live.current.y) * 0.08
      live.current.rx += (target.current.rx - live.current.rx) * 0.08
      live.current.ry += (target.current.ry - live.current.ry) * 0.08

      node.style.setProperty('--parallax-x', `${live.current.x}px`)
      node.style.setProperty('--parallax-y', `${live.current.y}px`)
      node.style.setProperty('--parallax-rx', `${live.current.rx}deg`)
      node.style.setProperty('--parallax-ry', `${live.current.ry}deg`)

      raf = window.requestAnimationFrame(render)
    }

    raf = window.requestAnimationFrame(render)

    return () => window.cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onWheel = (e: WheelEvent) => {
      if (isCoarsePointer) return
      e.preventDefault()
      if (animationLockRef.current) return
      if (Math.abs(e.deltaY) < 24) return

      if (e.deltaY > 0) goTo(current + 1)
      else goTo(current - 1)
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
  }, [current, isCoarsePointer])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isCoarsePointer) return

    const x = e.clientX / window.innerWidth - 0.5
    const y = e.clientY / window.innerHeight - 0.5

    target.current = {
      x: x * -22,
      y: y * -22,
      rx: x * 3.2,
      ry: y * -3.2,
    }
  }

  const handleMouseLeave = () => {
    target.current = { x: 0, y: 0, rx: 0, ry: 0 }
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return

    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 42) {
      if (diff > 0) goTo(current + 1)
      else goTo(current - 1)
    }

    touchStartX.current = null
  }

  return (
    <div
      ref={containerRef}
      className="haoye-home"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="haoye-home__track"
        style={{ transform: `translate3d(-${current * 100}vw, 0, 0)` }}
      >
        {slides.map((slide, index) => (
          <HomeSlide
            key={`${slide.theme}-${index}`}
            index={index}
            total={slides.length}
            active={current === index}
            signature={settings?.signature || '皓野'}
            domainText={settings?.domainText || 'haoye.cyou'}
            {...slide}
          />
        ))}
      </div>

      {!isCoarsePointer && (
        <>
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            className="haoye-home__side-btn is-left"
            aria-label="Previous slide"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={() => goTo(current + 1)}
            className="haoye-home__side-btn is-right"
            aria-label="Next slide"
          >
            ›
          </button>

          <div className="haoye-home__hint font-ui">Scroll / Arrow Keys</div>
        </>
      )}

      <div className="haoye-home__dots">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            className={`haoye-home__dot ${current === index ? 'is-active' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}