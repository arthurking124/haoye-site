export const revalidate = 60
import type { Metadata } from 'next'

import { notFound } from 'next/navigation'
import Link from 'next/link'

import InnerRoom from '@/components/layout/InnerRoom'
// import LiquidTextReader from '@/components/poems/LiquidTextReader' // 已按要求替换
import LightPoemRift from '@/components/poems/LightPoemRift' // 👈 新增：引入裂口组件
import DarkPoemInteractive from '@/components/poems/DarkPoemInteractive'
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
    alternates: { canonical },
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
    <div className="haoye-poem-detail-page min-h-[100svh] bg-[var(--site-bg)] text-[var(--site-text-solid)] overflow-hidden">
      
      {/* 🌑 黑色主题：全屏引力瀑布特效 */}
      <div className="haoye-dark-only relative z-10">
        <DarkPoemInteractive poem={poem} />
      </div>

      {/* ☁️ 白色主题：时空裂口与镇压叙事 */}
      <div className="haoye-light-only relative z-10">
        <LightPoemRift poem={poem} />
      </div>

    </div>
  )
}