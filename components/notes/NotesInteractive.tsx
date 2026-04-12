'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring, useAnimationFrame, useVelocity } from 'framer-motion'
import { PortableText } from '@portabletext/react'

// =========================================================
// 🌑 黑色主题：Z 轴深海沉底瀑布流
// =========================================================
function DarkMemoryFragment({ note, index, hoveredId, setHoveredId, isMobile }: any) {
  const pseudo1 = ((index + 1) * 137.5) % 1
  const pseudo2 = ((index + 1) * 93.1) % 1
  const pseudo3 = ((index + 1) * 21.3) % 1

  const depth = pseudo1 * 0.8 + 0.1 
  const randomLeft = 20 + pseudo2 * 60; 
  const absoluteTop = `${index * 45 + 15}vh`; 

  const baseScale = 1 - depth * 0.4
  const baseBlur = depth * 15 
  const baseOpacity = (1 - depth * 0.7) * 0.5 

  const isHovered = hoveredId === note._id
  const isOtherHovered = hoveredId !== null && hoveredId !== note._id

  const targetScale = isHovered ? 1.1 : (isOtherHovered ? baseScale * 0.85 : baseScale)
  const targetBlur = isHovered ? 0 : (isOtherHovered ? baseBlur + 10 : baseBlur)
  const targetOpacity = isHovered ? 1 : (isOtherHovered ? baseOpacity * 0.2 : baseOpacity)
  
  const { scrollY } = useScroll()
  const parallaxOffset = useTransform(scrollY, (val) => val * (depth - 0.5) * 0.5)

  const cardAnimateStyle = isHovered ? { textShadow: '0 0 15px rgba(255,255,255,0.7), 0 0 3px #1e40af, 0 0 30px rgba(30,64,175,0.3)' } : {}

  return (
    <motion.div
      style={{ position: 'absolute', top: absoluteTop, left: `${randomLeft}%`, x: '-50%', y: parallaxOffset, zIndex: isHovered ? 100 : Math.floor((1 - depth) * 20) }}
      className="w-[90vw] md:w-full max-w-[420px] will-change-transform"
    >
      <motion.div animate={{ y: [-10, 10, -10], rotateZ: [-1, 1, -1] }} transition={{ repeat: Infinity, duration: 6 + depth * 5, ease: "easeInOut", delay: pseudo3 * 3 }}>
        <motion.div
          animate={{ scale: targetScale, filter: `blur(${targetBlur}px)`, opacity: targetOpacity, ...cardAnimateStyle }}
          transition={{ duration: 1.1, ease: [0.19, 1, 0.22, 1] }} 
          onMouseEnter={() => !isMobile && setHoveredId(note._id)}
          onMouseLeave={() => !isMobile && setHoveredId(null)}
          onClick={() => isMobile && setHoveredId(isHovered ? null : note._id)}
          className="text-white/80 bg-transparent p-10 relative cursor-pointer text-[14px] leading-[2.5] tracking-wide transition-all duration-[1100ms]"
        >
          <div className="flex items-center space-x-3 mb-6 opacity-60">
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_#fff]" />
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase">{note.kind || '念'} {note.name ? `// ${note.name}` : ''}</span>
          </div>
          <div className="opacity-90 whitespace-pre-wrap"><p>{note.line}</p></div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

function DarkAbyssNotes({ notes, isMobile }: { notes: any[], isMobile: boolean }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const totalHeight = `${notes.length * 45 + 50}vh`
  return (
    <div className="haoye-dark-only relative w-full overflow-hidden" style={{ minHeight: totalHeight }}>
      <div className="absolute inset-0 w-full h-full">
        {notes.map((note, idx) => (
          <DarkMemoryFragment key={`dark-${note._id}`} note={note} index={idx} hoveredId={hoveredId} setHoveredId={setHoveredId} isMobile={isMobile} />
        ))}
      </div>
    </div>
  )
}


// =========================================================
// ☁️ 白色主题：包含“墨水凝结”与精准碰撞箱的水世界
// =========================================================
function GlassShard({ note, index, hoveredId, setHoveredId, gyroForce, constraintsRef, isMobile }: any) {
  const isDragging = useRef(false)

  const pX = ((index + 1) * 17.3) % 1
  const pY = ((index + 1) * 23.9) % 1
  const pZ = ((index + 1) * 31.7) % 1
  const pR = ((index + 1) * 47.1) % 1

  const initialLeft = `${pX * 70 + 15}%` 
  const initialTop = `${pY * 70 + 15}%`
  const initialRotate = (pR - 0.5) * 40 
  
  const depth = pZ * 0.8 
  const baseScale = 1 - depth * 0.3
  const baseBlur = depth * 8
  const baseOpacity = 1 - depth * 0.6

  const cardX = useMotionValue(0)
  const cardY = useMotionValue(0)

  const velX = useVelocity(cardX)
  const velY = useVelocity(cardY)
  const rawTiltX = useTransform(velY, [-2000, 2000], [50, -50])
  const rawTiltY = useTransform(velX, [-2000, 2000], [-50, 50])
  const tiltX = useSpring(rawTiltX, { stiffness: 100, damping: 15 })
  const tiltY = useSpring(rawTiltY, { stiffness: 100, damping: 15 })

  const repelVx = useRef(0)
  const repelVy = useRef(0)

  const isHovered = hoveredId === note._id

  const rippleScale = useSpring(0, { stiffness: 50, damping: 15, mass: 1 })

  const pokeWater = () => {
    if (isMobile) return 
    rippleScale.jump(35) 
    rippleScale.set(0)
  }

  const targetScale = isHovered ? 1.05 : baseScale
  const targetBlur = isHovered ? 0 : baseBlur
  const targetOpacity = isHovered ? 1 : baseOpacity
  const targetZIndex = isHovered ? 200 : Math.floor((1 - depth) * 10)

  useAnimationFrame(() => {
    if (isDragging.current) return

    let forceX = gyroForce.current.x * (1 - depth * 0.5)
    let forceY = gyroForce.current.y * (1 - depth * 0.5)

    repelVx.current += forceX
    repelVy.current += forceY

    repelVx.current *= 0.92
    repelVy.current *= 0.92

    if (Math.abs(repelVx.current) > 0.05 || Math.abs(repelVy.current) > 0.05) {
      cardX.set(cardX.get() + repelVx.current)
      cardY.set(cardY.get() + repelVy.current)
    }
  })

  const filterId = `ink-ripple-${note._id}`

  return (
    <motion.div
      drag
      onDragStart={() => { isDragging.current = true; setHoveredId(note._id); pokeWater(); }}
      onDragEnd={() => { isDragging.current = false; if (isMobile) setHoveredId(null); }}
      
      onMouseEnter={() => {
        if (!isMobile) {
          setHoveredId(note._id);
          pokeWater();
        }
      }}
      onMouseLeave={() => !isMobile && setHoveredId(null)}
      onPointerDown={() => isMobile && setHoveredId(note._id)}
      
      // 🚀 接收动态边界：如果水箱不就绪(false)，解除限制以防止强制吸附归零
      dragConstraints={constraintsRef} 
      dragElastic={0.2} 
      dragTransition={{ power: 0.3, timeConstant: 300 }}

      style={{ 
        position: 'absolute', left: initialLeft, top: initialTop,
        x: cardX, y: cardY, 
        rotateX: tiltX, rotateY: tiltY, 
        zIndex: targetZIndex,
        touchAction: 'none'
      }}
      className="w-[260px] md:w-[320px] will-change-transform cursor-grab active:cursor-grabbing"
    >
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

      <motion.div
        animate={{ y: [-5, 5, -5], rotateZ: [initialRotate - 2, initialRotate + 2, initialRotate - 2] }}
        transition={{ repeat: Infinity, duration: 4 + depth * 3, ease: "easeInOut", delay: pX * 2 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <motion.div
          animate={{
            scale: targetScale,
            filter: `blur(${targetBlur}px)`,
            opacity: targetOpacity,
          }}
          transition={{ duration: 0.5, ease: "easeOut" }} 
          className="bg-white/20 backdrop-blur-xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-8 md:p-10 relative rounded-sm"
        >
          <div className="flex items-center space-x-3 mb-6 opacity-50">
            <div className="w-1.5 h-1.5 rounded-full bg-black shadow-[0_0_8px_rgba(0,0,0,0.3)]" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase">{note.kind || '念'} {note.name ? `// ${note.name}` : ''}</span>
          </div>
          
          <div 
            style={{ filter: `url(#${filterId})` }}
            className="opacity-90 text-[14px] leading-[2.4] tracking-wide text-black/80 pointer-events-none whitespace-pre-wrap"
          >
            <p>{note.line}</p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

function LightTankNotes({ notes, isMobile }: { notes: any[], isMobile: boolean }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const gyroForce = useRef({ x: 0, y: 0 })
  const tankRef = useRef<HTMLDivElement>(null)
  
  // 🚀 新增：水箱体积传感器
  const [tankReady, setTankReady] = useState(false)

  useEffect(() => {
    if (!tankRef.current) return
    // 监听水箱的真实尺寸
    const observer = new ResizeObserver(([entry]) => {
      // 只有当宽度大于 0 时（也就是没有被 display:none 隐藏时），才宣告水箱准备就绪
      if (entry.contentRect.width > 0) {
        setTankReady(true)
      } else {
        setTankReady(false)
      }
    })
    observer.observe(tankRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isMobile) return
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const gx = Math.max(-45, Math.min(45, e.gamma || 0))
      const gy = Math.max(-45, Math.min(45, e.beta || 0))
      gyroForce.current = { x: gx * 0.05, y: gy * 0.05 }
    }
    window.addEventListener('deviceorientation', handleOrientation)
    return () => window.removeEventListener('deviceorientation', handleOrientation)
  }, [isMobile])

  return (
    <div ref={tankRef} className="haoye-light-only fixed inset-0 w-full h-[100svh] overflow-hidden bg-transparent touch-none z-10">
      {notes.map((note, index) => (
        <GlassShard 
          key={`light-${note._id}`} 
          note={note} index={index} 
          hoveredId={hoveredId} 
          setHoveredId={setHoveredId}
          gyroForce={gyroForce}
          // 🚀 核心修复：如果水箱处于隐藏状态(false)，解除边界绑定，防止卡片互相吸附
          constraintsRef={tankReady ? tankRef : false} 
          isMobile={isMobile}
        />
      ))}
    </div>
  )
}

// =========================================================
// 主入口枢纽
// =========================================================
export default function NotesInteractive({ notes }: { notes: any[] }) {
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsMobile(window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768)
  }, [])

  if (!mounted) return <div className="min-h-screen" />

  return (
    <>
      <DarkAbyssNotes notes={notes} isMobile={isMobile} />
      <LightTankNotes notes={notes} isMobile={isMobile} />
    </>
  )
}