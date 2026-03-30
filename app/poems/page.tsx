export const revalidate = 60

import { sanityClient } from '@/lib/sanity.client'
import { allPoemsQuery } from '@/lib/queries'
import Link from 'next/link'

export default async function PoemsPage() {
  const poems = await sanityClient.fetch(allPoemsQuery)

  return (
    <div className="mx-auto max-w-[980px] px-6 py-28 md:px-8 md:py-36">
      <div className="mx-auto max-w-[560px]">
        <h1 className="home-line text-[42px] leading-[1.15] text-[#F2F1EE] md:text-[58px]">
          诗
        </h1>

        <p className="mt-4 text-[15px] leading-[1.95] text-[#C9C7C2] md:text-[16px]">
          没有说完的话，被留在这里。
        </p>

        <div className="mt-20 space-y-16 md:mt-24 md:space-y-20">
          {poems.map((poem: any) => (
            <Link
              key={poem._id}
              href={`/poems/${poem.slug.current}`}
              className="group block"
            >
              <article>
                <h2 className="home-line text-[26px] leading-[1.35] text-[#F2F1EE] transition-colors duration-300 group-hover:text-white md:text-[34px]">
                  《{poem.title}》
                </h2>

                {poem.intro ? (
                  <p className="mt-3 max-w-[480px] text-[13px] leading-[1.95] text-[#8E8C88] transition-colors duration-300 group-hover:text-[#C9C7C2] md:text-[14px]">
                    {poem.intro}
                  </p>
                ) : null}
              </article>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
