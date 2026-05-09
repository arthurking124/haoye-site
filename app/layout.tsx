import './globals.css'

import { SpeedInsights } from '@vercel/speed-insights/next'
import Header from '@/components/layout/Header'
import ConditionalFooter from '@/components/layout/ConditionalFooter'
import { Inter, Noto_Serif_SC } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import SymbioteCursorEnhanced from '@/components/cursor/SymbioteCursorEnhanced'
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
    // suppressHydrationWarning 必须保留，它允许我们在 React 挂载前修改 class 和 dataset
    <html lang="zh-CN" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* 👑 Awwwards 级防闪屏阻断脚本：在 React 渲染前瞬间锁定本地主题 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = window.localStorage.getItem('haoye-theme');
                  var theme = savedTheme === 'light' ? 'light' : 'dark';
                  document.documentElement.dataset.theme = theme;
                  document.documentElement.classList.add(theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${notoSerifSC.variable} antialiased`}>
        {/* 👑 将感官中枢包裹在最外层，接管全站音画 */}
        <GlobalSensoryProvider>
          <SymbioteCursorEnhanced />
          
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