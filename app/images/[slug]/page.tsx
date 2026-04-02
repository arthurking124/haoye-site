export const revalidate = 60

import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import { sanityClient } from '@/lib/sanity.client'
import { imageSeriesBySlugQuery } from '@/lib/queries'
import { urlFor } from '@/lib/sanity.image'

type ImageSeriesDetail = {
  title: string
  subtitle?: string
  images?: any[]
  text?: any
}

export default async function ImageSeriesDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const item = await sanityClient.fetch<ImageSeriesDetail>(imageSeriesBySlugQuery, { slug })

  const hero = item.images?.[0]
    ? urlFor(item.images[0]).width(2400).quality(92).url()
    : ''

  const gallery = item.images?.slice(1) || []

  return (
    <article className="series-detail">
      <section className="series-detail__hero">
        {hero ? (
          <div className="series-detail__hero-image">
            <img src={hero} alt={item.title} />
          </div>
        ) : null}

        <div className="series-detail__hero-copy">
          <Link href="/images" className="series-detail__back font-ui">
            Back to Images
          </Link>

          <h1 className="series-detail__title home-line">{item.title}</h1>

          {item.subtitle ? (
            <p className="series-detail__subtitle">{item.subtitle}</p>
          ) : null}
        </div>
      </section>

      <section className="series-detail__body">
        <div className="series-detail__intro">
          观看这一组图像时，不要把它们当作被顺序排列的文件。把它们当作同一段空气里的不同停顿：
          有的像靠近，有的像退后，有的只是把光留在原地。
        </div>

        <div className="series-detail__gallery">
          {gallery.map((img, index) => {
            const imageUrl = urlFor(img).width(2200).quality(92).url()

            if (index % 3 === 1) {
              return (
                <div key={index} className="series-detail__row">
                  <div className="series-detail__frame">
                    <img src={imageUrl} alt={`${item.title}-${index + 1}`} />
                  </div>

                  <div className="series-detail__note">
                    这一段留给图像本身。不要急着解释它，也不要急着离开它。某些画面真正的意义，
                    不是“它是什么”，而是“它让什么停了下来”。
                  </div>
                </div>
              )
            }

            return (
              <div
                key={index}
                className={`series-detail__frame ${
                  index % 3 === 0 ? 'series-detail__frame--wide' : ''
                }`}
              >
                <img src={imageUrl} alt={`${item.title}-${index + 1}`} />
              </div>
            )
          })}
        </div>

        {item.text ? (
          <div className="series-detail__essay prose prose-invert">
            <PortableText value={item.text} />
          </div>
        ) : null}
      </section>
    </article>
  )
}