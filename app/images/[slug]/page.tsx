export const revalidate = 60

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PortableText } from '@portabletext/react'

import { sanityClient } from '@/lib/sanity.client'
import { imageSeriesBySlugQuery } from '@/lib/queries'
import { urlFor } from '@/lib/sanity.image'

const siteUrl = 'https://www.haoye.cyou'

type ImageSeriesDetail = {
  title?: string
  subtitle?: string
  images?: any[]
  text?: any
}

async function getImageSeries(slug: string) {
  return sanityClient.fetch<ImageSeriesDetail | null>(imageSeriesBySlugQuery, { slug })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const item = await getImageSeries(slug)

  if (!item) {
    return {
      title: '未找到这组影像 | 皓野',
      description: '这组影像可能已被移走，或尚未被留存。',
      alternates: {
        canonical: `/images/${slug}`,
      },
    }
  }

  const title = item.title || '未命名影像'
  const description =
    item.subtitle || '光、空间，以及被截留下来的图像。'
  const canonical = `/images/${slug}`
  const image =
    item.images?.[0]
      ? urlFor(item.images[0]).width(1200).height(630).quality(90).url()
      : undefined

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${canonical}`,
      type: 'article',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function ImageSeriesDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const item = await getImageSeries(slug)

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