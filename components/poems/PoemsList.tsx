'use client'

import { useRef } from 'react'
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

// === 核心：单首诗歌的独立物理计算单元 ===
function PoemCard({ poem, index }: { poem: PoemItem; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  
  // 监听当前这首诗进出屏幕的相对滚动进度
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"]
  })

  // ☁️ 执行你的“物理视差层级”指令：
  // 文字层 (Text) 速度更快：从 Y轴下方 60px 向上移动到 -60px
  const yText = useTransform(scrollYProgress, [0, 1], [60, -60])
  // 剪报层 (Image) 速度更慢：只从 -15px 缓慢滑行到 15px (0.9的相对速度)
  const yImage = useTransform(scrollYProgress, [0, 1], [-15, 15])

  const rot = SCATTER_ROTATIONS[index % SCATTER_ROTATIONS.length]
  const xOff = SCATTER_X_OFFSETS[index % SCATTER_X_OFFSETS.length]
  const poemDate = formatPoemDate(poem.publishedAt)
  const href = poem.slug?.current ? `/poems/${poem.slug.current}` : '/poems'

  return (
    <motion.article
      ref={cardRef}
      className="relative w-full haoye-poem-container"
      // 整体雾气散开效果
      initial={{ opacity: 0, filter: 'blur(16px)' }}
      whileInView={{ opacity: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: "0px 0px -20% 0px" }}
      transition={{ duration: 1.8, ease: [0.19, 1, 0.22, 1] }}
    >
      <div 
        className="relative w-full max-w-[860px] mx-auto haoye-poem-layout-shift"
        style={{ 
          // 将随机坐标注入 CSS，供白色主题瞬间激活
          '--scatter-rot': `${rot}deg`,
          '--scatter-x': xOff
        } as React.CSSProperties}
      >
        
        {/* === 顶层：文字漂浮层 (Parallax: 1.0) === */}
        <motion.div style={{ y: yText }} className="relative z-10 p-6 md:p-12 pointer-events-none">
          {/* pointer-events 的精巧控制，防止层叠后阻挡图片点击 */}
          <div className="pointer-events-auto">
            
            {/* 左上角手稿编号 */}
            <div className="haoye-poem-reading-content mb-8 text-[10px] tracking-[0.25em] text-[var(--site-faint)]">
              {String(index + 1).padStart(2, '0')} 
              <span className="mx-3 opacity-50">/</span> 
              {poemDate}
            </div>

            {/* 灵魂标题：垂直呼吸深渊 vs 水平散落压印 */}
            <Link href={href} className="inline-block">
              <h2 className="haoye-poem-monolith text-[32px] md:text-[48px] tracking-widest leading-[1.6]">
                《{poem.title ?? '未命名'}》
              </h2>
            </Link>

            {/* 摘要文案区 */}
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

        {/* === 底层：剪报滑行层 (Parallax: 0.9) === */}
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
  return (
    <div className="w-full px-6 pb-40 pt-32 overflow-hidden md:px-12 md:pb-60 md:pt-48">
      
      {/* 极简序言 */}
      <motion.header
        initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
        animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
        transition={{ duration: 1.6, ease: [0.19, 1, 0.22, 1] }}
        className="mx-auto mb-32 max-w-[1080px] md:mb-48"
      >
        <p className="text-[10px] tracking-[0.3em] text-[var(--site-faint)]">POETRY ROOM</p>
        <h1 className="mt-8 text-[38px] font-light leading-[1.2] tracking-widest text-[var(--site-text-solid)] md:text-[56px]">诗</h1>
        <p className="mt-6 text-[14px] leading-[2.2] text-[var(--site-dim)] md:text-[15px]">没有说完的话，被留在这里。</p>
      </motion.header>

      {/* 将诗歌投射进独立计算的视差组件中 */}
      <div className="relative w-full">
        {poems.map((poem, index) => (
          <PoemCard key={poem._id ?? index} poem={poem} index={index} />
        ))}
      </div>
    </div>
  )
}