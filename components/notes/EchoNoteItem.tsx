'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

type NoteItemProps = {
  note: {
    _id?: string
    name?: string
    line?: string
  }
  noteIndex: number
  groupIndex: number
  basePosition?: {
    x: string
    y: string
    rotate: number
    mass: number
  }
  isDarkOnly?: boolean
}

// 调度器：黑白主题彻底分离，互不干扰
export default function EchoNoteItem(props: NoteItemProps) {
  if (props.isDarkOnly) {
    return <DarkNoteItem {...props} />
  }
  return <LightNoteItem {...props} />
}

/* =========================================
   🌑 黑色主题：原汁原味，保持不变
   ========================================= */
function DarkNoteItem({ note, noteIndex, groupIndex }: NoteItemProps) {
  const itemRef = useRef<HTMLDivElement>(null)
  const [isRippling, setIsRippling] = useState(false)
  const isNear = useRef(false)

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouchDevice) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!itemRef.current) return
      const rect = itemRef.current.getBoundingClientRect()
      const x = e.clientX - (rect.left + rect.width / 2)
      const y = e.clientY - (rect.top + rect.height / 2)
      const distance = Math.sqrt(x * x + y * y)

      if (distance < 200) {
        const intensity = 1 - distance / 200
        itemRef.current.style.setProperty('--text-opacity', `${0.6 + intensity * 0.4}`)
        itemRef.current.style.setProperty('--skew-deg', `${intensity * -3}deg`)
        if (!isNear.current) {
          isNear.current = true
          setIsRippling(true)
          setTimeout(() => setIsRippling(false), 600)
        }
      } else {
        itemRef.current.style.setProperty('--text-opacity', '0.6')
        itemRef.current.style.setProperty('--skew-deg', '0deg')
        isNear.current = false
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const rotate = (noteIndex * 7 + groupIndex * 13) % 12 - 6       
  const offsetX = (noteIndex * 11 + groupIndex * 19) % 60 - 30    
  const offsetY = (noteIndex * 8 + groupIndex * 17) % 40 - 20 
  const randomWidth = 60 + ((noteIndex * 23 + groupIndex * 17) % 40)

  return (
    <article
      ref={itemRef}
      className={`haoye-echo-note group ${isRippling ? 'is-rippling' : ''}`}
      style={{
        '--scatter-rot': `${rotate}deg`,
        '--scatter-x': `${offsetX}px`,
        '--scatter-y': `${offsetY}px`,
        '--random-w': `${randomWidth}%`,
      } as React.CSSProperties}
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
    </article>
  )
}

/* =========================================
   ☁️ 白色主题：终极三层隔离物理系统
   ========================================= */
function LightNoteItem({ note, noteIndex, groupIndex, basePosition }: NoteItemProps) {
  // 层1：绝对静止的测算锚点
  const anchorRef = useRef<HTMLDivElement>(null)

  // 层2：风力引擎，专门承接 X/Y/Rotate 的物理推力
  const xVal = useMotionValue(0)
  const yVal = useMotionValue(0)
  const rotateVal = useMotionValue(basePosition?.rotate || 0)

  // 给风力套上弹簧
  const springConfig = { stiffness: 40, damping: 12, mass: basePosition?.mass || 1 }
  const xSpring = useSpring(xVal, springConfig)
  const ySpring = useSpring(yVal, springConfig)
  const rotateSpring = useSpring(rotateVal, springConfig)

  const resetTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // 增加守卫：如果 basePosition 不存在，直接不绑定事件，同时让 TS 放心
    if (!basePosition || window.matchMedia("(pointer: coarse)").matches) return
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!anchorRef.current) return

      const rect = anchorRef.current.getBoundingClientRect()
      const anchorX = rect.left + rect.width / 2
      const anchorY = rect.top + rect.height / 2
      const dx = anchorX - e.clientX
      const dy = anchorY - e.clientY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < 400) {
        if (resetTimer.current) clearTimeout(resetTimer.current)

        const force = (400 - distance) / 400
        // 使用安全访问
        const maxPush = 350 / (basePosition.mass || 1)

        const pushX = (dx / distance) * force * maxPush
        const pushY = (dy / distance) * force * maxPush
        const pushRot = basePosition.rotate + (pushX * 0.1)

        xVal.set(pushX)
        yVal.set(pushY)
        rotateVal.set(pushRot)

        resetTimer.current = setTimeout(() => {
          xVal.set(0)
          yVal.set(0)
          rotateVal.set(basePosition.rotate)
        }, 3000)
      } else {
        xVal.set(0)
        yVal.set(0)
        rotateVal.set(basePosition.rotate)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [basePosition, xVal, yVal, rotateVal])

  // 必须放在所有 Hook 之后，确保渲染时 basePosition 一定存在
  if (!basePosition) return null

  return (
    <div
      ref={anchorRef}
      style={{ position: 'absolute', left: basePosition.x, top: basePosition.y }}
    >
      <motion.div style={{ x: xSpring, y: ySpring, rotate: rotateSpring }}>
        <motion.article
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: 'spring', stiffness: 100, damping: 18,
            delay: (groupIndex * 3 + noteIndex) * 0.12 
          }}
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.4} 
          whileHover={{ zIndex: 50 }}
          whileDrag={{ scale: 1.05, zIndex: 100, cursor: 'grabbing' }}
          className="haoye-light-note group"
        >
          <div className="haoye-echo-content">
            <h2 className="haoye-echo-title text-[18px] md:text-[22px] font-light">
              {note.name || '未命名'}
            </h2>
            <p className="haoye-echo-line text-[14px] md:text-[15px] leading-[2.08]">
              {note.line || ' '}
            </p>
          </div>
        </motion.article>
      </motion.div>
    </div>
  )
}