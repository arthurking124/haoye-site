import { sanityClient } from '@/lib/sanity.client'
import { aboutPageQuery } from '@/lib/queries'
import { PortableText } from '@portabletext/react'

export default async function AboutPage() {
  const about = await sanityClient.fetch(aboutPageQuery)

  return (
    <div className="mx-auto max-w-[720px] px-6 py-32">
      <h1 className="text-[44px] font-light">{about.title}</h1>
      <p className="mt-4 text-[15px] text-[#C9C7C2]">{about.subtitle}</p>

      <div className="prose prose-invert mt-20 max-w-none">
        <div className="max-w-[680px] text-[18px] leading-[2.0] text-[#C9C7C2]">
          <PortableText value={about.body} />
        </div>
      </div>
    </div>
  )
}
