export const revalidate = 60

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PortableText } from '@portabletext/react'

import InnerRoom from '@/components/layout/InnerRoom'
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

function formatPoemDate(date?: string) {
  if (!date) return null

  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date))
  } catch {
    return null
  }
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
  const description = poem.intro || '没有说完的话，被留在这里。'
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

  const poemDate = formatPoemDate(poem.publishedAt)

  return (
    <div className="min-h-[100svh] bg-[#0D0D0D] text-[#F2F1EE]">
      <InnerRoom variant="inner">
        <div className="mx-auto max-w-[1040px] px-6 pb-24 pt-28 md:px-10 md:pb-36 md:pt-36">
          <header className="border-t border-white/8 pt-8 md:pt-10">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-[120px_minmax(0,1fr)] md:gap-12">
              <div>
                <Link
                  href="/poems"
                  className="site-nav text-[11px] tracking-[0.18em] text-[#8E8C88] transition-colors duration-300 hover:text-[#C9C7C2]"
                >
                  回到诗
                </Link>

                <p className="mt-5 text-[11px] tracking-[0.18em] text-[#6F6D69]">POEM</p>

                {poemDate ? (
                  <p className="mt-4 text-[11px] tracking-[0.18em] text-[#8E8C88]">
                    {poemDate}
                  </p>
                ) : null}
              </div>

              <div className="max-w-[680px]">
                <h1 className="home-line text-[32px] leading-[1.38] text-[#F2F1EE] md:text-[48px] md:leading-[1.34]">
                  《{poem.title || '未命名'}》
                </h1>

                {poem.intro ? (
                  <p className="mt-6 max-w-[560px] text-[14px] leading-[1.98] text-[#8E8C88] md:text-[15px]">
                    {poem.intro}
                  </p>
                ) : null}
              </div>
            </div>
          </header>

          {poem.coverImage ? (
            <section className="mt-14 md:mt-18">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-[120px_minmax(0,1fr)] md:gap-12">
                <div />

                <div className="max-w-[760px] overflow-hidden rounded-[18px] bg-white/[0.03]">
                  <img
                    src={urlFor(poem.coverImage).width(1500).quality(90).url()}
                    alt={poem.title || 'poem-cover'}
                    className="poem-cover w-full object-cover"
                  />
                </div>
              </div>
            </section>
          ) : null}

          <section className="mt-14 border-t border-white/8 pt-10 md:mt-18 md:pt-14">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-[120px_minmax(0,1fr)] md:gap-12">
              <div>
                <p className="text-[11px] tracking-[0.18em] text-[#6F6D69]">TEXT</p>
                <p className="mt-4 text-[11px] tracking-[0.22em] text-[#8E8C88]">
                  INNER ROOM
                </p>
              </div>

              <div className="max-w-[640px]">
                <div className="poem-body">
                  <div className="home-line text-[18px] leading-[2.18] text-[#D7D3CC] md:text-[20px] md:leading-[2.24]">
                    <PortableText value={poem.body} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </InnerRoom>
    </div>
  )
}