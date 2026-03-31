export const revalidate = 60

import { sanityClient } from '@/lib/sanity.client'
import { aboutPageQuery } from '@/lib/queries'
import { PortableText } from '@portabletext/react'
// 1. 引入咱们折腾了一下午的签名组件
import Signature from '@/components/home/Signature' 

export default async function AboutPage() {
  const about = await sanityClient.fetch(aboutPageQuery)

  return (
    <div className="mx-auto max-w-[720px] px-6 py-32">
      <h1 className="text-[44px] font-light">{about.title}</h1>
      <p className="mt-4 text-[15px] text-[#C9C7C2]">{about.subtitle}</p>

      <div className="prose prose-invert mt-20 max-w-none">
        <div className="max-w-[680px] text-[18px] leading-[2.0] text-[#C9C7C2]">
          <PortableText value={about.body} />
          
          {/* 2. 在正文结束后，留出一点间距，放下你的签名 */}
          <div className="mt-16 flex justify-end"> 
            <div className="text-right">
              <p className="text-[12px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">Written by</p>
              <Signature />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}