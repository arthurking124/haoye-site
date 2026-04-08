'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, useMotionValue, useSpring, useAnimationFrame, MotionValue } from 'framer-motion'

// ==========================================
// 🌌 类型定义
// ==========================================
interface ParticleProps {
  char: string
  index: number
  mouseX: MotionValue<number>
  mouseY: MotionValue<number>
  isCollapsed: boolean
  isTitle: boolean
}

interface PoemData {
  title?: string
  intro?: string // 【新增】：加入引言的数据类型
  body?: Array<{
    _type: string
    children?: Array<{ text: string }>
  }>
}

// ==========================================
// 🌌 核心单字粒子引擎：深渊星尘与瞬间重组 (一字未改，保持完美稳定)
// ==========================================
function PoemParticle({ char, index, mouseX, mouseY, isCollapsed, isTitle }: ParticleProps) {
  // 1. 预计算随机散落点 (扩大到1.5倍屏幕范围，营造深渊感)
  const scatterX = useMemo(() => (Math.random() - 0.5) * (typeof window !== 'undefined' ? window.innerWidth * 1.5 : 1000), [])
  const scatterY = useMemo(() => (Math.random() - 0.5) * (typeof window !== 'undefined' ? window.innerHeight * 1.5 : 1000), [])
  const randomOffset = useMemo(() => Math.random() * Math.PI * 2, [])

  const x = useMotionValue(scatterX)
  const y = useMotionValue(scatterY)
  const opacity = useMotionValue(0.1)
  const scale = useMotionValue(1)
  const textShadow = useMotionValue("none")

  // 2. 橡皮筋阻尼弹簧：确保飞回时丝滑、稳定
  const springConfig = isTitle 
    ? { stiffness: 80, damping: 15, mass: 1 } 
    : { stiffness: 60, damping: 15, mass: 1 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  const ref = useRef<HTMLSpanElement>(null)

  // 3. 高性能引力运算（探照灯与漂浮）
  useAnimationFrame((time) => {
    if (isCollapsed) return // 坍缩后停止游离

    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const charX = rect.left + rect.width / 2
    const charY = rect.top + rect.height / 2

    const mx = mouseX.get()
    const my = mouseY.get()
    const dx = mx - charX
    const dy = my - charY
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < 250) {
      const pull = (250 - dist) / 250
      x.set(scatterX + dx * pull * 0.35)
      y.set(scatterY + dy * pull * 0.35)
      opacity.set(0.2 + pull * 0.8)
      scale.set(1 + pull * 0.2)
      textShadow.set(`0 0 ${pull * 20}px rgba(255,255,255,${pull * 0.8})`)
    } else {
      const driftX = Math.sin(time / 1500 + randomOffset) * 15
      const driftY = Math.cos(time / 1800 + randomOffset) * 15
      x.set(scatterX + driftX)
      y.set(scatterY + driftY)
      opacity.set(0.08)
      scale.set(1)
      textShadow.set("none")
    }
  })

  // 4. 坍缩归位
  useEffect(() => {
    if (isCollapsed) {
      const delay = index * (isTitle ? 15 : 6) 
      const t = setTimeout(() => {
        x.set(0)
        y.set(0)
        opacity.set(0.9)
        scale.set(1)
        textShadow.set("0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,0.4)")
        setTimeout(() => { 
          textShadow.set(isTitle ? "0 0 15px rgba(255,255,255,0.2)" : "none") 
        }, 800)
      }, delay)
      return () => clearTimeout(t)
    }
  }, [isCollapsed, index, x, y, opacity, scale, textShadow, isTitle])

  return (
    <motion.span
      ref={ref}
      style={{ x: springX, y: springY, opacity, scale, textShadow }}
      className="inline-block whitespace-pre transition-colors"
    >
      {char}
    </motion.span>
  )
}

// ==========================================
// 🌌 主组件：严格解析诗歌结构（节 -> 行 -> 字）
// ==========================================
export default function DarkPoemInteractive({ poem }: { poem: PoemData }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const mouseX = useMotionValue(-1000)
  const mouseY = useMotionValue(-1000)

  // 1. 数据清洗升级版
  const titleChars = useMemo(() => (poem.title || '无题').split(''), [poem.title])
  // 【新增】：提取引言字符
  const introChars = useMemo(() => (poem.intro || '').split(''), [poem.intro])
  
  const stanzas = useMemo(() => {
    return (poem.body || [])
      .filter((b: any) => b._type === 'block')
      .map((block: any) => {
        const fullText = block.children?.map((c: any) => c.text).join('') || ''
        return fullText.split('\n')
      })
      .filter((lines: string[]) => lines.join('').trim().length > 0)
  }, [poem])

  // 2. 交互判定
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined' && window.matchMedia("(pointer: coarse)").matches) {
      setTimeout(() => setIsCollapsed(true), 800)
    }
  }, [])

  useEffect(() => {
    if (!mounted || (typeof window !== 'undefined' && window.matchMedia("(pointer: coarse)").matches)) return

    let timer: NodeJS.Timeout
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)

      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const distToCenter = Math.sqrt(Math.pow(e.clientX - cx, 2) + Math.pow(e.clientY - cy, 2))

      if (distToCenter < 150) {
        setIsCollapsed(true)
      } else {
        setIsCollapsed(false)
        clearTimeout(timer)
        timer = setTimeout(() => {
          setIsCollapsed(true)
        }, 1500)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      clearTimeout(timer)
    }
  }, [mounted, mouseX, mouseY])

  if (!mounted) return <div className="min-h-screen" />

  let globalTitleIndex = 0
  let globalIntroIndex = 0 // 【新增】：引言的独立动画延迟索引
  let globalBodyIndex = 0

  return (
    <div className="relative min-h-[100svh] w-full flex flex-col items-center py-32 overflow-y-auto overflow-x-hidden selection:bg-[var(--site-selection-bg)] selection:text-[var(--site-selection-fg)]">
      
      {/* 【新增】：幽灵返回按钮 */}
      <Link 
        href="/poems" 
        className="fixed top-8 left-6 md:top-12 md:left-12 z-50 p-2 text-[10px] tracking-[0.3em] text-[var(--site-text-solid)] opacity-10 transition-opacity duration-700 hover:opacity-80"
      >
        ← RETURN TO POETRY
      </Link>

      <div className="z-10 w-full max-w-[700px] px-6 text-center mt-[10vh]">
        
        {/* ================= 标题区 ================= */}
        {/* 修改：将 mb-24 缩减为 mb-8，为下方的引言留出紧凑的空间 */}
        <h1 className="mb-8 text-[26px] md:text-[34px] font-light tracking-[0.2em] text-[var(--site-text-solid)]">
          {titleChars.map((char: string) => {
            const currentIdx = globalTitleIndex++
            return (
              <PoemParticle
                key={`title-${currentIdx}`}
                index={currentIdx}
                char={char === ' ' ? '\u00A0' : char}
                mouseX={mouseX}
                mouseY={mouseY}
                isCollapsed={isCollapsed}
                isTitle={true}
              />
            )
          })}
        </h1>

        {/* ================= 【新增】引言区 ================= */}
        {introChars.length > 0 && (
          <p className="mb-24 max-w-[480px] mx-auto text-[12px] md:text-[13px] leading-[2.2] font-light tracking-[0.3em] text-[var(--site-dim)] opacity-70">
            {introChars.map((char: string) => {
              const currentIdx = globalIntroIndex++
              return (
                <PoemParticle
                  key={`intro-${currentIdx}`}
                  index={currentIdx}
                  char={char === ' ' ? '\u00A0' : char}
                  mouseX={mouseX}
                  mouseY={mouseY}
                  isCollapsed={isCollapsed}
                  // 使用 isTitle=false，让它拥有和正文一样柔和的回弹和低亮度
                  isTitle={false} 
                />
              )
            })}
          </p>
        )}

        {/* ================= 正文区 (节 -> 行 -> 字) ================= */}
        <div className="flex flex-col items-center w-full">
          {stanzas.map((lines: string[], sIdx: number) => (
            <div key={`stanza-${sIdx}`} className="mb-14 flex flex-col items-center w-full">
              
              {lines.map((line: string, lIdx: number) => (
                <div key={`line-${lIdx}`} className="mb-3 flex flex-wrap justify-center w-full max-w-[600px] text-[15px] leading-[2.2] md:text-[16px] font-light tracking-[0.1em] text-[var(--site-text-solid)]">
                  
                  {line.trim() === '' ? (
                    <span className="h-6 w-full block" />
                  ) : (
                    line.split('').map((char: string) => {
                      const currentIdx = globalBodyIndex++
                      return (
                        <PoemParticle
                          key={`body-${currentIdx}`}
                          index={currentIdx}
                          char={char === ' ' ? '\u00A0' : char}
                          mouseX={mouseX}
                          mouseY={mouseY}
                          isCollapsed={isCollapsed}
                          isTitle={false}
                        />
                      )
                    })
                  )}

                </div>
              ))}
            </div>
          ))}
        </div>
        
      </div>
    </div>
  )
}