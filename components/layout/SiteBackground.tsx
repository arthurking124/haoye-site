'use client'

import { usePathname } from 'next/navigation'

export default function SiteBackground() {
  const pathname = usePathname()
  const isHome = pathname === '/' || pathname === ''

  if (isHome) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* 基础底色：不是纯黑，而是极深灰黑 */}
      <div className="absolute inset-0 bg-[#070707]" />

      {/* 纵向空间层次 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(13,13,13,0.92) 0%, rgba(7,7,7,0.98) 36%, rgba(9,9,9,0.98) 100%)',
        }}
      />

      {/* 左侧主圆圈纹理：更接近你原始版本 */}
      <div
        className="absolute inset-y-0 left-0 w-[46vw]"
        style={{
          background: `
            radial-gradient(circle at 22% 26%, rgba(255,255,255,0.020) 0 1.2%, transparent 1.3% 7.6%, rgba(255,255,255,0.014) 7.8% 8.05%, transparent 8.2% 13.2%, rgba(255,255,255,0.010) 13.4% 13.6%, transparent 13.8% 19.6%, rgba(255,255,255,0.007) 19.8% 20.0%, transparent 20.2% 27%),
            radial-gradient(circle at 22% 26%, rgba(255,255,255,0.004), transparent 34%)
          `,
          filter: 'blur(0.6px)',
          opacity: 0.42,
        }}
      />

      {/* 左侧外扩更大一圈，制造空气感 */}
      <div
        className="absolute inset-y-0 left-[-4vw] w-[56vw]"
        style={{
          background: `
            radial-gradient(circle at 24% 30%, transparent 0 30%, rgba(255,255,255,0.006) 30.2% 30.35%, transparent 30.5% 38%, rgba(255,255,255,0.004) 38.2% 38.3%, transparent 38.5% 50%)
          `,
          filter: 'blur(1px)',
          opacity: 0.24,
        }}
      />

      {/* 右侧极弱回声，避免右边完全死掉 */}
      <div
        className="absolute inset-y-0 right-0 w-[38vw]"
        style={{
          background: `
            radial-gradient(circle at 72% 70%, rgba(255,255,255,0.010) 0 1%, transparent 1.1% 6.4%, rgba(255,255,255,0.007) 6.6% 6.8%, transparent 7% 11.8%, rgba(255,255,255,0.004) 12% 12.15%, transparent 12.3% 17%)
          `,
          filter: 'blur(0.8px)',
          opacity: 0.14,
        }}
      />

      {/* 极轻顶部雾感 */}
      <div
        className="absolute inset-x-0 top-0 h-[24vh]"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.018), transparent 58%)',
          opacity: 0.24,
        }}
      />

      {/* 轻微横向暗场，让中间更聚拢 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.05) 18%, rgba(0,0,0,0.00) 42%, rgba(0,0,0,0.00) 62%, rgba(0,0,0,0.06) 84%, rgba(0,0,0,0.14) 100%)',
        }}
      />

      {/* 底部极轻收束 */}
      <div
        className="absolute inset-x-0 bottom-0 h-[26vh]"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.22), transparent 70%)',
        }}
      />
    </div>
  )
}