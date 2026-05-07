'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Footer from './Footer'

export default function ConditionalFooter() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // 👑 挂载状态独立：只在客户端初次渲染时执行一次，打死都不会陷入死循环
  useEffect(() => {
    setMounted(true)
  }, [])

  // 防止 Next.js 服务端渲染 (SSR) 与客户端渲染 (CSR) 不一致导致的 Hydration 闪屏报错
  if (!mounted) return null

  // 🚨 拦截名单：在这个名单里的路由，原有的版权 Footer 绝对不允许出现！
  // 使用 startsWith 意味着未来如果你有 /images/xxx 详情页，也能完美隐藏
  const hideFooter = pathname && pathname.startsWith('/images')

  return (
    <>
      {/* 纯净渲染：如果当前不在拦截名单内，则原样输出你的 Footer */}
      {!hideFooter && <Footer />}
    </>
  )
}