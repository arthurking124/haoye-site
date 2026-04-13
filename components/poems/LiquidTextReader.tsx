'use client'

import React, { useRef, useState, useEffect } from 'react'
import { PortableText } from '@portabletext/react'
import { motion, useVelocity, useSpring, useTransform, MotionValue } from 'framer-motion'

// 核心修复：接收 title 和 intro，让它们和正文一起享受物理水波和滚动阻尼！
export default function LiquidTextReader({ title, intro, body, scrollY }: { title?: string, intro?: string, body: any, scrollY: MotionValue<number> }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [filterId, setFilterId] = useState('')
  
  useEffect(() => {
    setFilterId(`poem-ripple-${Math.random().toString(36).substr(2, 9)}`)
  }, [])

  const scrollVelocity = useVelocity(scrollY) 
  
  // 1. 给 SVG 水波的绝对速度
  const absVelocity = useTransform(scrollVelocity, (v) => Math.abs(v))
  const rippleScale = useSpring(useTransform(absVelocity, [0, 800], [0, 45]), { stiffness: 60, damping: 20 })

  // 2. 给整体内容的物理拖拽（Inertia）和倾斜形变（Skew）
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 })
  const yDrag = useTransform(smoothVelocity, [-1000, 1000], [15, -15]) 
  const skewDeform = useTransform(smoothVelocity, [-1000, 1000], [1.5, -1.5]) 

  const LiquidComponents = {
    block: {
      normal: ({ children }: any) => {
        return (
          <p className="mb-12 text-[15px] md:text-[17px] opacity-90 leading-[2.6] tracking-wide text-[#2A2622] whitespace-pre-wrap">
            {children}
          </p>
        )
      },
    },
  }

  return (
    <div className="relative">
      {/* SVG 湍流水波滤镜 */}
      {filterId && (
        <svg className="hidden absolute pointer-events-none w-0 h-0">
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="noise" />
            <motion.feDisplacementMap 
              in="SourceGraphic" 
              in2="noise" 
              scale={rippleScale as any} 
              xChannelSelector="R" 
              yChannelSelector="G" 
            />
          </filter>
        </svg>
      )}

      {/* 将滤镜与物理拉扯同时注入整个容器（包含标题、引言和正文） */}
      <motion.div 
        ref={containerRef}
        style={{ 
          filter: filterId ? `url(#${filterId})` : 'none',
          y: yDrag, 
          skewY: skewDeform 
        }}
        className="relative origin-center flex flex-col items-center will-change-transform"
      >
        {/* ===============================================
            标题与引言区：现在它们拥有和正文一样的水波物理感了！
            =============================================== */}
        <header className="mb-24 flex flex-col items-center text-center w-full">
          <p className="text-[10px] tracking-[0.4em] text-[rgba(42,38,34,0.3)] mb-12">THE LIVING MANUSCRIPT</p>
          
          <h1 className="text-[32px] md:text-[44px] font-medium tracking-[0.12em] mb-8">
            《{title || '未命名'}》
          </h1>
          
          {/* 增加的引言区域：优雅的排版，稍小的字号，极宽的字距 */}
          {intro && (
            <p className="max-w-[480px] text-[13px] leading-[2.4] tracking-[0.2em] text-[#2A2622] opacity-60">
              {intro}
            </p>
          )}
        </header>

        {/* 正文区域 */}
        <div className="w-full text-left md:text-center">
          <PortableText value={body} components={LiquidComponents} />
        </div>

      </motion.div>
    </div>
  )
}