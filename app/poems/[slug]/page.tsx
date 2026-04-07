export const revalidate = 60

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

import InnerRoom from '@/components/layout/InnerRoom'
import LiquidTextReader from '@/components/poems/LiquidTextReader'
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

// 补回了这个被遗漏的 getPoem 函数！
async function getPoem(slug: string) {
  return sanityClient.fetch<PoemDetail | null>(poemBySlugQuery, { slug })
}

// 补回了高级的 SEO 元数据生成
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

  const poemDate = poem.publishedAt ? new Date(poem.publishedAt).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }) : null

  return (
    <div className="haoye-poem-detail-page min-h-[100svh] bg-[var(--site-bg)] text-[var(--site-text-solid)] overflow-hidden">
      <InnerRoom variant="inner">
        
        <div className="relative mx-auto max-w-[1100px] px-6 pb-40 pt-28 md:px-12 md:pb-60 md:pt-40">
          {/* 1. 序言与返回引导 */}
          <header className="mb-24 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <Link href="/poems" className="text-[10px] tracking-[0.3em] text-[var(--site-dim)] hover:text-[var(--site-text-solid)] transition-colors">
              ← RETURN TO POETRY
            </Link>
            <h1 className="mt-12 text-[32px] font-light tracking-[0.1em] text-[var(--site-text-solid)] md:text-[48px]">
              《{poem.title || '未命名'}》
            </h1>
            {poemDate && <p className="mt-6 text-[10px] tracking-[0.2em] text-[var(--site-faint)]">{poemDate}</p>}
          </header>

          {/* 2. 核心：双轨液态物理引擎！ (黑昼探照碑文 / 白昼散落渗墨) */}
          <LiquidTextReader body={poem.body} />

          {/* 3. 插画收尾 (如果有) */}
          {poem.coverImage && (
            <div className="mt-40 flex justify-center opacity-40 grayscale transition-all duration-1000 hover:opacity-100 hover:grayscale-0">
              <img
                src={urlFor(poem.coverImage).width(1000).quality(85).url()}
                alt="cover"
                className="max-w-full md:max-w-[600px] rounded-[1px] shadow-2xl"
              />
            </div>
          )}
        </div>

      </InnerRoom>
    </div>
  )
}