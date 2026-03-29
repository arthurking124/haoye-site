import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SoundToggle from '@/components/ui/SoundToggle'
import { Inter, Noto_Serif_SC } from 'next/font/google'

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
  title: '皓野 | haoye.cyou',
  description: '诗、图像，以及没有说完的沉默。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body
        className={`${inter.variable} ${notoSerifSC.variable} bg-[#0B0B0C] text-[#F2F1EE] antialiased`}
      >
        <Header />
        <main>{children}</main>
        <Footer />
        <SoundToggle />
      </body>
    </html>
  )
}
