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

function getFigureLayout(index: number) {
  return index % 4
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
    <div className="haoye-image-detail-page min-h-[100svh] bg-[var(--site-bg)] text-[var(--site-text-solid)]">
      <InnerRoom variant="archive">
        <div className="mx-auto max-w-[1460px] px-6 pb-24 pt-28 md:px-10 md:pb-36 md:pt-36">
          <header className="haoye-image-detail-header border-t border-[color:var(--site-border-soft)] pt-8 md:pt-10">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-[96px_minmax(0,1fr)] md:gap-12">
              <div className="haoye-image-detail-rail">
                <Link
                  href="/images"
                  className="haoye-image-detail-back site-nav text-[11px] tracking-[0.18em] text-[var(--site-dim)] transition-colors duration-300 hover:text-[var(--site-soft)]"
                >
                  回到影
                </Link>

                <p className="mt-5 text-[11px] tracking-[0.18em] text-[var(--site-faint)]">
                  IMAGE SERIES
                </p>
              </div>

              <div className="haoye-image-detail-hero max-w-[920px]">
                <h1 className="haoye-image-detail-title text-[34px] font-light leading-[1.3] text-[var(--site-text-solid)] md:text-[58px] md:leading-[1.2]">
                  {item.title || '未命名影像'}
                </h1>

                {item.subtitle ? (
                  <p className="haoye-image-detail-subtitle mt-6 max-w-[620px] text-[14px] leading-[1.95] text-[var(--site-dim)] md:text-[15px]">
                    {item.subtitle}
                  </p>
                ) : null}
              </div>
            </div>
          </header>

          {images.length > 0 ? (
            <section className="haoye-image-detail-gallery mt-16 md:mt-24">
              <div className="space-y-14 md:space-y-20">
                {images.map((img: any, index: number) => (
                  <figure
                    key={index}
                    data-layout={getFigureLayout(index)}
                    className="haoye-image-detail-figure border-t border-[color:var(--site-line-soft)] pt-6 md:pt-8"
                  >
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-[96px_minmax(0,1fr)] md:gap-12">
                      <div className="haoye-image-detail-figure-rail flex items-start justify-between md:block">
                        <p className="text-[11px] tracking-[0.18em] text-[var(--site-faint)]">
                          {String(index + 1).padStart(2, '0')}
                        </p>
                      </div>

                      <div className="haoye-image-detail-figure-stage">
                        <div className="haoye-image-detail-frame overflow-hidden rounded-[20px] bg-[color:var(--site-border-soft)]">
                          <img
                            src={urlFor(img).width(1800).quality(90).url()}
                            alt={`${item.title || 'image-series'}-${index + 1}`}
                            className="haoye-image-detail-image motion-image w-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          {item.text ? (
            <section className="haoye-image-detail-text-section mt-20 border-t border-[color:var(--site-border-soft)] pt-10 md:mt-24 md:pt-14">
              <div className="grid grid-cols-1 gap-10 md:grid-cols-[96px_minmax(0,1fr)] md:gap-12">
                <div>
                  <p className="text-[11px] tracking-[0.18em] text-[var(--site-faint)]">
                    TEXT
                  </p>
                  <p className="mt-4 text-[11px] tracking-[0.22em] text-[var(--site-dim)]">
                    ARCHIVE NOTE
                  </p>
                </div>

                <div className="haoye-image-detail-text-body reading-body max-w-[720px]">
                  <PortableText value={item.text} />
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </InnerRoom>
    </div>
  )
}