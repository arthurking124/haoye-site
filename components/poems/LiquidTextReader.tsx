'use client'

import React, { useRef, useState, useEffect } from 'react'
import { PortableText } from '@portabletext/react'
import { motion, useVelocity, useSpring, useTransform, MotionValue } from 'framer-motion'

export default function LiquidTextReader({ title, intro, body, scrollY }: { title?: string, intro?: string, body: any, scrollY: MotionValue<number> }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [filterId, setFilterId] = useState('')
  
  useEffect(() => {
    setFilterId(`poem-ripple-${Math.random().toString(36).substring(2, 11)}`)
  }, [])

  const scrollVelocity = useVelocity(scrollY) 
  
  const absVelocity = useTransform(scrollVelocity, (v) => Math.abs(v))
  const rippleScale = useSpring(useTransform(absVelocity, [0, 800], [0, 45]), { stiffness: 60, damping: 20 })

  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 })
  const yDrag = useTransform(smoothVelocity, [-1000, 1000], [15, -15]) 
  const skewDeform = useTransform(smoothVelocity, [-1000, 1000], [1.5, -1.5]) 

  const LiquidComponents = {
    block: {
      normal: ({ children }: any) => {
        return (
          <p className="mb-8 md:mb-12 text-[14px] md:text-[17px] opacity-90 leading-[2.4] md:leading-[2.6] tracking-wide text-[#2A2622] whitespace-pre-wrap">
            {children}
          </p>
        )
      },
    },
  }

  return (
    <div className="relative">
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

      <motion.div 
        ref={containerRef}
        style={{ 
          filter: filterId ? `url(#${filterId})` : 'none',
          y: yDrag, 
          skewY: skewDeform 
        }}
        className="relative origin-center flex flex-col items-center will-change-transform"
      >
        <header className="mb-16 md:mb-24 flex flex-col items-center text-center w-full">
          <p className="text-[10px] tracking-[0.4em] text-[rgba(42,38,34,0.3)] mb-8 md:mb-12">THE LIVING MANUSCRIPT</p>
          
          <h1 className="text-[24px] md:text-[44px] font-medium tracking-[0.12em] mb-6 md:mb-8">
            《{title || '未命名'}》
          </h1>
          
          {intro && (
            <p className="max-w-[480px] text-[12px] md:text-[13px] leading-[2.2] md:leading-[2.4] tracking-[0.2em] text-[#2A2622] opacity-60">
              {intro}
            </p>
          )}
        </header>

        <div className="w-full text-left md:text-center">
          <PortableText value={body} components={LiquidComponents} />
        </div>

      </motion.div>
    </div>
  )
}