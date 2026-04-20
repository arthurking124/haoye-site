import './globals.css'

import { SpeedInsights } from '@vercel/speed-insights/next'
import Header from '@/components/layout/Header'
import ConditionalFooter from '@/components/layout/ConditionalFooter'
import { Inter, Noto_Serif_SC } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import CustomCursor from '@/components/ui/CustomCursor'
import FluidBackground from '@/components/ui/FluidBackground'

// 👑 引入顶级感官系统中枢
import { GlobalSensoryProvider } from '@/components/providers/GlobalSensoryProvider'

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
        {/* 👑 将感官中枢包裹在最外层，接管全站音画 */}
        <GlobalSensoryProvider>
          <CustomCursor />
          
          {/* 流体引擎 */}
          <FluidBackground />
          
          <Header />
          <main>{children}</main>
          
          <ConditionalFooter />
          
          <Analytics />
          <SpeedInsights />
        </GlobalSensoryProvider>
      </body>
    </html>
  )
}