'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform, useSpring, useAnimationFrame, useMotionValue, animate, MotionValue } from 'framer-motion'
import { urlFor } from '@/lib/sanity.image'

type PoemItem = {
  _id?: string
  title?: string
  slug?: { current?: string }
  publishedAt?: string
  intro?: string
  coverImage?: any
}

// 定义 OrbitTextItem 的 Props 接口
interface OrbitTextItemProps {
  poem: PoemItem
  index: number
  totalPoems: number
  springCamera: MotionValue<number>
}

function formatPoemDate(date?: string) {
  if (!date) return null
  try {
    return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit' }).format(new Date(date))
  } catch {
    return null
  }
}

// ==========================================
// ☁️ 白色主题：原汁原味的散落手稿 (绝对结界保护，一字未改)
// ==========================================
const SCATTER_ROTATIONS = [-3.5, 2.8, -1.8, 4.2, -2.5, 1.5]
const SCATTER_X_OFFSETS = ['-6%', '10%', '-14%', '8%', '-4%', '12%']

function PoemCard({ poem, index }: { poem: PoemItem; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"]
  })

  const yText = useTransform(scrollYProgress, [0, 1], [60, -60])
  const yImage = useTransform(scrollYProgress, [0, 1], [-15, 15])

  const rot = SCATTER_ROTATIONS[index % SCATTER_ROTATIONS.length]
  const xOff = SCATTER_X_OFFSETS[index % SCATTER_X_OFFSETS.length]
  const poemDate = formatPoemDate(poem.publishedAt)
  const href = poem.slug?.current ? `/poems/${poem.slug.current}` : '/poems'

  return (
    <motion.article
      ref={cardRef}
      className="relative w-full haoye-poem-container"
      initial={{ opacity: 0, filter: 'blur(16px)' }}
      whileInView={{ opacity: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: "0px 0px -20% 0px" }}
      transition={{ duration: 1.8, ease: [0.19, 1, 0.22, 1] }}
    >
      <div 
        className="relative w-full max-w-[860px] mx-auto haoye-poem-layout-shift"
        style={{ '--scatter-rot': `${rot}deg`, '--scatter-x': xOff } as React.CSSProperties}
      >
        <motion.div style={{ y: yText }} className="relative z-10 p-6 md:p-12 pointer-events-none">
          <div className="pointer-events-auto">
            <div className="haoye-poem-reading-content mb-8 text-[10px] tracking-[0.25em] text-[var(--site-faint)]">
              {String(index + 1).padStart(2, '0')} <span className="mx-3 opacity-50">/</span> {poemDate}
            </div>
            <Link href={href} className="inline-block">
              <h2 className="haoye-poem-monolith text-[32px] md:text-[48px] tracking-widest leading-[1.6]">
                《{poem.title ?? '未命名'}》
              </h2>
            </Link>
            <div className="haoye-poem-reading-content mt-8 max-w-[480px]">
              {poem.intro && (
                <p className="text-[14px] leading-[2.2] text-[var(--site-soft)] md:text-[15px]">
                  {poem.intro}
                </p>
              )}
              <div className="mt-10">
                <Link href={href} className="inline-flex items-center gap-4 text-[10px] tracking-[0.3em] text-[var(--site-soft)] transition-colors hover:text-[var(--site-text-solid)]">
                  <span>READ POEM</span>
                  <span className="translate-y-[-1px] transition-transform group-hover:translate-x-[4px]">—</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
        {poem.coverImage && (
          <motion.div style={{ y: yImage }} className="haoye-poem-media absolute top-[10%] right-[-5%] md:right-[5%] z-0 w-[55%] md:w-[320px]">
            <img
              src={urlFor(poem.coverImage).width(800).quality(90).url()}
              alt={poem.title}
              className="haoye-poem-clipping w-full h-auto"
            />
          </motion.div>
        )}
      </div>
    </motion.article>
  )
}

function LightPoemsList({ poems }: { poems: PoemItem[] }) {
  return (
    <div className="haoye-poems-showroom-wrapper w-full px-6 pb-40 pt-32 overflow-hidden md:px-12 md:pb-60 md:pt-48">
      <div className="haoye-poems-showroom w-full">
        <motion.header
          initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: 1.6, ease: [0.19, 1, 0.22, 1] }}
          className="haoye-poems-header mx-auto mb-32 max-w-[1080px] md:mb-48"
        >
          <p className="text-[10px] tracking-[0.3em] text-[var(--site-faint)]">POETRY ROOM</p>
          <h1 className="mt-8 text-[38px] font-light leading-[1.2] tracking-widest text-[var(--site-text-solid)] md:text-[56px]">诗</h1>
          <p className="mt-6 text-[14px] leading-[2.2] text-[var(--site-dim)] md:text-[15px]">没有说完的话，被留在这里。</p>
        </motion.header>
        {poems.map((poem, index) => (
          <div key={poem._id ?? index} className="haoye-poem-track-item w-full mb-40 md:mb-56">
            <PoemCard poem={poem} index={index} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ==========================================
// 🌑 黑色主题核心组件：极致 Anti-UI 纯文字星轨 (带有呼吸感与坠入引擎)
// ==========================================
function OrbitTextItem({ poem, index, totalPoems, springCamera }: OrbitTextItemProps) {
  const router = useRouter()
  
  const [isHovered, setIsHovered] = useState(false)
  const hoverProgress = useSpring(0, { stiffness: 120, damping: 20 })
  const plungeProgress = useMotionValue(0) 
  
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  const opacity = useMotionValue(0)
  const blur = useMotionValue('blur(0px)')
  const zIndex = useMotionValue(0)

  const titleChars = useMemo(() => (poem.title || '未命名').split(''), [poem.title])
  
  // 预计算炸裂坐标
  const charScatters = useMemo(() => {
    return titleChars.map(() => ({
      x: (Math.random() - 0.5) * 150, 
      y: (Math.random() - 0.5) * 150, 
      r: (Math.random() - 0.5) * 120  
    }))
  }, [titleChars])
  
  useEffect(() => {
    hoverProgress.set(isHovered ? 1 : 0)
  }, [isHovered, hoverProgress])

  // 核心物理引擎：星空轨道 + 生物呼吸 + 跃迁坠入
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

    const currentX = orbitX * (1 - hVal) + 0 * hVal
    const currentY = orbitY * (1 - hVal) + 0 * hVal
    
    const currentScale = orbitScale * (1 - hVal) + 1.2 * hVal + pVal * 30
    
    let plungeOpacity = 1
    if (pVal > 0.6) plungeOpacity = 1 - (pVal - 0.6) * 2.5
    const currentOpacity = (orbitOpacity * (1 - hVal) + 1 * hVal) * plungeOpacity

    x.set(currentX)
    y.set(currentY)
    scale.set(currentScale)
    opacity.set(currentOpacity)
    
    blur.set(pVal > 0 ? `blur(${pVal * 15}px)` : (hVal > 0.5 ? 'blur(0px)' : orbitBlur))
    zIndex.set(isHovered || pVal > 0 ? 100 : Math.round(20 - rVal))
  })

  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isHovered) return
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    const dx = (e.clientX - cx) / cx
    const dy = (e.clientY - cy) / cy
    rotateX.set(-dy * 15) 
    rotateY.set(dx * 15)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    rotateX.set(0)
    rotateY.set(0)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (plungeProgress.get() > 0) return 
    
    animate(plungeProgress, 1, { duration: 0.8, ease: "easeIn" })
    
    const href = poem.slug?.current ? `/poems/${poem.slug.current}` : '/poems'
    setTimeout(() => {
      router.push(href)
    }, 700)
  }

  return (
    <motion.div
      style={{ x, y, scale, opacity, filter: blur, zIndex }}
      className="absolute flex items-center justify-center will-change-transform"
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <a href={poem.slug?.current ? `/poems/${poem.slug.current}` : '/poems'} onClick={handleClick} className="group block outline-none">
        
        <motion.div 
          style={{ rotateX, rotateY, transformPerspective: 1000 }}
          className="relative flex flex-col items-center justify-center p-12 text-center"
        >
          <p className="text-[10px] tracking-[0.4em] text-[rgba(255,255,255,0.2)] mb-6 transition-colors duration-500 group-hover:text-[rgba(255,255,255,0.6)]">
            {String(index + 1).padStart(2, '0')}
          </p>
          
          <h2 className="text-[32px] md:text-[44px] font-light text-[rgba(255,255,255,0.65)] transition-all duration-700 group-hover:text-white group-hover:tracking-[0.25em] group-hover:text-shadow-glow flex justify-center whitespace-nowrap">
            {/* 核心修正：标注 char: string 和 i: number 解决 TS7006 报错 */}
            {titleChars.map((char: string, i: number) => {
              const charX = useTransform(plungeProgress, [0, 1], [0, charScatters[i].x])
              const charY = useTransform(plungeProgress, [0, 1], [0, charScatters[i].y])
              const charR = useTransform(plungeProgress, [0, 1], [0, charScatters[i].r])
              const charOpacity = useTransform(plungeProgress, [0, 0.7, 1], [1, 0, 0])
              
              return (
                <motion.span
                  key={i}
                  style={{ x: charX, y: charY, rotate: charR, opacity: charOpacity }}
                  className="inline-block transition-transform duration-700"
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              )
            })}
          </h2>
          
        </motion.div>
      </a>
    </motion.div>
  )
}

// ==========================================
// 🌑 黑色主题：失重星轨深渊画布
// ==========================================
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
          <OrbitTextItem 
            key={poem._id ?? index} 
            poem={poem} 
            index={index} 
            totalPoems={poems.length} 
            springCamera={springCamera} 
          />
        ))}

        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 opacity-30 pointer-events-none">
          <div className="w-[1px] h-[100px] bg-[rgba(255,255,255,0.2)] overflow-hidden">
            <motion.div 
              style={{ height: useTransform(scrollYProgress, [0, 1], ['0%', '100%']) }}
              className="w-full bg-white"
            />
          </div>
          <span className="text-[9px] tracking-[0.2em] text-white [writing-mode:vertical-lr] mt-4">SCROLL</span>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 主出口：黑白分发器
// ==========================================
export default function PoemsList({ poems }: { poems: PoemItem[] }) {
  return (
    <>
      <div className="haoye-dark-only">
        <DarkPoemOrbit poems={poems} />
      </div>
      <div className="haoye-light-only">
        <LightPoemsList poems={poems} />
      </div>
    </>
  )
}