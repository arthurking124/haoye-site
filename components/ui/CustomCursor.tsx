'use client'

import { useEffect, useState } from 'react'
import { motion, Variants } from 'framer-motion'

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [cursorVariant, setCursorVariant] = useState('default')
  const [isTouchDevice, setIsTouchDevice] = useState(true)

  useEffect(() => {
    // 触摸设备(手机/平板)不渲染自定义光标
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouchDevice(true)
      return
    }
    setIsTouchDevice(false)

    // 追踪鼠标位置
    const mouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    // 全局事件代理：嗅探鼠标下方元素并切换状态
    const mouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // 这里的逻辑保持您的初衷：按钮和链接触发中等 X 光圈，图片触发巨大 X 光圈
      if (
        target.tagName.toLowerCase() === 'button' ||
        target.closest('button') ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('a')
      ) {
        setCursorVariant('button')
      } 
      else if (target.tagName.toLowerCase() === 'img') {
        setCursorVariant('image')
      } 
      else {
        setCursorVariant('default')
      }
    }

    window.addEventListener('mousemove', mouseMove)
    window.addEventListener('mouseover', mouseOver)

    return () => {
      window.removeEventListener('mousemove', mouseMove)
      window.removeEventListener('mouseover', mouseOver)
    }
  }, [])

  if (isTouchDevice) return null

  // 核心视觉配置：所有状态均采用 difference 混合模式实现 X 光效果
  const variants: Variants = {
    default: {
      x: mousePosition.x - 6,
      y: mousePosition.y - 6,
      height: 12,
      width: 12,
      backgroundColor: '#ffffff',
      mixBlendMode: 'difference',
      transition: { type: 'spring', stiffness: 600, damping: 30, mass: 0.5 },
    },
    button: {
      x: mousePosition.x - 24,
      y: mousePosition.y - 24,
      height: 48,
      width: 48,
      backgroundColor: '#ffffff',
      mixBlendMode: 'difference',
      transition: { type: 'spring', stiffness: 500, damping: 28, mass: 0.5 },
    },
    image: {
      x: mousePosition.x - 40, // 80px 巨型 X 光圈
      y: mousePosition.y - 40,
      height: 80,
      width: 80,
      backgroundColor: '#ffffff', // 纯白背景在 difference 模式下翻转效果最强
      mixBlendMode: 'difference', // 贯彻 X 光质感
      transition: { type: 'spring', stiffness: 400, damping: 28, mass: 0.5 },
    },
  }

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[99999] rounded-full"
      variants={variants}
      animate={cursorVariant}
    />
  )
}