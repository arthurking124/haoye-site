'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { urlFor } from '@/lib/sanity.image'

type ImageSeriesItem = {
  _id?: string
  title?: string
  subtitle?: string
  slug?: { current?: string }
  images?: any[]
}

export default function ZAxisGallery({ items }: { items: ImageSeriesItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const isThrottled = useRef(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const triggerNext = () => {
    if (currentIndex < items.length - 1) {
      isThrottled.current = true
      setCurrentIndex((prev) => prev + 1)
      setTimeout(() => { isThrottled.current = false }, 1200)
    }
  }

  const triggerPrev = () => {
    if (currentIndex > 0) {
      isThrottled.current = true
      setCurrentIndex((prev) => prev - 1)
      setTimeout(() => { isThrottled.current = false }, 1200)
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (isThrottled.current) return
    const threshold = 30
    if (e.deltaY > threshold) triggerNext()
    else if (e.deltaY < -threshold) triggerPrev()
  }

  if (!items || items.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-transparent touch-none select-none"
      onWheel={handleWheel}
    >
      {items.map((item, index) => {
        const distance = index - currentIndex
        const isActive = distance === 0
        const isPast = distance < 0
        const isFuture = distance > 0

        const cover = item.images?.[0]
        const href = item.slug?.current ? `/images/${item.slug.current}` : '/images'

        let scale = 1
        let opacity = 1
        let blur = 'blur(0px)'
        let zIndex = 10 - Math.abs(distance)

        if (isPast) {
          scale = 1.8 + Math.abs(distance) * 0.2
          opacity = 0
          blur = 'blur(16px)'
          zIndex = 20
        } else if (isFuture) {
          scale = 0.65 - distance * 0.05
          opacity = 0
          blur = 'blur(12px)'
        }

        return (
          <motion.div
            key={item._id ?? index}
            // 👑 核心修复 1：增加 inset-0 和 h-full 铺满全屏，承接屏幕上任何位置的盲滑！
            className="absolute inset-0 flex w-full h-full flex-col items-center justify-center will-change-transform"
            style={{ zIndex }}
            initial={false}
            animate={{
              scale,
              opacity,
              filter: blur,
              x: 0, // 强制拖拽后自动回弹归位
              y: 0,
              pointerEvents: isActive ? 'auto' : 'none',
            }}
            transition={{
              duration: 1.4,
              ease: [0.19, 1, 0.22, 1], 
            }}
            
            // 🚀 核心修复 2：工业级手势物理引擎，降维打击所有原生冲突
            drag={isActive ? true : false} // 仅在当前激活态下开启物理拖拽
            dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }} // 锁死边界
            dragElastic={0.06} // 极佳的阻尼手感，滑动时照片会有轻微“拉扯感”
            onDragEnd={(e, info) => {
              if (!isActive || isThrottled.current) return
              const { offset, velocity } = info
              
              const swipeThreshold = 30
              const velocityThreshold = 200

              // 智能判定：横向滑动为主还是纵向滑动为主
              if (Math.abs(offset.x) > Math.abs(offset.y)) {
                if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) triggerNext()
                else if (offset.x > swipeThreshold || velocity.x > velocityThreshold) triggerPrev()
              } else {
                if (offset.y < -swipeThreshold || velocity.y < -velocityThreshold) triggerNext()
                else if (offset.y > swipeThreshold || velocity.y > velocityThreshold) triggerPrev()
              }
            }}
          >
            <Link 
              href={href} 
              className="group block [-webkit-touch-callout:none] [-webkit-user-drag:none]" 
              draggable={false}
            >
              <div className="haoye-gallery-frame relative overflow-hidden rounded-[2px] transition-transform duration-[1.2s] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-[1.02]">
                {cover ? (
                  <img
                    src={urlFor(cover).width(1600).quality(95).url()}
                    alt={item.title ?? `image-${index}`}
                    className="w-[85vw] h-auto aspect-[4/3] max-w-[1000px] object-cover md:h-[65vh] md:w-[65vw] md:aspect-auto"
                    draggable={false} 
                  />
                ) : (
                  <div className="flex w-[85vw] aspect-[4/3] max-w-[1000px] items-center justify-center text-[12px] tracking-[0.2em] text-[var(--site-faint)] md:h-[65vh] md:w-[65vw] md:aspect-auto">
                    NO IMAGE
                  </div>
                )}
              </div>
            </Link>

            <motion.div
              className="mt-10 flex flex-col items-center text-center"
              animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
              transition={{ duration: 0.8, delay: isActive ? 0.15 : 0 }}
            >
              <p className="text-[10px] tracking-[0.3em] text-[var(--site-faint)]">
                {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
              </p>
              <h2 className="mt-5 text-[22px] font-light tracking-widest text-[var(--site-text-solid)] md:text-[32px]">
                {item.title ?? '未命名'}
              </h2>
              {item.subtitle && (
                <p className="mt-3 max-w-[400px] text-[13px] leading-[2] text-[var(--site-dim)]">
                  {item.subtitle}
                </p>
              )}
            </motion.div>
          </motion.div>
        )
      })}

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 opacity-60 pointer-events-none">
        <div className="h-[40px] w-[1px] overflow-hidden bg-[color:var(--site-border-soft)]">
          <motion.div
            className="w-full bg-[color:var(--site-text-solid)]"
            animate={{ height: `${((currentIndex + 1) / items.length) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  )
}