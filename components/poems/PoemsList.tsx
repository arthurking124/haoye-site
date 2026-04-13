'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform, useSpring, useAnimationFrame, useMotionValue, animate, MotionValue } from 'framer-motion'

type PoemItem = {
  _id?: string
  title?: string
  slug?: { current?: string }
  publishedAt?: string
  intro?: string
  coverImage?: any
}

interface OrbitTextItemProps {
  poem: PoemItem
  index: number
  totalPoems: number
  springCamera: MotionValue<number>
}

// ==========================================
// ☁️ 白色主题：纯物理墨水粒子引擎 & 水滴坍缩
// ==========================================
function LiquidChar({ char, isScattered, pull, stage, isClicked }: any) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const springX = useSpring(x, { stiffness: 60, damping: 15 })
  const springY = useSpring(y, { stiffness: 60, damping: 15 })

  const scatterPos = useMemo(() => ({
    x: (Math.random() - 0.5) * 300,
    y: (Math.random() - 0.5) * 200,
    rot: (Math.random() - 0.5) * 90,
    scale: 1 + Math.random() * 1.5
  }), [])

  useEffect(() => {
    if (stage !== 'idle') {
      x.set(0); y.set(0);
    } else if (isScattered) {
      x.set(scatterPos.x); y.set(scatterPos.y);
    } else {
      x.set(pull.x); y.set(pull.y);
    }
  }, [isScattered, pull, stage, isClicked, scatterPos, x, y])

  const getInkStyle = () => {
    if (stage !== 'idle') return { opacity: 0 }
    if (isScattered) {
      return {
        color: 'transparent',
        textShadow: '0px 0px 15px rgba(20, 20, 20, 0.8), 0px 0px 30px rgba(20, 20, 20, 0.4)',
        scale: scatterPos.scale,
        rotate: scatterPos.rot,
        opacity: 0.8
      }
    }
    return {
      color: '#111',
      textShadow: 'none',
      scale: 1,
      rotate: 0,
      opacity: 1
    }
  }

  return (
    <motion.span
      style={{ x: springX, y: springY, display: 'inline-block', transformOrigin: 'center' }}
      animate={getInkStyle()}
      transition={{ duration: isScattered ? 0.8 : 1.2, ease: "easeOut" }}
      className="will-change-transform"
    >
      {char === ' ' ? '\u00A0' : char}
    </motion.span>
  )
}

function LiquidPoemCard({ poem, index, globalStage, singularity, onSuckRequest }: any) {
  const chars = useMemo(() => (poem.title ?? '未命名').split(''), [poem.title])
  const cardRef = useRef<HTMLDivElement>(null)
  
  const [isScattered, setIsScattered] = useState(false)
  const [pull, setPull] = useState({ x: 0, y: 0 })
  const [isClicked, setIsClicked] = useState(false)
  const lastMouse = useRef({ x: 0, y: 0, time: 0 })

  const handlePointerMove = (e: React.PointerEvent) => {
    if (globalStage !== 'idle' || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dist = Math.hypot(e.clientX - cx, e.clientY - cy)
    
    const now = performance.now()
    const dt = now - lastMouse.current.time
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    const velocity = dt > 0 ? Math.hypot(dx, dy) / dt : 0
    lastMouse.current = { x: e.clientX, y: e.clientY, time: now }

    if (dist < 150) {
      if (velocity > 2.0) { 
        setIsScattered(true)
        setPull({ x: 0, y: 0 })
      } else if (!isScattered) {
        setPull({ x: (e.clientX - cx) * 0.08, y: (e.clientY - cy) * 0.08 })
      }
    } else {
      setIsScattered(false)
      setPull({ x: 0, y: 0 })
    }
  }

  const handlePointerLeave = () => {
    setIsScattered(false)
    setPull({ x: 0, y: 0 })
  }

  const handleClick = (e: React.MouseEvent) => {
    if (globalStage !== 'idle') return
    setIsClicked(true)
    onSuckRequest(poem.slug?.current, cardRef)
  }

  let targetX = 0, targetY = 0, targetScale = 1, targetOpacity = 1

  if (isClicked) {
    if (globalStage === 'centering' || globalStage === 'sucking') {
      targetX = window.innerWidth / 2 - (cardRef.current?.getBoundingClientRect().left ?? 0) - (cardRef.current?.getBoundingClientRect().width ?? 0) / 2
      targetY = window.innerHeight / 2 - (cardRef.current?.getBoundingClientRect().top ?? 0) - (cardRef.current?.getBoundingClientRect().height ?? 0) / 2
    }
    if (globalStage === 'imploding') {
      targetScale = 0
    }
  } else {
    if (globalStage === 'sucking' && singularity) {
      targetX = singularity.x - (cardRef.current?.getBoundingClientRect().left ?? 0) - (cardRef.current?.getBoundingClientRect().width ?? 0) / 2
      targetY = singularity.y - (cardRef.current?.getBoundingClientRect().top ?? 0) - (cardRef.current?.getBoundingClientRect().height ?? 0) / 2
      targetScale = 0
      targetOpacity = 0
    }
  }

  return (
    <motion.div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      className="relative cursor-pointer py-6 group flex flex-col items-center justify-center w-full max-w-[400px] mx-auto z-10"
      animate={{ x: targetX, y: targetY, scale: targetScale, opacity: targetOpacity }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="text-[10px] tracking-[0.25em] text-[var(--site-dim)] mb-4 transition-opacity group-hover:opacity-0" style={{ opacity: isClicked || globalStage !== 'idle' ? 0 : 1 }}>
        {String(index + 1).padStart(2, '0')}
      </div>
      
      {/* 核心修复：独立呼吸浮动层 */}
      <motion.div 
        className="relative flex justify-center items-center"
        animate={isClicked ? { 
          width: 60, height: 60, 
          borderRadius: "50%", 
          backgroundColor: "#050505", 
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          y: 0 
        } : { 
          width: "auto", height: "auto", 
          borderRadius: "0%", 
          backgroundColor: "transparent",
          boxShadow: "none",
          y: globalStage === 'idle' ? [-4 - (index % 3) * 2, 4 + (index % 3) * 2, -4 - (index % 3) * 2] : 0 
        }}
        transition={isClicked ? { duration: 0.5, ease: "easeOut" } : { 
          y: { duration: 4 + (index % 3), repeat: Infinity, ease: "easeInOut" } 
        }}
      >
        <h2 className="text-[32px] md:text-[42px] font-medium tracking-widest flex justify-center whitespace-nowrap">
          {chars.map((char: string, i: number) => (
            <LiquidChar 
              key={i} char={char} 
              isScattered={isScattered} pull={pull} 
              stage={globalStage} isClicked={isClicked} 
            />
          ))}
        </h2>
      </motion.div>
    </motion.div>
  )
}

function LightPoemsList({ poems }: { poems: PoemItem[] }) {
  const router = useRouter()
  const [globalStage, setGlobalStage] = useState<'idle'|'morphing'|'centering'|'sucking'|'imploding'>('idle')
  const [singularity, setSingularity] = useState<{x: number, y: number} | null>(null)

  const handleSuckRequest = (slug: string, originRef: React.RefObject<HTMLDivElement>) => {
    setGlobalStage('morphing')
    setTimeout(() => {
      setGlobalStage('centering')
    }, 400)
    setTimeout(() => {
      setSingularity({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
      setGlobalStage('sucking')
    }, 1000)
    setTimeout(() => {
      setGlobalStage('imploding')
    }, 1600)
    setTimeout(() => {
      router.push(`/poems/${slug}`)
    }, 2000)
  }

  return (
    <div className="relative w-full min-h-[100svh] px-6 py-32 flex flex-col items-center justify-center overflow-hidden">
      <div className="w-full flex flex-col gap-12 md:gap-16 z-10">
        {poems.map((poem, index) => (
          <LiquidPoemCard 
            key={poem._id ?? index} 
            poem={poem} index={index} 
            globalStage={globalStage}
            singularity={singularity}
            onSuckRequest={handleSuckRequest}
          />
        ))}
      </div>
    </div>
  )
}

function DarkPoemOrbit({ poems }: { poems: PoemItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  const cameraIndex = useTransform(scrollYProgress, [0, 1], [0, Math.max(0, poems.length - 1)])
  const springCamera = useSpring(cameraIndex, { damping: 30, stiffness: 80 })

  if (!poems || poems.length === 0) return null
  return (
    <div ref={containerRef} style={{ height: `${poems.length * 60}vh` }} className="relative w-full">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        {poems.map((poem, index) => (
          <OrbitTextItem key={poem._id ?? index} poem={poem} index={index} totalPoems={poems.length} springCamera={springCamera} />
        ))}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 opacity-30 pointer-events-none">
          <div className="w-[1px] h-[100px] bg-[rgba(255,255,255,0.2)] overflow-hidden">
            <motion.div style={{ height: useTransform(scrollYProgress, [0, 1], ['0%', '100%']) }} className="w-full bg-white" />
          </div>
          <span className="text-[9px] tracking-[0.2em] text-white [writing-mode:vertical-lr] mt-4">SCROLL</span>
        </div>
      </div>
    </div>
  )
}

function OrbitTextItem({ poem, index, totalPoems, springCamera }: OrbitTextItemProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const hoverProgress = useSpring(0, { stiffness: 120, damping: 20 })
  const plungeProgress = useMotionValue(0) 
  const x = useMotionValue(0); const y = useMotionValue(0)
  const scale = useMotionValue(1); const opacity = useMotionValue(0)
  const blur = useMotionValue('blur(0px)'); const zIndex = useMotionValue(0)

  const titleChars = useMemo(() => (poem.title || '未命名').split(''), [poem.title])
  const charScatters = useMemo(() => titleChars.map(() => ({
    x: (Math.random() - 0.5) * 150, y: (Math.random() - 0.5) * 150, r: (Math.random() - 0.5) * 120  
  })), [titleChars])
  
  useEffect(() => { hoverProgress.set(isHovered ? 1 : 0) }, [isHovered, hoverProgress])

  useAnimationFrame((time) => {
    const rVal = index - springCamera.get()
    const hVal = hoverProgress.get()
    const pVal = plungeProgress.get()
    const breatheScale = Math.sin(time / 1500 + index * 100) * 0.03
    const breatheOpacity = Math.sin(time / 1200 + index * 200) * 0.15
    const zVirtual = Math.max(0.1, rVal + 1)
    const angle = index * 2.1 + rVal * 0.3 
    const isDesktop = typeof window !== 'undefined' && window.innerWidth > 768
    const radiusX = isDesktop ? window.innerWidth * 0.35 : window.innerWidth * 0.45
    const radiusY = isDesktop ? window.innerHeight * 0.25 : window.innerHeight * 0.35

    const orbitX = (Math.cos(angle) * radiusX) / zVirtual
    const orbitY = (Math.sin(angle) * radiusY) / zVirtual
    let orbitScale = (1 / zVirtual) + breatheScale
    if (rVal < 0) orbitScale = 1 + Math.abs(rVal) * 1.5 + breatheScale

    let orbitOpacity = 1
    if (rVal < -0.3) orbitOpacity = 0 
    else if (rVal < 0) orbitOpacity = 1 - Math.abs(rVal) * 3 
    else if (rVal > 4) orbitOpacity = Math.max(0, 1 - (rVal - 4) * 0.2) 
    orbitOpacity = Math.min(1, Math.max(0, orbitOpacity + breatheOpacity * orbitOpacity))

    let orbitBlur = `blur(${Math.max(0, rVal - 2) * 2}px)`
    if (rVal < 0) orbitBlur = `blur(${Math.abs(rVal) * 8}px)` 

    const isMobileDevice = typeof window !== 'undefined' && window.matchMedia("(pointer: coarse)").matches
    const currentX = orbitX * (1 - hVal) + 0 * hVal
    const currentY = orbitY * (1 - hVal) + 0 * hVal
    
    const plungeScaleBoost = isMobileDevice ? 10 : 30
    const currentScale = orbitScale * (1 - hVal) + 1.2 * hVal + pVal * plungeScaleBoost
    
    let plungeOpacity = 1
    const opacityThreshold = isMobileDevice ? 0.3 : 0.6
    const opacityMultiplier = isMobileDevice ? 3.5 : 2.5
    if (pVal > opacityThreshold) plungeOpacity = 1 - (pVal - opacityThreshold) * opacityMultiplier
    
    const currentOpacity = (orbitOpacity * (1 - hVal) + 1 * hVal) * plungeOpacity

    x.set(currentX); y.set(currentY); scale.set(currentScale); opacity.set(currentOpacity)
    
    let finalBlur = 'blur(0px)'
    if (!isMobileDevice) {
      finalBlur = pVal > 0 ? `blur(${pVal * 15}px)` : (hVal > 0.5 ? 'blur(0px)' : orbitBlur)
    } else {
      finalBlur = pVal > 0 ? 'blur(0px)' : (hVal > 0.5 ? 'blur(0px)' : orbitBlur)
    }
    blur.set(finalBlur)
    zIndex.set(isHovered || pVal > 0 ? 100 : Math.round(20 - rVal))
  })

  const rotateX = useMotionValue(0); const rotateY = useMotionValue(0)
  
  const handleMouseMove = (e: React.MouseEvent | React.PointerEvent) => {
    if (!isHovered) return
    const cx = window.innerWidth / 2; const cy = window.innerHeight / 2
    const dx = (e.clientX - cx) / cx; const dy = (e.clientY - cy) / cy
    rotateX.set(-dy * 15); rotateY.set(dx * 15)
  }

  const handleTap = () => {
    if (plungeProgress.get() > 0) return 
    animate(plungeProgress, 1, { duration: 0.8, ease: "easeIn" })
    const href = poem.slug?.current ? `/poems/${poem.slug.current}` : '/poems'
    setTimeout(() => router.push(href), 700)
  }

  return (
    <motion.div
      style={{ x, y, scale, opacity, filter: blur, zIndex }}
      className="absolute flex items-center justify-center will-change-transform"
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setIsHovered(true) }}
      onPointerMove={(e) => { if (e.pointerType === 'mouse') handleMouseMove(e) }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') { setIsHovered(false); rotateX.set(0); rotateY.set(0) }
      }}
    >
      <motion.a 
        href={poem.slug?.current ? `/poems/${poem.slug.current}` : '/poems'} 
        onTap={handleTap}
        onClick={(e) => e.preventDefault()} 
        className="group block outline-none"
      >
        <motion.div 
          style={{ rotateX, rotateY, transformPerspective: 1000 }}
          className="relative flex flex-col items-center justify-center p-12 text-center"
        >
          <p className="text-[10px] tracking-[0.4em] text-[rgba(255,255,255,0.2)] mb-6 transition-colors duration-500 group-hover:text-[rgba(255,255,255,0.6)]">
            {String(index + 1).padStart(2, '0')}
          </p>
          <h2 className="text-[32px] md:text-[44px] font-light text-[rgba(255,255,255,0.65)] transition-all duration-700 group-hover:text-white group-hover:tracking-[0.25em] group-hover:text-shadow-glow flex justify-center whitespace-nowrap">
            {titleChars.map((char: string, i: number) => {
              const charX = useTransform(plungeProgress, [0, 1], [0, charScatters[i].x])
              const charY = useTransform(plungeProgress, [0, 1], [0, charScatters[i].y])
              const charR = useTransform(plungeProgress, [0, 1], [0, charScatters[i].r])
              const charOpacity = useTransform(plungeProgress, [0, 0.7, 1], [1, 0, 0])
              return (
                <motion.span key={i} style={{ x: charX, y: charY, rotate: charR, opacity: charOpacity }} className="inline-block transition-transform duration-700">
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              )
            })}
          </h2>
        </motion.div>
      </motion.a>
    </motion.div>
  )
}

export default function PoemsList({ poems }: { poems: PoemItem[] }) {
  return (
    <>
      <div className="haoye-dark-only"><DarkPoemOrbit poems={poems} /></div>
      <div className="haoye-light-only"><LightPoemsList poems={poems} /></div>
    </>
  )
}