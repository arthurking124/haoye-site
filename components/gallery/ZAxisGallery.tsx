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
  const touchStartY = useRef(0)

  // 核心魔法 1：入场即锁死全局滚动条，彻底切断物理世界的联系
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // 翻页逻辑：带有 1.2 秒的高级冷冻期（Cooldown），确保上一个动画完美收尾
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

  // 核心魔法 2：接管鼠标滚轮 (PC/Mac)
  const handleWheel = (e: React.WheelEvent) => {
    if (isThrottled.current) return
    const threshold = 30 // 灵敏度阈值
    if (e.deltaY > threshold) triggerNext()
    else if (e.deltaY < -threshold) triggerPrev()
  }

  // 核心魔法 3：接管手指滑动 (Mobile/Tablet)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isThrottled.current) return
    const touchEndY = e.changedTouches[0].clientY
    const deltaY = touchStartY.current - touchEndY
    const threshold = 40
    if (deltaY > threshold) triggerNext()
    else if (deltaY < -threshold) triggerPrev()
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
        // 计算每一张图片在空间中距离你的相对位置
        const distance = index - currentIndex
        const isActive = distance === 0
        const isPast = distance < 0   // 被翻过去的照片（砸向脸后消失）
        const isFuture = distance > 0 // 还没轮到的照片（在深渊里等待）

        const cover = item.images?.[0]
        const href = item.slug?.current ? `/images/${item.slug.current}` : '/images'

        // 物理坐标系：Scale 代表 Z轴深度，Opacity 代表雾气浓度
        let scale = 1
        let opacity = 1
        let blur = 'blur(0px)'
        let zIndex = 10 - Math.abs(distance)

        if (isPast) {
          // 砸向镜头的夸张透视
          scale = 1.8 + Math.abs(distance) * 0.2
          opacity = 0
          blur = 'blur(16px)'
          zIndex = 20 // 确保消失前盖在所有人脸上
        } else if (isFuture) {
          // 退避到极远的深渊
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
              pointerEvents: isActive ? 'auto' : 'none', // 只有当前照片能被点击
            }}
            transition={{
              // 国际顶级网站极其偏爱的阻尼缓动曲线 (Exponential ease-out)
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
                    className="h-[55vh] w-[80vw] max-w-[1000px] object-cover md:h-[65vh] md:w-[65vw]"
                    draggable={false} // 禁止原生拖拽破坏手感
                  />
                ) : (
                  <div className="flex h-[55vh] w-[80vw] max-w-[1000px] items-center justify-center text-[12px] tracking-[0.2em] text-[var(--site-faint)] md:h-[65vh] md:w-[65vw]">
                    NO IMAGE
                  </div>
                )}
              </div>
            </Link>

            {/* 照片信息：独立的 Y 轴浮出动画 */}
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

      {/* 极简的滚动引导仪 (Scroll Indicator) */}
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