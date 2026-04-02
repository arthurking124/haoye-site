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

  const images = item.images ?? []

  return (
    <div className="min-h-[100svh] bg-[#0D0D0D] text-[#F2F1EE]">
      <div className="mx-auto max-w-[1420px] px-6 pb-24 pt-28 md:px-10 md:pb-36 md:pt-36">
        <header className="border-t border-white/8 pt-8 md:pt-10">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[120px_minmax(0,1fr)] md:gap-12">
            <div>
              <Link
                href="/images"
                className="site-nav text-[11px] tracking-[0.18em] text-[#8E8C88] transition-colors duration-300 hover:text-[#C9C7C2]"
              >
                回到影
              </Link>

              <p className="mt-5 text-[11px] tracking-[0.18em] text-[#6F6D69]">IMAGE SERIES</p>
            </div>

            <div className="max-w-[860px]">
              <h1 className="text-[34px] font-light leading-[1.3] text-[#F2F1EE] md:text-[58px] md:leading-[1.2]">
                {item.title || '未命名影像'}
              </h1>

              {item.subtitle ? (
                <p className="mt-6 max-w-[620px] text-[14px] leading-[1.95] text-[#8E8C88] md:text-[15px]">
                  {item.subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </header>

        {images.length > 0 ? (
          <section className="mt-16 md:mt-24">
            <div className="space-y-12 md:space-y-16">
              {images.map((img: any, index: number) => (
                <figure
                  key={index}
                  className="border-t border-white/6 pt-6 md:pt-8"
                >
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-[120px_minmax(0,1fr)] md:gap-12">
                    <div className="flex items-start justify-between md:block">
                      <p className="text-[11px] tracking-[0.18em] text-[#6F6D69]">
                        {String(index + 1).padStart(2, '0')}
                      </p>
                    </div>

                    <div className="overflow-hidden rounded-[20px] bg-white/[0.03]">
                      <img
                        src={urlFor(img).width(1800).quality(90).url()}
                        alt={`${item.title || 'image-series'}-${index + 1}`}
                        className="motion-image w-full object-cover"
                      />
                    </div>
                  </div>
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        {item.text ? (
          <section className="mt-20 border-t border-white/8 pt-10 md:mt-24 md:pt-14">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-[120px_minmax(0,1fr)] md:gap-12">
              <div>
                <p className="text-[11px] tracking-[0.18em] text-[#6F6D69]">TEXT</p>
                <p className="mt-4 text-[11px] tracking-[0.22em] text-[#8E8C88]">
                  ARCHIVE NOTE
                </p>
              </div>

              <div className="reading-body max-w-[680px]">
                <PortableText value={item.text} />
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}