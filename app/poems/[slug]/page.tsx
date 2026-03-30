export const revalidate = 60

import { sanityClient } from '@/lib/sanity.client'
import { poemBySlugQuery } from '@/lib/queries'
import { PortableText } from '@portabletext/react'
import { urlFor } from '@/lib/sanity.image'
import Link from 'next/link'

export default async function PoemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const poem = await sanityClient.fetch(poemBySlugQuery, { slug })

  return (
    <div className="mx-auto max-w-[920px] px-6 py-28 md:px-8 md:py-36">
      <div className="mx-auto max-w-[620px]">
        <Link
          href="/poems"
          className="site-nav text-[11px] text-[#8E8C88] transition-colors duration-300 hover:text-[#C9C7C2] md:text-[12px]"
        >
          回到诗
        </Link>

        <h1 className="home-line mt-10 text-[30px] leading-[1.4] text-[#F2F1EE] md:mt-14 md:text-[42px] md:leading-[1.45]">
          {poem.title}
        </h1>

        {poem.intro ? (
          <p className="mt-5 max-w-[520px] text-[14px] leading-[1.9] text-[#8E8C88] md:mt-6 md:text-[15px]">
            {poem.intro}
          </p>
        ) : null}

        {/* 配图显示区域 */}
        {poem.coverImage ? (
          <div className="mt-12 md:mt-16">
            <img
              src={urlFor(poem.coverImage).width(1400).quality(90).url()}
              alt={poem.title}
              className="poem-cover w-full rounded-[10px] object-cover"
            />
          </div>
        ) : null}

        {/* 正文 */}
        <div className="mt-14 md:mt-20">
          <div className="poem-body prose prose-invert max-w-none">
            <div className="home-line text-[18px] leading-[2.15] text-[#C9C7C2] md:text-[21px] md:leading-[2.22]">
              <PortableText value={poem.body} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
