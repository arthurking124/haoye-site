'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type NoteItemProps = {
  note: {
    _id?: string
    name?: string
    line?: string
  }
  noteIndex: number
  groupIndex: number
}

export default function EchoNoteItem({ note, noteIndex, groupIndex }: NoteItemProps) {
  const itemRef = useRef<HTMLDivElement>(null)
  // 👉 增加涟漪状态控制
  const [isRippling, setIsRippling] = useState(false)
  const isNear = useRef(false)

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouchDevice) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!itemRef.current) return
      
      if (document.documentElement.getAttribute('data-theme') === 'light') {
        itemRef.current.style.setProperty('--text-opacity', '1')
        itemRef.current.style.setProperty('--skew-deg', '0deg')
        return
      }

      const rect = itemRef.current.getBoundingClientRect()
      const x = e.clientX - (rect.left + rect.width / 2)
      const y = e.clientY - (rect.top + rect.height / 2)
      const distance = Math.sqrt(x * x + y * y)

      if (distance < 200) {
        const intensity = 1 - distance / 200
        itemRef.current.style.setProperty('--text-opacity', `${0.6 + intensity * 0.4}`)
        itemRef.current.style.setProperty('--skew-deg', `${intensity * -3}deg`)
        
        // 👉 核心修复：触碰瞬间触发“引力波爆破”，而不是持续发光
        if (!isNear.current) {
          isNear.current = true
          setIsRippling(true)
          // 600ms后重置涟漪，准备下一次触发
          setTimeout(() => setIsRippling(false), 600)
        }
      } else {
        itemRef.current.style.setProperty('--text-opacity', '0.6')
        itemRef.current.style.setProperty('--skew-deg', '0deg')
        isNear.current = false // 离开半径，重置触发器
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // 白色主题散落逻辑
  const rotate = (noteIndex * 7 + groupIndex * 13) % 12 - 6       
  const offsetX = (noteIndex * 11 + groupIndex * 19) % 60 - 30    
  const offsetY = (noteIndex * 8 + groupIndex * 17) % 40 - 20 

  // 👉 核心修复：黑色主题非线性错落流的“随机宽度”（60% 到 100% 之间）
  const randomWidth = 60 + ((noteIndex * 23 + groupIndex * 17) % 40)

  return (
    <motion.article
      ref={itemRef}
      initial={{ opacity: 0, y: -40, rotate: rotate - 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, rotate: rotate, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 120, 
        damping: 14,    
        mass: 0.8,      
        delay: (groupIndex * 3 + noteIndex) * 0.08 
      }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.25} 
      whileDrag={{ scale: 1.03, zIndex: 50, cursor: 'grabbing' }}
      // 👉 增加 ripple 类名控制
      className={`haoye-echo-note group ${isRippling ? 'is-rippling' : ''}`}

    >
      <div className="haoye-echo-content">
        <div className="haoye-echo-wave"></div>
        <h2 className="haoye-echo-title text-[18px] md:text-[22px] font-light">
          {note.name || '未命名'}
        </h2>
        <p className="haoye-echo-line text-[14px] md:text-[15px] leading-[2.08]">
          {note.line || ' '}
        </p>
      </div>
    </motion.article>
  )
}