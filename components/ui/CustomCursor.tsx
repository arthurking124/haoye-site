'use client'

import { useEffect, useState } from 'react'
// 👉 修复点 1：引入 Variants 类型
import { motion, Variants } from 'framer-motion'

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [cursorVariant, setCursorVariant] = useState('default')
  const [isTouchDevice, setIsTouchDevice] = useState(true)

  useEffect(() => {
    // 核心安全策略：如果是触摸设备(手机/平板)，彻底不渲染这个组件
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouchDevice(true)
      return
    }
    setIsTouchDevice(false)

    // 追踪鼠标位置
    const mouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    // 全局事件代理：嗅探鼠标下方是什么元素
    const mouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // 如果鼠标放在了 button, a 标签，或者是它们的子元素上
      if (
        target.tagName.toLowerCase() === 'button' ||
        target.closest('button') ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('a')
      ) {
        setCursorVariant('button')
      } 
      // 如果鼠标放在了图片上 (为你的《影》栏目准备)
      else if (target.tagName.toLowerCase() === 'img') {
        setCursorVariant('image')
      } 
      // 其他普通状态
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

  // 移动端不加载任何自定义光标
  if (isTouchDevice) return null

  // 👉 修复点 2：明确告诉 TypeScript 这是一个 Variants 类型的对象
  const variants: Variants = {
    default: {
      x: mousePosition.x - 6, // 12px 圆的中心点偏移
      y: mousePosition.y - 6,
      height: 12,
      width: 12,
      backgroundColor: '#ffffff',
      mixBlendMode: 'difference',
      transition: { type: 'spring', stiffness: 600, damping: 30, mass: 0.5 },
    },
    button: {
      x: mousePosition.x - 24, // 放大到 48px
      y: mousePosition.y - 24,
      height: 48,
      width: 48,
      backgroundColor: '#ffffff',
      mixBlendMode: 'difference',
      transition: { type: 'spring', stiffness: 500, damping: 28, mass: 0.5 },
    },
    image: {
      x: mousePosition.x - 40, // 放大到 80px 作为画廊放大镜
      y: mousePosition.y - 40,
      height: 80,
      width: 80,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      mixBlendMode: 'normal',
      backdropFilter: 'blur(4px)',
      transition: { type: 'spring', stiffness: 400, damping: 28, mass: 0.5 },
    },
  }

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[99999] flex items-center justify-center rounded-full"
      variants={variants}
      animate={cursorVariant}
    >
      {/* 只有在悬停图片时，中央才会浮现 VIEW 探索字样 */}
      {cursorVariant === 'image' && (
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-[10px] font-medium tracking-widest text-black"
        >
          VIEW
        </motion.span>
      )}
    </motion.div>
  )
}