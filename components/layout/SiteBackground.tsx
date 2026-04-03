'use client'

import { usePathname } from 'next/navigation'

export default function SiteBackground() {
  const pathname = usePathname()
  const isHome = pathname === '/' || pathname === ''

  if (isHome) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* 基础深灰黑，不是纯黑 */}
      <div className="absolute inset-0 bg-[#090909]" />

      {/* 纵向空气层次 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(18,18,18,0.88) 0%, rgba(8,8,8,0.96) 36%, rgba(10,10,10,0.98) 100%)',
        }}
      />

      {/* 左侧极轻“回声圈” */}
      <div
        className="absolute inset-y-0 left-0 w-[44vw]"
        style={{
          background: `
            radial-gradient(circle at 26% 24%, rgba(255,255,255,0.020) 0, rgba(255,255,255,0.010) 4%, transparent 9%),
            radial-gradient(circle at 26% 24%, transparent 0 10%, rgba(255,255,255,0.014) 10.5%, transparent 13.5%),
            radial-gradient(circle at 26% 24%, transparent 0 14.5%, rgba(255,255,255,0.010) 15%, transparent 18.5%),
            radial-gradient(circle at 26% 24%, transparent 0 19.5%, rgba(255,255,255,0.008) 20%, transparent 24.5%),
            radial-gradient(circle at 26% 24%, transparent 0 25.5%, rgba(255,255,255,0.006) 26%, transparent 31%)
          `,
          filter: 'blur(1px)',
          opacity: 0.26,
        }}
      />

      {/* 右侧更弱的空间回声 */}
      <div
        className="absolute inset-y-0 right-0 w-[42vw]"
        style={{
          background: `
            radial-gradient(circle at 72% 68%, rgba(255,255,255,0.012) 0, rgba(255,255,255,0.006) 4%, transparent 9%),
            radial-gradient(circle at 72% 68%, transparent 0 10%, rgba(255,255,255,0.008) 10.5%, transparent 14%),
            radial-gradient(circle at 72% 68%, transparent 0 15%, rgba(255,255,255,0.006) 15.5%, transparent 19%)
          `,
          filter: 'blur(1px)',
          opacity: 0.16,
        }}
      />

      {/* 极轻横向暗场，防止背景太平 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.06) 16%, rgba(0,0,0,0.00) 38%, rgba(0,0,0,0.00) 62%, rgba(0,0,0,0.08) 84%, rgba(0,0,0,0.18) 100%)',
        }}
      />

      {/* 顶部极轻雾感，不让页面死黑 */}
      <div
        className="absolute inset-x-0 top-0 h-[22vh]"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.018), transparent 58%)',
          opacity: 0.28,
        }}
      />

      {/* 底部收束 */}
      <div
        className="absolute inset-x-0 bottom-0 h-[28vh]"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.22), transparent 72%)',
        }}
      />
    </div>
  )
}