'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
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
  
  // 【新增】：同时记录 X 和 Y 的起始点
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

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

  // 【核心修复】：支持全方位滑动（兼顾左右横滑与上下滑动）
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isThrottled.current) return
    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    
    // 计算 X 轴和 Y 轴的移动差值
    const deltaX = touchStartX.current - touchEndX
    const deltaY = touchStartY.current - touchEndY
    const threshold = 40

    // 判断用户是更偏向横向滑动还是纵向滑动
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 左右滑动逻辑：左滑下一张，右滑上一张
      if (deltaX > threshold) triggerNext()
      else if (deltaX < -threshold) triggerPrev()
    } else {
      // 保持你原有的上下滑动逻辑
      if (deltaY > threshold) triggerNext()
      else if (deltaY < -threshold) triggerPrev()
    }
  }

  if (!items || items.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-transparent touch-none"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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
            className="absolute flex w-full flex-col items-center justify-center will-change-transform"
            style={{ zIndex }}
            initial={false}
            animate={{
              scale,
              opacity,
              filter: blur,
              pointerEvents: isActive ? 'auto' : 'none',
            }}
            transition={{
              duration: 1.4,
              ease: [0.19, 1, 0.22, 1], 
            }}
          >
            <Link href={href} className="group block">
              <div className="haoye-gallery-frame relative overflow-hidden rounded-[2px] transition-transform duration-[1.2s] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-[1.02]">
                {cover ? (
                  <img
                    src={urlFor(cover).width(1600).quality(95).url()}
                    alt={item.title ?? `image-${index}`}
                    // 【核心修复】：手机端采用 w-[85vw] 搭配 aspect-[4/3] 保持极佳构图，桌面端 md: 保持原有设定不动
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

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 opacity-60">
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