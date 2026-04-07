'use client'

import React, { useRef, useEffect } from 'react'
import { PortableText } from '@portabletext/react'
import { motion, useScroll, useSpring, useTransform, useMotionTemplate } from 'framer-motion'
import { urlFor } from '@/lib/sanity.image'

// 自定义 PortableText 渲染器：将文本粉碎成独立的“墨迹细胞”
const LiquidComponents = {
  block: {
    normal: ({ children }: any) => {
      return (
        <p>
          {React.Children.map(children, (child) => {
            if (typeof child === 'string') {
              // 暴力拆解：把句子拆成一个个词语或汉字
              return child.split(/(\s+)/).map((word, i) => (
                <span key={i} className="ink-word">{word}</span>
              ))
            }
            return child
          })}
        </p>
      )
    },
  },
}

export default function LiquidTextReader({ body, coverImage }: { body: any; coverImage?: any }) {
  const containerRef = useRef<HTMLDivElement>(null)

  // ==========================================
  // 引擎 1：气流物理学 (白昼专属：纸张微摆动)
  // ==========================================
  const { scrollY } = useScroll()
  const ySpring = useSpring(scrollY, { stiffness: 45, damping: 20 })
  const rotate = useTransform(ySpring, (y) => Math.sin(y / 150) * 1.5)
  const yOffset = useTransform(ySpring, (y) => Math.cos(y / 150) * 6)
  
  const airflowStyle = {
    '--airflow-rot': useMotionTemplate`${rotate}deg`,
    '--airflow-y': useMotionTemplate`${yOffset}px`
  } as React.CSSProperties

  // ==========================================
  // 引擎 2：坐标感知距离雷达 (白昼专属：液态渗墨)
  // ==========================================
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      // 只有在白昼主题（水平阅读）时才需要渗墨计算
      if (document.documentElement.getAttribute('data-theme') !== 'light') return

      const words = container.querySelectorAll('.ink-word') as NodeListOf<HTMLElement>
      const mouseX = e.clientX
      const mouseY = e.clientY
      const maxDistance = 100 // 探测半径：光标周围 100px 内的字迹会化开

      words.forEach((word) => {
        const rect = word.getBoundingClientRect()
        // 获取文字的中心坐标
        const wordX = rect.left + rect.width / 2
        const wordY = rect.top + rect.height / 2

        // 勾股定理计算直线距离
        const distance = Math.sqrt(Math.pow(mouseX - wordX, 2) + Math.pow(mouseY - wordY, 2))

        if (distance < maxDistance) {
          // 距离越近，bleed 强度越高 (1 为最高)
          const bleedStrength = 1 - (distance / maxDistance)
          word.style.setProperty('--bleed', bleedStrength.toString())
        } else {
          // 离开探测范围，墨迹缓缓干涸收缩
          word.style.setProperty('--bleed', '0')
        }
      })
    }

    // 绑定在 window 上，确保光标在页面任何地方移动都能被感知
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // ==========================================
  // 引擎 3：跨维度滚轮劫持 (黑夜专属：深渊横向漫游)
  // ==========================================
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      // 只有在黑夜（竖排）主题下，才触发这个滚轮劫持
      if (document.documentElement.getAttribute('data-theme') === 'light') return

      // 核心物理判断：如果诗歌字数很多，超出了屏幕宽度，才允许滚动
      if (container.scrollWidth > container.clientWidth) {
        e.preventDefault() // 锁死浏览器的原生上下滚动
        
        // 魔法时刻：将鼠标滚轮的上下力度 (e.deltaY)，转换为横向向左滑动的推力！
        container.scrollBy({ left: -e.deltaY, behavior: 'auto' })
      }
    }

    // 注意：passive: false 是必须的，否则现代浏览器会为了性能拦截我们对 scroll 的锁死
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])


  return (
    // 外层包装：让图片和文字在这个舞台里独立摆放
    <div className="relative w-full">

      {/* ===== 独立的底层空间 (Z轴: 0) ===== */}
      {coverImage && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          
          {/* 🌑 黑色配图：放在左边。文字在它上面滚动，形成碾压感 */}
          <div className="haoye-reader-image-dark absolute left-[5%] md:left-[10%] top-[15%] w-[40vw] max-w-[450px] opacity-30 grayscale">
            <img src={urlFor(coverImage).width(1000).quality(85).url()} alt="cover" className="w-full h-auto rounded-[1px] object-cover" />
          </div>

          {/* ☁️ 白色配图：斜贴在右边。加入浮动动画，使用 mix-blend-multiply 溶入纸张 */}
          <motion.div 
            className="haoye-reader-image-light absolute right-[0%] md:right-[5%] top-[10%] w-[280px] md:w-[320px] opacity-40 grayscale mix-blend-multiply"
            animate={{ y: [-8, 8, -8], rotate: [-4, -2, -4] }}
            transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
          >
            <img src={urlFor(coverImage).width(1000).quality(85).url()} alt="cover" className="w-full h-auto rounded-[1px] shadow-md object-cover" />
          </motion.div>

        </div>
      )}

      {/* ===== 独立的顶层空间 (Z轴: 10) ===== */}
      {/* 你的排版容器原封不动，加上 z-10 强行浮在图片上方 */}
      <motion.div 
        ref={containerRef}
        className="haoye-reader-container relative z-10"
        style={airflowStyle}
        initial={{ opacity: 0, filter: 'blur(10px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.8, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
      >
        <div className="haoye-reader-text text-[18px] md:text-[21px] cursor-crosshair">
          {/* 将 Sanity 的数据交给我们的“文本粉碎渲染器” */}
          <PortableText value={body} components={LiquidComponents} />
        </div>
      </motion.div>

    </div>
  )
}