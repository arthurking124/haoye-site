export const revalidate = 60

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PortableText } from '@portabletext/react'

import { sanityClient } from '@/lib/sanity.client'
import { imageSeriesBySlugQuery } from '@/lib/queries'
import { urlFor } from '@/lib/sanity.image'

export default async function ImageSeriesDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const item = await sanityClient.fetch(imageSeriesBySlugQuery, { slug })

  if (!item) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-32">
      <Link
        href="/images"
        className="text-sm text-[#8E8C88] transition-colors duration-300 hover:text-[#C9C7C2]"
      >
        回到影
      </Link>

      <h1 className="mt-8 text-4xl font-light">{item.title}</h1>

      {item.subtitle ? (
        <p className="mt-4 text-[#C9C7C2]">{item.subtitle}</p>
      ) : null}

      {item.images?.length ? (
        <div className="mt-16 space-y-12">
          {item.images.map((img: any, index: number) => (
            <img
              key={index}
              src={urlFor(img).width(1600).quality(90).url()}
              alt={`${item.title}-${index + 1}`}
              className="w-full rounded-xl object-cover"
            />
          ))}
        </div>
      ) : null}

      {item.text ? (
        <div className="prose prose-invert mt-16 max-w-[680px]">
          <PortableText value={item.text} />
        </div>
      ) : null}
    </div>
  )
}