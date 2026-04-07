export const revalidate = 60

import { sanityClient } from '@/lib/sanity.client'
import { allImageSeriesQuery } from '@/lib/queries'
import ZAxisGallery from '@/components/gallery/ZAxisGallery'

type ImageSeriesItem = {
  _id?: string
  title?: string
  subtitle?: string
  slug?: { current?: string }
  images?: any[]
}

export default async function ImagesPage() {
  const items = await sanityClient.fetch<ImageSeriesItem[]>(allImageSeriesQuery)

  return (
    <div className="haoye-images-page min-h-[100svh] bg-[var(--site-bg)] text-[var(--site-text-solid)]">
      {/* 所有的魔法都在这里发生 */}
      <ZAxisGallery items={items ?? []} />
    </div>
  )
}