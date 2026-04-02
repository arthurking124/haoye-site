import './globals.css'
import type { Metadata } from 'next'
import { Inter, Noto_Serif_SC } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SoundToggle from '@/components/ui/SoundToggle'

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

export const metadata: Metadata = {
  title: {
    default: '皓野 | haoye.cyou',
    template: '%s | 皓野',
  },
  description: '诗、图像，以及没有说完的沉默。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.variable} ${notoSerifSC.variable} haoye-body`}>
        <Header />
        <main>{children}</main>
        <Footer />
        <SoundToggle />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}