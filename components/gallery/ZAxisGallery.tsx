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

  // 1. 锁死全局物理滚动
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // 🏆 2. 全局接管所有手势与滚轮 (降维打击浏览器默认行为)
  useEffect(() => {
    let touchStartX = 0
    let touchStartY = 0

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

    // 桌面端：接管鼠标滚轮
    const handleWheel = (e: WheelEvent) => {
      if (isThrottled.current) return
      const threshold = 30
      if (e.deltaY > threshold) triggerNext()
      else if (e.deltaY < -threshold) triggerPrev()
    }

    // 移动端：记录手指按下坐标
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    }

    // 移动端：记录手指抬起坐标并计算方向
    const handleTouchEnd = (e: TouchEvent) => {
      if (isThrottled.current) return
      
      const touchEndX = e.changedTouches[0].clientX
      const touchEndY = e.changedTouches[0].clientY
      
      const deltaX = touchStartX - touchEndX
      const deltaY = touchStartY - touchEndY
      const swipeThreshold = 40 // 滑动判定阈值

      // 判断是横向滑动还是纵向滑动
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 左右滑动
        if (deltaX > swipeThreshold) triggerNext()
        else if (deltaX < -swipeThreshold) triggerPrev()
      } else {
        // 上下滑动
        if (deltaY > swipeThreshold) triggerNext()
        else if (deltaY < -swipeThreshold) triggerPrev()
      }
    }

    // 将事件绑定到最高层级的 window，确保 100% 捕获，不被任何 DOM 元素吃掉
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [currentIndex, items.length]) // 依赖 currentIndex 保证闭包数据最新

  if (!items || items.length === 0) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-transparent touch-none select-none">
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
            {/* 👑 加入 Webkit 特有属性，彻底掐死手机端长按链接弹出的预览菜单 */}
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