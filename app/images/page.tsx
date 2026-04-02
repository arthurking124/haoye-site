export const revalidate = 60

import Link from 'next/link'
import { sanityClient } from '@/lib/sanity.client'
import { allImageSeriesQuery } from '@/lib/queries'
import { urlFor } from '@/lib/sanity.image'

type ImageSeries = {
  _id: string
  title: string
  slug: { current: string }
  subtitle?: string
  images?: any[]
}

export default async function ImagesPage() {
  const items = await sanityClient.fetch<ImageSeries[]>(allImageSeriesQuery)

  return (
    <div className="page-shell">
      <div className="page-hero">
        <div className="page-kicker font-ui">Main Stage · Images</div>
        <h1 className="page-title home-line">影</h1>
        <p className="page-subtitle">
          这里不只是图像归档，而是一组组被安排过的进入。每一个系列，都应该像一间不同的房间：
          光的方向不同，沉默的密度不同，时间停住的方式也不同。
        </p>
      </div>

      <div className="series-grid">
        {items.map((item, index) => {
          const cover = item.images?.[0]
            ? urlFor(item.images[0]).width(2200).quality(92).url()
            : ''

          return (
            <Link key={item._id} href={`/images/${item.slug.current}`} className="group block">
              <article className="series-card">
                <div className="series-card__media">
                  {cover ? <img src={cover} alt={item.title} /> : null}
                </div>

                <div className="series-card__content">
                  <div className="series-card__index font-ui">
                    {String(index + 1).padStart(2, '0')} / Series
                  </div>

                  <h2 className="series-card__title home-line">{item.title}</h2>

                  <p className="series-card__subtitle">
                    {item.subtitle || '一些被停住的光，以及仍在继续的沉默。'}
                  </p>

                  <div className="series-card__enter font-ui">Enter Series</div>
                </div>
              </article>
            </Link>
          )
        })}
      </div>
    </div>
  )
}