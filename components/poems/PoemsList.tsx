'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { urlFor } from '@/lib/sanity.image'

type PoemItem = {
  _id?: string
  title?: string
  slug?: { current?: string }
  publishedAt?: string
  intro?: string
  coverImage?: any
}

function formatPoemDate(date?: string) {
  if (!date) return null
  try {
    return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit' }).format(new Date(date))
  } catch {
    return null
  }
}

// 定义一组散落手稿的随机坐标种子 (倾斜度与 X轴偏移量)
const SCATTER_ROTATIONS = [-3.5, 2.8, -1.8, 4.2, -2.5, 1.5]
const SCATTER_X_OFFSETS = ['-6%', '10%', '-14%', '8%', '-4%', '12%']

// === 核心：单首诗歌的独立物理计算单元 (保持不变) ===
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
        style={{ 
          '--scatter-rot': `${rot}deg`,
          '--scatter-x': xOff
        } as React.CSSProperties}
      >
        <motion.div style={{ y: yText }} className="relative z-10 p-6 md:p-12 pointer-events-none">
          <div className="pointer-events-auto">
            <div className="haoye-poem-reading-content mb-8 text-[10px] tracking-[0.25em] text-[var(--site-faint)]">
              {String(index + 1).padStart(2, '0')} 
              <span className="mx-3 opacity-50">/</span> 
              {poemDate}
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
          <motion.div 
            style={{ y: yImage }} 
            className="haoye-poem-media absolute top-[10%] right-[-5%] md:right-[5%] z-0 w-[55%] md:w-[320px]"
          >
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

// === 主页面渲染列表 ===
export default function PoemsList({ poems }: { poems: PoemItem[] }) {
  const showroomRef = useRef<HTMLDivElement>(null)

  // 黑夜专属引擎：将鼠标上下滚轮转化为横向滑动
  useEffect(() => {
    const container = showroomRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      // 绝对隔离：如果是白色主题，立刻放行，不做任何拦截！
      if (document.documentElement.getAttribute('data-theme') === 'light') return

      if (container.scrollWidth > container.clientWidth) {
        e.preventDefault() 
        // 滚轮向下 -> 屏幕向左滑
        container.scrollBy({ left: e.deltaY, behavior: 'auto' })
      }
    }

    // 必须设置 passive: false 才能接管滚轮
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  return (
    <div className="haoye-poems-showroom-wrapper w-full px-6 pb-40 pt-32 overflow-hidden md:px-12 md:pb-60 md:pt-48">
      
      {/* 展厅轨道：黑夜为横向 Flex，白天恢复正常垂直块 */}
      <div ref={showroomRef} className="haoye-poems-showroom w-full">
        
        {/* 序言 */}
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

        {/* 诗歌列表：保留了白昼需要的 mb-40 等间距，黑夜则由 CSS 强行排成碑林 */}
        {poems.map((poem, index) => (
          <div key={poem._id ?? index} className="haoye-poem-track-item w-full mb-40 md:mb-56">
            <PoemCard poem={poem} index={index} />
          </div>
        ))}
        
      </div>
    </div>
  )
}