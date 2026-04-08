export const revalidate = 60

import { notFound } from 'next/navigation'
import { sanityClient } from '@/lib/sanity.client'
import { aboutPageQuery } from '@/lib/queries'
import AboutInteractive from '@/components/about/AboutInteractive' // 引入我们刚写的物理组件

export default async function AboutPage() {
  const about = await sanityClient.fetch<{
    title?: string
    subtitle?: string
    body?: any
  }>(aboutPageQuery)

  if (!about) {
    notFound()
  }

  return (
    <div className="haoye-about-page min-h-[100svh] bg-[var(--site-bg)] text-[var(--site-text-solid)] overflow-hidden">
      {/* 直接将所有渲染和物理交互交给 Client Component */}
      <AboutInteractive about={about} />
    </div>
  )
}