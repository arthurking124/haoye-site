'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function PageShell({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)

  // 1. 动态检测是否为移动端
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    // 2. 核心修复：移除会遮挡底层的背景色，确保它是透明的！
    // 强制使用 bg-transparent，让底层的 FluidBackground 能够透出来
    <motion.main
      // 3. 核心修复：针对手机端和 PC 端做动画分级！
      // 手机端：去除会导致 iOS 渲染白块的 blur 和极端的 scale: 0.3，改为轻微的缩放和纯透明度渐变
      // PC 端：保留你原本高级的景深模糊和大幅度缩放
      initial={
        isMobile 
          ? { opacity: 0, scale: 0.95 } 
          : { opacity: 0, scale: 0.8, filter: 'blur(20px)' }
      }
      animate={
        isMobile 
          ? { opacity: 1, scale: 1 } 
          : { opacity: 1, scale: 1, filter: 'blur(0px)' }
      }
      exit={
        isMobile 
          ? { opacity: 0, scale: 0.95 } 
          : { opacity: 0, scale: 0.9, filter: 'blur(15px)' }
      }
      transition={{
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1], // 高级的 Apple 阻尼曲线
      }}
      // 4. 打破层叠囚笼：去掉 overflow-hidden 等限制性 class，确保内部 Canvas 不会被裁剪
      className="relative w-full min-h-screen bg-transparent origin-center flex flex-col"
      
      // 告诉浏览器优先处理复合层，避免闪烁
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.main>
  )
}