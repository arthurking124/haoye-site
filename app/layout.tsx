import type { Metadata } from 'next'
import './globals.css'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageShell from '@/components/layout/PageShell'
import SiteBackground from '@/components/layout/SiteBackground'
import SoundToggle from '@/components/ui/SoundToggle'

export const metadata: Metadata = {
  title: '皓野',
  description: '诗、图像，以及没有说完的沉默。',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#090909] text-[#E7E3DC] antialiased">
        <SiteBackground />

        <div className="relative z-[1] min-h-screen">
          <Header />
          <SoundToggle />

          <PageShell>
            <main className="relative min-h-screen">{children}</main>
          </PageShell>

          <Footer />
        </div>
      </body>
    </html>
  )
}