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
  intro?: string
  body?: Array<{
    _type: string
    children?: Array<{ text: string }>
  }>
}

// ==========================================
// 🌌 核心单字粒子引擎：萤火虫与呼吸
// ==========================================
function PoemParticle({ char, index, mouseX, mouseY, isCollapsed, isTitle }: ParticleProps) {
  // 1. 预计算随机散落点
  const scatterX = useMemo(() => (Math.random() - 0.5) * (typeof window !== 'undefined' ? window.innerWidth * 1.5 : 1000), [])
  const scatterY = useMemo(() => (Math.random() - 0.5) * (typeof window !== 'undefined' ? window.innerHeight * 1.5 : 1000), [])
  const randomOffset = useMemo(() => Math.random() * Math.PI * 2, [])
  
  // 用于让萤火虫闪烁频率略有不同，显得更自然
  const twinkleSpeed = useMemo(() => 600 + Math.random() * 400, []) 

  const x = useMotionValue(scatterX)
  const y = useMotionValue(scatterY)
  const opacity = useMotionValue(0.1)
  const scale = useMotionValue(1)
  const textShadow = useMotionValue("none")

  // 标记当前字是否已经完成飞回并可以开始“整体呼吸”
  const settled = useRef(false)

  // 2. 橡皮筋阻尼弹簧
  const springConfig = isTitle 
    ? { stiffness: 80, damping: 15, mass: 1 } 
    : { stiffness: 60, damping: 15, mass: 1 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  const ref = useRef<HTMLSpanElement>(null)

  // 3. 飞回与爆光逻辑 (只管坐标弹簧和瞬间高光)
  useEffect(() => {
    if (isCollapsed) {
      settled.current = false
      const delay = index * (isTitle ? 15 : 6) 
      
      const t1 = setTimeout(() => {
        x.set(0)
        y.set(0)
        scale.set(1)
        // 瞬间爆亮（刚组合时的惊艳感）
        opacity.set(1)
        textShadow.set("0 0 20px rgba(255,255,255,0.9), 0 0 40px rgba(255,255,255,0.6)")
      }, delay)

      // 爆光 1.2 秒后，将渲染权交给平滑的“全诗呼吸引擎”
      const t2 = setTimeout(() => {
        settled.current = true
      }, delay + 1200)

      return () => { clearTimeout(t1); clearTimeout(t2) }
    } else {
      settled.current = false
    }
  }, [isCollapsed, index, x, y, opacity, scale, textShadow, isTitle])

  // 4. 高性能光影引擎（处理萤火虫、鼠标靠近、以及成诗后的呼吸）
  useAnimationFrame((time) => {
    // 【阶段三：全诗同频呼吸】
    if (isCollapsed) {
      if (settled.current) {
        // 使用统一的 time 参数计算，不加 randomOffset！
        // 这样全屏幕的所有字会像一个肺部一样，完美同步地明暗起伏
        const poemBreath = (Math.sin(time / 1500) + 1) / 2 // 3秒一个呼吸周期
        opacity.set(0.65 + poemBreath * 0.35) // 透明度在 0.65 到 1 之间柔和过渡
        const spread = 8 + poemBreath * 12
        const alpha = 0.15 + poemBreath * 0.3
        textShadow.set(`0 0 ${spread}px rgba(255, 255, 255, ${alpha})`)
      }
      return // 如果已经成诗，跳过下面的散落逻辑
    }

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
      // 【阶段二：鼠标靠近时骤亮】
      const pull = (250 - dist) / 250
      x.set(scatterX + dx * pull * 0.35)
      y.set(scatterY + dy * pull * 0.35)
      
      opacity.set(0.4 + pull * 0.6) // 快速逼近 1
      scale.set(1 + pull * 0.2)
      textShadow.set(`0 0 ${pull * 25}px rgba(255, 255, 255, ${pull * 0.9})`)
    } else {
      // 【阶段一：无人打扰时的萤火虫】
      const driftX = Math.sin(time / 1500 + randomOffset) * 15
      const driftY = Math.cos(time / 1800 + randomOffset) * 15
      x.set(scatterX + driftX)
      y.set(scatterY + driftY)
      scale.set(1)

      // 独立的闪烁：每个字根据自己的 randomOffset 和 twinkleSpeed 自由明暗
      const twinkle = (Math.sin(time / twinkleSpeed + randomOffset) + 1) / 2
      opacity.set(0.08 + twinkle * 0.42) // 基础亮度极低，亮起时明显
      textShadow.set(`0 0 ${4 + twinkle * 10}px rgba(255, 255, 255, ${0.1 + twinkle * 0.5})`)
    }
  })

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

  // 2. 交互判定与错峰挂载 (🔥 解决移动端进入卡顿的核心手术 🔥)
  useEffect(() => {
    // 给予手机浏览器 150ms 的黑屏喘息时间，让 Next.js 完成路由切换和内存回收
    const mountTimer = setTimeout(() => {
      setMounted(true) // 150ms 后，才开始往 DOM 里挂载这几百个粒子
      
      // 粒子就位后，如果是手机端，再等 800ms 触发向中心聚拢的震撼吸入效果
      if (typeof window !== 'undefined' && window.matchMedia("(pointer: coarse)").matches) {
        setTimeout(() => setIsCollapsed(true), 800)
      }
    }, 150)

    return () => clearTimeout(mountTimer)
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
  let globalIntroIndex = 0 
  let globalBodyIndex = 0

  return (
    <div className="relative min-h-[100svh] w-full flex flex-col items-center py-32 overflow-y-auto overflow-x-hidden selection:bg-[var(--site-selection-bg)] selection:text-[var(--site-selection-fg)]">
      
      <Link 
        href="/poems" 
        className="fixed top-8 left-6 md:top-12 md:left-12 z-50 p-2 text-[10px] tracking-[0.3em] text-[var(--site-text-solid)] opacity-10 transition-opacity duration-700 hover:opacity-80"
      >
        ← RETURN TO POETRY
      </Link>

      <div className="z-10 w-full max-w-[700px] px-6 text-center mt-[10vh]">
        
        {/* ================= 标题区 ================= */}
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

        {/* ================= 引言区 ================= */}
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