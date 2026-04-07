export const revalidate = 60

import { sanityClient } from '@/lib/sanity.client'
import { allPoemsQuery } from '@/lib/queries'
import PoemsList from '@/components/poems/PoemsList'

type PoemItem = {
  _id?: string
  title?: string
  slug?: { current?: string }
  publishedAt?: string
  intro?: string
  coverImage?: any
}

export default async function PoemsPage() {
  // 1. 在服务端秒拉数据
  const poems = await sanityClient.fetch<PoemItem[]>(allPoemsQuery)

  // 2. 将数据递交给我们的高定呼吸排版组件
  return (
    <div className="haoye-poems-page min-h-[100svh] bg-[var(--site-bg)] text-[var(--site-text-solid)]">
      <PoemsList poems={poems ?? []} />
    </div>
  )
}