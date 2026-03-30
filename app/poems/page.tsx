export const revalidate = 60

import { sanityClient } from '@/lib/sanity.client'
import { allPoemsQuery } from '@/lib/queries'
import Link from 'next/link'

export default async function PoemsPage() {
  const poems = await sanityClient.fetch(allPoemsQuery)

  return (
    <div className="mx-auto max-w-[760px] px-6 py-32">
      <h1 className="text-[44px] font-light">诗</h1>
      <p className="mt-4 text-[15px] text-[#C9C7C2]">
        没有说完的话，被留在这里。
      </p>

      <div className="mt-20 space-y-14">
        {poems.map((poem: any) => (
          <Link key={poem._id} href={`/poems/${poem.slug.current}`} className="group block">
            <h2 className="text-[24px] font-light text-[#F2F1EE] transition-colors duration-300 group-hover:text-white">
              {poem.title}
            </h2>
            {poem.intro ? (
              <p className="mt-2 text-[13px] text-[#8E8C88] transition-colors duration-300 group-hover:text-[#C9C7C2]">
                {poem.intro}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  )
}
