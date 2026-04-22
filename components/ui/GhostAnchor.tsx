'use client'

import React, { useRef, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export interface GhostAnchorProps {
  id: string
  alignX: 'left' | 'right'
  alignY: 'top' | 'bottom'
  icon: React.ReactNode
  label: string
  sub: string
  isActive?: boolean
  isLight: boolean 
  onClick: () => void
}

export default function GhostAnchor({ alignX, alignY, icon, label, sub, isActive, isLight, onClick }: GhostAnchorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const hoverProgress = useSpring(0, { stiffness: 120, damping: 20 })
  const springX = useSpring(mouseX, { stiffness: 150, damping: 15, mass: 0.4 })
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15, mass: 0.4 })

  const idleOpacity = isLight ? 0.4 : 0.15 
  const textOpacity = useTransform(hoverProgress, [0, 1], [0, 1])
  const textTranslateX = useTransform(hoverProgress, [0, 1], [alignX === 'left' ? -20 : 20, 0])
  const iconOpacity = useTransform(hoverProgress, [0, 1], [idleOpacity, 1]) 

  const textColor = isLight ? 'text-[#050505]' : 'text-white'
  const subTextColor = isLight ? 'text-[#050505]/60' : 'text-white/60'
  const blendMode = isLight ? '' : 'mix-blend-difference'

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY)
      if (distance < 150) {
        mouseX.set((e.clientX - centerX) * 0.25); mouseY.set((e.clientY - centerY) * 0.25); hoverProgress.set(1)
      } else {
        mouseX.set(0); mouseY.set(0); hoverProgress.set(0)
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY, hoverProgress])

  const posClasses = `${alignY === 'top' ? 'top-6 md:top-10' : 'bottom-6 md:bottom-10'} ${alignX === 'left' ? 'left-6 md:left-10' : 'right-6 md:right-10'}`
  const flexDir = alignX === 'left' ? 'flex-row' : 'flex-row-reverse'
  const textMargin = alignX === 'left' ? 'ml-4 md:ml-6' : 'mr-4 md:mr-6'

  return (
    <motion.div className={`fixed ${posClasses} z-[100] flex items-center ${flexDir} pointer-events-auto ${blendMode} cursor-pointer`} onClick={onClick}>
      
      {/* 👑 核心修复：把 data-cursor="dot" 精准打在这个 w-10 h-10 的 Icon 容器上！ */}
      <motion.div 
        ref={ref} 
        data-cursor="dot" 
        style={{ x: springX, y: springY, opacity: isActive ? 1 : iconOpacity }} 
        className={`relative flex items-center justify-center w-10 h-10 ${textColor} transition-colors duration-500`}
      >
        {icon}
      </motion.div>

      <motion.div style={{ opacity: textOpacity, x: textTranslateX }} className={`flex flex-col justify-center ${textMargin} ${alignX === 'left' ? 'text-left' : 'text-right'} ${textColor} transition-colors duration-500`}>
        <span className="text-[12px] md:text-[14px] font-light tracking-[0.3em]">{label}</span>
        <span className={`text-[8px] font-mono tracking-[0.5em] mt-1 ${subTextColor}`}>{sub}</span>
      </motion.div>

    </motion.div>
  )
}