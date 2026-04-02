export const revalidate = 60

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PortableText } from '@portabletext/react'

import { sanityClient } from '@/lib/sanity.client'
import { poemBySlugQuery } from '@/lib/queries'
import { urlFor } from '@/lib/sanity.image'

const siteUrl = 'https://www.haoye.cyou'

type PoemDetail = {
  title?: string
  publishedAt?: string
  intro?: string
  coverImage?: any
  body?: any
}

async function getPoem(slug: string) {
  return sanityClient.fetch<PoemDetail | null>(poemBySlugQuery, { slug })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const poem = await getPoem(slug)

  if (!poem) {
    return {
      title: '未找到这首诗 | 皓野',
      description: '这首诗可能已被移走，或尚未被照亮。',
      alternates: {
        canonical: `/poems/${slug}`,
      },
    }
  }

  const title = `《${poem.title || '未命名'}》`
  const description =
    poem.intro || '没有说完的话，被留在这里。'
  const canonical = `/poems/${slug}`
  const image = poem.coverImage
    ? urlFor(poem.coverImage).width(1200).height(630).quality(90).url()
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

export default async function PoemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const poem = await getPoem(slug)

  if (!poem) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-[980px] px-6 py-28 md:px-8 md:py-36">
      <div className="mx-auto max-w-[560px]">
        <Link
          href="/poems"
          className="site-nav text-[11px] text-[#8E8C88] transition-colors duration-300 hover:text-[#C9C7C2] md:text-[12px]"
        >
          回到诗
        </Link>

        <h1 className="home-line mt-12 text-[30px] leading-[1.35] text-[#F2F1EE] md:mt-16 md:text-[42px] md:leading-[1.4]">
          《{poem.title}》
        </h1>

        {poem.intro ? (
          <p className="mt-6 max-w-[500px] text-[14px] leading-[1.95] text-[#8E8C88] md:text-[15px]">
            {poem.intro}
          </p>
        ) : null}

        {poem.coverImage ? (
          <div className="mt-12 md:mt-16">
            <img
              src={urlFor(poem.coverImage).width(1400).quality(90).url()}
              alt={poem.title}
              className="poem-cover w-full rounded-[10px] object-cover"
            />
          </div>
        ) : null}

        <div className="mt-14 md:mt-20">
          <div className="poem-body prose prose-invert max-w-none">
            <div className="home-line text-[18px] leading-[2.2] text-[#D3D0CA] md:text-[20px] md:leading-[2.28]">
              <PortableText value={poem.body} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}