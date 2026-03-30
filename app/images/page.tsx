export const revalidate = 60

import { sanityClient } from '@/lib/sanity.client'
import { allImageSeriesQuery } from '@/lib/queries'
import { urlFor } from '@/lib/sanity.image'
import Link from 'next/link'

export default async function ImagesPage() {
  const items = await sanityClient.fetch(allImageSeriesQuery)

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-32">
      <h1 className="text-[44px] font-light">影</h1>
      <p className="mt-4 text-[15px] text-[#C9C7C2]">
        光、空间，以及被留下来的图像。
      </p>

      <div className="mt-24 space-y-28">
        {items.map((item: any) => (
          <Link key={item._id} href={`/images/${item.slug.current}`} className="group block">
            <div className="overflow-hidden rounded-[10px]">
              {item.images?.[0] && (
                <img
                  src={urlFor(item.images[0]).width(1600).url()}
                  alt={item.title}
                  className="w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.015]"
                />
              )}
            </div>
            <h2 className="mt-6 text-[24px] font-light text-[#F2F1EE] transition-colors duration-300 group-hover:text-white">
              {item.title}
            </h2>
            {item.subtitle ? (
              <p className="mt-2 text-[13px] text-[#8E8C88] transition-colors duration-300 group-hover:text-[#C9C7C2]">
                {item.subtitle}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  )
}
