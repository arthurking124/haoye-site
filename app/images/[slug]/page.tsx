export const revalidate = 60

import {sanityClient} from '@/lib/sanity.client'
import {imageSeriesBySlugQuery} from '@/lib/queries'
import {urlFor} from '@/lib/sanity.image'
import {PortableText} from '@portabletext/react'

export default async function ImageSeriesDetailPage({
  params,
}: {
  params: Promise<{slug: string}>
}) {
  const {slug} = await params
  const item = await sanityClient.fetch(imageSeriesBySlugQuery, {slug})

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-32">
      <a href="/images" className="text-sm text-[#8E8C88]">
        回到影
      </a>

      <h1 className="mt-8 text-4xl font-light">{item.title}</h1>
      {item.subtitle ? (
        <p className="mt-4 text-[#C9C7C2]">{item.subtitle}</p>
      ) : null}

      <div className="mt-16 space-y-12">
        {item.images?.map((img: any, index: number) => (
          <img
            key={index}
            src={urlFor(img).width(1600).url()}
            alt={`${item.title}-${index}`}
            className="w-full rounded-xl object-cover"
          />
        ))}
      </div>

      {item.text ? (
        <div className="prose prose-invert mt-16 max-w-[680px]">
          <PortableText value={item.text} />
        </div>
      ) : null}
    </div>
  )
}
