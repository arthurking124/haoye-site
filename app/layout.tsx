import './globals.css'

import { SpeedInsights } from '@vercel/speed-insights/next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Inter, Noto_Serif_SC } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
// 👉 1. 在这里引入我们刚刚写好的自定义光标组件
import CustomCursor from '@/components/ui/CustomCursor'

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
        {/* 👉 2. 将光标组件放在 body 的最前面 */}
        <CustomCursor />
        
        <Header />
        <main>{children}</main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}