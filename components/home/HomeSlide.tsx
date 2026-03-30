'use client'

import Link from 'next/link'

type HomeSlideProps = {
  imageUrl?: string
  text?: string
  signature?: string
  domainText?: string
  align?: 'left' | 'right' | 'center'
  isLast?: boolean
  index?: number
  total?: number
  active?: boolean
  mobile?: boolean
}

export default function HomeSlide({
  imageUrl,
  text,
  signature = '皓野',
  domainText = 'haoye.cyou',
  align = 'left',
  isLast = false,
  index = 0,
  total = 4,
  active = false,
  mobile = false,
}: HomeSlideProps) {
  const basePosition =
    align === 'left'
      ? mobile
        ? 'left-[8%] bottom-[24%] text-left'
        : 'left-[8%] bottom-[18%] text-left'
      : align === 'right'
      ? mobile
        ? 'right-[8%] bottom-[24%] text-right'
        : 'right-[8%] bottom-[18%] text-right'
      : mobile
      ? 'left-1/2 top-[56%] -translate-x-1/2 text-center'
      : 'left-1/2 top-[60%] -translate-x-1/2 text-center'

  return (
    <section className="relative h-screen w-screen shrink-0 overflow-hidden bg-[#0B0B0C]">
      {imageUrl ? (
        <>
          {/* 基础图片层 */}
          <div
            className={`pointer-events-none absolute inset-0 bg-cover bg-center transition-transform duration-[1400ms] ease-out ${
              active ? 'scale-[1.02]' : 'scale-[1.0]'
            }`}
            style={{ backgroundImage: `url(${imageUrl})` }}
          />

          {/* --- 皓野专属：光之教堂渲染层 (仅在第四张且 active 时显现) --- */}
          {index === 3 && (
            <div 
              className={`pointer-events-none absolute inset-0 z-[1] transition-opacity ease-in-out ${
                // 关键：4000ms（4秒）极其缓慢渗出，delay-700 让它滑过来先黑一会儿再亮
                active ? 'opacity-100 duration-[4000ms] delay-700' : 'opacity-0 duration-[1000ms]'
              }`}
            >
              {/* 核心：这一层 bg-black/60 保证了“黑的彻底”，压住照片杂色 */}
              <div className="absolute inset-0 bg-black/60 z-0" />
              {/* 梯形体积光束 */}
              <div 
                className="absolute inset-0 bg-gradient-to-b from-white/[0.12] via-white/[0.03] to-transparent"
                style={{
                clipPath: 'polygon(49.3% 0.1%, 50.7% 0.1%, 58% 100%, 42% 100%)',
                mixBlendMode: 'screen',
                  filter: 'blur(32px) drop-shadow(0 0 20px rgba(255,255,255,0.15))',
                  // 12秒一个呼吸周期，慢到极致才高级
                  animation: active ? 'church-beam-sculpt 12s ease-in-out infinite' : 'none',
                 
                  
                 
                  transformOrigin: 'top center',
                }}
              />
              
              <style jsx>{`
                @keyframes church-beam-sculpt {
                  0%, 100% { 
                    opacity: 0.4; 
                    transform: scaleY(1); 
                  }
                  50% { 
                    opacity: 0.9; 
                    transform: scaleY(1.03); /* 呼吸时纵向轻微拉伸 */
                  }
                }
              `}</style>
            </div>
          )}
          {/* --- 渲染层结束 --- */}

          {/* 原始遮罩层 */}
          <div className="pointer-events-none absolute inset-0 bg-black/48" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(120,128,137,0.14),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.04),transparent_24%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.24),rgba(0,0,0,0.06),rgba(0,0,0,0.36))]" />
          {isLast && <div className="pointer-events-none absolute inset-0 bg-black/22" />}
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[#0B0B0C]" />
      )}

      {/* 页码 */}
      <div
        className={`pointer-events-none absolute z-10 home-index ${
          mobile
            ? 'left-6 top-8 text-[10px] text-white/18'
            : 'left-8 top-8 text-[11px] text-white/28'
        }`}
      >
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>

      {!isLast ? (
        <div
          className={`pointer-events-none absolute z-10 ${basePosition} max-w-[760px] transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            active ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <p
            className={`home-line max-w-[760px] ${
              mobile
                ? 'text-[22px] leading-[1.42]'
                : 'text-[24px] leading-[1.48] md:text-[42px]'
            }`}
          >
            {text}
          </p>

          <p
            className={`home-signature text-[#C9C7C2] ${
              mobile ? 'mt-4 text-[14px]' : 'mt-5 text-[15px] md:text-[16px]'
            }`}
          >
            {signature}
          </p>
        </div>
      ) : (
        <div
          className={`absolute z-10 ${basePosition} transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            active ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <div
            className={`home-entry ${
              mobile
                ? 'mb-6 text-[26px] tracking-[0.1em] leading-[1.75]'
                : 'mb-8 text-[30px] tracking-[0.12em] md:text-[52px]'
            }`}
          >
            {mobile ? (
              <div className="flex flex-col items-center gap-2">
                <Link href="/poems" className="pointer-events-auto transition-colors duration-300 hover:text-white/90">诗</Link>
                <Link href="/images" className="pointer-events-auto transition-colors duration-300 hover:text-white/90">影</Link>
                <Link href="/notes" className="pointer-events-auto transition-colors duration-300 hover:text-white/90">与</Link>
                <Link href="/about" className="pointer-events-auto transition-colors duration-300 hover:text-white/90">我</Link>
              </div>
            ) : (
              <>
                <Link href="/poems" className="pointer-events-auto transition-colors duration-300 hover:text-white/90">诗</Link>{' '}
                <Link href="/images" className="pointer-events-auto transition-colors duration-300 hover:text-white/90">影</Link>{' '}
                <Link href="/notes" className="pointer-events-auto transition-colors duration-300 hover:text-white/90">与</Link>{' '}
                <Link href="/about" className="pointer-events-auto transition-colors duration-300 hover:text-white/90">我</Link>
              </>
            )}
          </div>

          <div className={`home-signature pointer-events-none text-[#C9C7C2] ${mobile ? 'text-[13px]' : 'text-[14px] md:text-[15px]'}`}>
            {signature}
          </div>

          <div className={`home-meta pointer-events-none text-[#7F7D79] ${mobile ? 'mt-3 text-[10px]' : 'mt-3 text-[10px] md:text-[11px]'}`}>
            {domainText}
          </div>
        </div>
      )}
    </section>
  )
}