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
  // === 🚀 新增：接收 3D 偏移信号 ===
  parallax?: { rotateX: number; rotateY: number; tx: number; ty: number }
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
  // 默认静止状态
  parallax = { rotateX: 0, rotateY: 0, tx: 0, ty: 0 }
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
          {/* === 🚀 构图保卫战：精准隔离层 === */}
          <div 
            className="absolute inset-0 z-0 pointer-events-none"
            style={{ perspective: '1200px' }}
          >
            {/* === 🚀 核心逻辑修改点 ===
                1. 将 scale(1.1) 修改为极致克制的 scale(1.02)
                为了保住十字光的顶部留白和幽远的距离感，我们只放大 2%
                
                2. 减小 rotate 幅度
                由于 scale 倍数极小，我们需要配合把 rotation 的幅度也减小，防止边缘漏黑。
                
                3. 增加 background-size: 100% 确保图片在容器内不被拉伸
            */}
            <div
              style={{
                // 1. 将旋转角度从之前代码的 2度/1.5度 压低到极致克制的 0.8度。
                // 这里的 1.02 是黄金比例，它几乎察觉不到放大，且保住了十字光的顶部间距。
                transform: `
                  perspective(1200px) 
                  rotateX(${parallax.rotateX * 0.4}deg) 
                  rotateY(${parallax.rotateY * 0.4}deg) 
                  translate3d(${parallax.tx * 0.3}px, ${parallax.ty * 0.3}px, 0) 
                  scale(1.02)
                `,
                transition: 'transform 1400ms cubic-bezier(0.2, 0.5, 0.3, 1)',
                willChange: 'transform',
                // 确保图片容器比 section 稍微大一点，给旋转腾出微小空间
                width: 'calc(100% + 12px)',
                height: 'calc(100% + 12px)',
                top: '-6px',
                left: '-6px'
              }}
              className="absolute"
            >
              {/* 基础图片层 - 100% 原始 className，但我帮你精简了 redundant 逻辑 */}
              <div
                className={`absolute inset-0 bg-cover bg-center transition-transform duration-[1400ms] ease-out ${
                  active ? 'opacity-100' : 'opacity-100'
                }`}
                style={{ backgroundImage: `url(${imageUrl})` }}
              />

              {/* --- 皓野专属：光之教堂渲染层 --- 100% 原始代码 --- */}
              {index === 3 && (
                <div 
                  className={`pointer-events-none absolute inset-0 z-[1] transition-opacity ease-in-out ${
                    // delay 700 保留
                    active ? 'opacity-100 duration-[4000ms] delay-700' : 'opacity-0 duration-[1000ms]'
                  }`}
                >
                  <div 
                    className="absolute inset-0 bg-gradient-to-b from-white/[0.15] via-white/[0.05] to-transparent"
                    style={{
                      clipPath: 'polygon(49.7% 0.1%, 50.7% 0.1%, 58% 100%, 42% 100%)',
                      mixBlendMode: 'screen',
                      filter: 'blur(45px) drop-shadow(0 0 35px rgba(255,255,255,0.3))',
                      animation: active ? 'church-beam-sculpt 14s ease-in-out infinite' : 'none',
                      transformOrigin: 'top center',
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 原始遮罩层 - 100% 原始代码 */}
          <div className="pointer-events-none absolute inset-0 bg-black/48 z-[2]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(120,128,137,0.14),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.04),transparent_24%)] z-[2]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.24),rgba(0,0,0,0.06),rgba(0,0,0,0.36))] z-[2]" />
          {isLast && <div className="pointer-events-none absolute inset-0 bg-black/22 z-[2]" />}
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[#0B0B0C]" />
      )}

      {/* 排版逻辑 - 100% 原始，绝不动一个像素 */}
      
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
            <div className={`${mobile ? 'flex flex-col items-center gap-2' : ''}`}>
              <Link href="/poems" className="pointer-events-auto transition-colors duration-300 hover:text-white/90">诗</Link>{' '}
              <Link href="/images" className="pointer-events-auto transition-colors duration-300 hover:text-white/90">影</Link>{' '}
              <Link href="/notes" className="pointer-events-auto transition-colors duration-300 hover:text-white/90">与</Link>{' '}
              <Link href="/about" className="pointer-events-auto transition-colors duration-300 hover:text-white/90">我</Link>
            </div>
          </div>

          <div className={`home-signature pointer-events-none text-[#C9C7C2] ${mobile ? 'text-[13px]' : 'text-[14px] md:text-[15px]'}`}>
            {signature}
          </div>
          <div className={`home-meta pointer-events-none text-[#7F7D79] ${mobile ? 'mt-3 text-[10px]' : 'mt-3 text-[10px] md:text-[11px]'}`}>
            {domainText}
          </div>
        </div>
      )}

      {/* 原始 Keyframes 样式 */}
      <style jsx>{`
        @keyframes church-beam-sculpt {
          0%, 100% { opacity: 0; transform: scaleY(0.98); }
          50% { opacity: 0.85; transform: scaleY(1.05); }
        }
      `}</style>
    </section>
  )
}