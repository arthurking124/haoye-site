import './globals.css'

import type { Metadata, Viewport } from 'next'
import { Inter, Noto_Serif_SC } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

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

const siteUrl = 'https://www.haoye.cyou'
const siteName = '皓野 | haoye.cyou'
const siteDescription = '诗、图像，以及没有说完的沉默。'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'haoye.cyou',
  title: {
    default: siteName,
    template: '%s | 皓野',
  },
  description: siteDescription,
  alternates: {
    canonical: '/',
  },
  authors: [{ name: '皓野' }],
  creator: '皓野',
  publisher: '皓野',
  keywords: ['皓野', 'haoye', '诗', '图像', '摄影', 'notes', '个人网站'],
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: siteUrl,
    siteName,
    title: siteName,
    description: siteDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0d0d0d',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${notoSerifSC.variable} bg-[#0D0D0D] text-[#F2F1EE] antialiased`}
      >
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