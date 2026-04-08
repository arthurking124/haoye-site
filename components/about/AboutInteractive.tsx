'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { motion, useMotionValue, useSpring, useAnimationFrame, useTransform, useMotionTemplate } from 'framer-motion'
import { PortableText } from '@portabletext/react'
import SignatureMark from '@/components/ui/SignatureMark'

// ---------------------------------------------------------
// 🌑 黑色主题：深渊星尘与单字物理引擎
// ---------------------------------------------------------
function CharParticle({ char, index, mouseX, mouseY, isCollapsed }: any) {
  // 预计算随机散落点 (扩大到1.5倍屏幕范围，营造深渊感)
  const scatterX = useMemo(() => (Math.random() - 0.5) * (typeof window !== 'undefined' ? window.innerWidth * 1.5 : 1000), [])
  const scatterY = useMemo(() => (Math.random() - 0.5) * (typeof window !== 'undefined' ? window.innerHeight * 1.5 : 1000), [])
  const randomOffset = useMemo(() => Math.random() * Math.PI * 2, [])

  const x = useMotionValue(scatterX)
  const y = useMotionValue(scatterY)
  const opacity = useMotionValue(0.1)
  const scale = useMotionValue(1)
  const textShadow = useMotionValue("none")

  // 橡皮筋阻尼弹簧：控制靠拢和回弹的质感
  const springConfig = { stiffness: 60, damping: 15, mass: 1 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  const ref = useRef<HTMLSpanElement>(null)

  // 核心：基于帧的高性能引力运算（不触发React重绘）
  useAnimationFrame((time) => {
    if (isCollapsed) return // 如果已经坍缩，交给下面的 useEffect 接管

    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const charX = rect.left + rect.width / 2
    const charY = rect.top + rect.height / 2

    const mx = mouseX.get()
    const my = mouseY.get()
    const dx = mx - charX
    const dy = my - charY
    const dist = Math.sqrt(dx * dx + dy * dy)

    // 探照灯与磁吸逻辑
    if (dist < 250) {
      const pull = (250 - dist) / 250
      // 微微向鼠标靠拢
      x.set(scatterX + dx * pull * 0.35)
      y.set(scatterY + dy * pull * 0.35)
      opacity.set(0.2 + pull * 0.8)
      scale.set(1 + pull * 0.2)
      textShadow.set(`0 0 ${pull * 20}px rgba(255,255,255,${pull * 0.8})`)
    } else {
      // 深渊星尘游离 (Noise Drift)
      const driftX = Math.sin(time / 1500 + randomOffset) * 15
      const driftY = Math.cos(time / 1800 + randomOffset) * 15
      x.set(scatterX + driftX)
      y.set(scatterY + driftY)
      opacity.set(0.08)
      scale.set(1)
      textShadow.set("none")
    }
  })

  // 接收到全局坍缩指令时的重组动画
  useEffect(() => {
    if (isCollapsed) {
      const delay = index * 6 // 极速错落拼装感
      const t = setTimeout(() => {
        x.set(0)
        y.set(0)
        opacity.set(1)
        scale.set(1)
        // 拼接瞬间的呼吸高光
        textShadow.set("0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,0.4)")
        setTimeout(() => { textShadow.set("none") }, 800)
      }, delay)
      return () => clearTimeout(t)
    }
  }, [isCollapsed, index, x, y, opacity, scale, textShadow])

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

function DarkAbyss({ about }: { about: any }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const mouseX = useMotionValue(-1000)
  const mouseY = useMotionValue(-1000)

  useEffect(() => {
    setMounted(true)
    // 手机端因为没有鼠标，直接延迟后进入坍缩阅读状态
    if (window.matchMedia("(pointer: coarse)").matches) {
      setTimeout(() => setIsCollapsed(true), 800)
    }
  }, [])

  useEffect(() => {
    if (!mounted || window.matchMedia("(pointer: coarse)").matches) return

    let timer: NodeJS.Timeout
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)

      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const distToCenter = Math.sqrt(Math.pow(e.clientX - cx, 2) + Math.pow(e.clientY - cy, 2))

      // 核心触发器：靠近中心 150px 范围，绝对坍缩
      if (distToCenter < 150) {
        setIsCollapsed(true)
      } else {
        setIsCollapsed(false)
        clearTimeout(timer)
        // 静止超过 1.5 秒，绝对坍缩
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

  // 提取原始文字并拆分成数组
  const textParagraphs = useMemo(() => {
    return (about?.body || []).filter((b: any) => b._type === 'block').map((block: any) => {
      return block.children?.map((c: any) => c.text).join('') || ''
    }).filter((t: string) => t.trim().length > 0)
  }, [about])

  if (!mounted) return <div className="min-h-screen" />

  let globalCharIndex = 0

  return (
    <div className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden">
      {/* 极简居中排版 */}
      <div className="z-10 max-w-[640px] px-6 text-center">
        {textParagraphs.map((para: string, pIdx: number) => (
          <p key={pIdx} className="mb-8 text-[15px] leading-[2.2] md:text-[16px] font-light tracking-[0.1em] text-[var(--site-text-solid)]">
            {para.split('').map((char, cIdx) => {
              const currentIdx = globalCharIndex++
              return (
                <CharParticle
                  key={currentIdx}
                  index={currentIdx}
                  char={char}
                  mouseX={mouseX}
                  mouseY={mouseY}
                  isCollapsed={isCollapsed}
                />
              )
            })}
          </p>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------
// ☁️ 白色主题：隐形气流与纸张呼吸
// ---------------------------------------------------------
function LightPaper({ about }: { about: any }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // 空气动力学角度映射 (极度克制的 +-8度)
  const rotateX = useTransform(mouseY, [-400, 400], [8, -8])
  const rotateY = useTransform(mouseX, [-400, 400], [-8, 8])

  // 大师级微调：阻尼振荡 (Damping Oscillation)
  const springConfig = { stiffness: 80, damping: 12, mass: 1 }
  const springRotateX = useSpring(rotateX, springConfig)
  const springRotateY = useSpring(rotateY, springConfig)

  // 动态光影追踪 (光源相反方向)
  const shadowX = useTransform(mouseX, [-400, 400], [25, -25])
  const shadowY = useTransform(mouseY, [-400, 400], [25, -25])
  const shadowBlur = useTransform(mouseX, [-400, 400], [40, 60])
  
  // 组合成带有茶色底蕴的焦散阴影
  const boxShadow = useMotionTemplate`${shadowX}px ${shadowY}px ${shadowBlur}px var(--haoye-relief-shadow)`

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    mouseX.set(e.clientX - cx)
    mouseY.set(e.clientY - cy)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '1400px' }} 
      className="min-h-[100svh] w-full flex items-center justify-center py-32 px-6"
    >
      <motion.div
        style={{ 
          rotateX: springRotateX, 
          rotateY: springRotateY, 
          boxShadow,
          transformStyle: "preserve-3d" 
        }}
        className="relative bg-[var(--haoye-white-2)] p-12 md:p-24 rounded-sm border border-[rgba(181,155,121,0.15)] max-w-[760px] w-full"
      >
        {/* 大师级微调：Z轴视差，文字悬浮在纸面之上 30px */}
        <motion.div style={{ translateZ: 30 }} className="relative z-10">
          <header className="mb-16">
            <p className="text-[11px] tracking-[0.28em] text-[var(--site-faint)] opacity-60">
              BEHIND THE DOOR
            </p>
            <h1 className="mt-4 text-[34px] font-light leading-[1.35] text-[var(--site-text-solid)] md:text-[48px] tracking-[0.02em]">
              {about.title || '我'}
            </h1>
            {about.subtitle && (
              <p className="mt-4 max-w-[560px] text-[15px] leading-[2.05] text-[var(--site-dim)]">
                {about.subtitle}
              </p>
            )}
          </header>

          <div className="haoye-about-rich border-t border-[rgba(56,47,37,0.06)] pt-12">
            {about.body ? (
              <PortableText value={about.body} />
            ) : (
              <p className="text-[15px] text-[var(--site-soft)]">这里暂时还没有留下更多内容。</p>
            )}
          </div>

          <div className="mt-20 flex justify-end opacity-80">
            <SignatureMark />
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------
// 主入口：调度器 (黑白隔离)
// ---------------------------------------------------------
export default function AboutInteractive({ about }: { about: any }) {
  return (
    <>
      <div className="haoye-dark-only">
        <DarkAbyss about={about} />
      </div>
      <div className="haoye-light-only">
        <LightPaper about={about} />
      </div>
    </>
  )
}