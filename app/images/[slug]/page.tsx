export const revalidate = 60

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PortableText } from '@portabletext/react'

import InnerRoom from '@/components/layout/InnerRoom'
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
  const description = item.subtitle || '光、空间，以及被截留下来的图像。'
  const canonical = `/images/${slug}`
  const image = item.images?.[0]
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
