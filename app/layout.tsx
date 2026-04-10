import './globals.css'

import { SpeedInsights } from '@vercel/speed-insights/next'
import Header from '@/components/layout/Header'
// 👉 1. 移除原来的 Footer 引入，换成我们的智能拦截器
import ConditionalFooter from '@/components/layout/ConditionalFooter'
import { Inter, Noto_Serif_SC } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import CustomCursor from '@/components/ui/CustomCursor'
// 👉 1. 引入我们刚写的双生流体组件
import FluidBackground from '@/components/ui/FluidBackground'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500'],
})

const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin'],
  variable: '--font-cn',
  weight: ['300', '400', '500'],
})

export const metadata = {
  metadataBase: new URL('https://www.haoye.cyou'),
  title: '皓野 | haoye.cyou',
  description: '诗、图像，以及没有说完的沉默。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${notoSerifSC.variable} antialiased`}>
        <CustomCursor />
        
        {/* 👉 2. 放置流体引擎，它会在内页自动生效 */}
        <FluidBackground />
        
        <Header />
        <main>{children}</main>
        
        {/* 👉 2. 在这里使用智能拦截器 */}
        <ConditionalFooter />
        
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}