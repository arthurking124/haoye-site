export const revalidate = 60

import { sanityClient } from '@/lib/sanity.client'
import { allImageSeriesQuery } from '@/lib/queries'
import { urlFor } from '@/lib/sanity.image'
import Link from 'next/link'

export default async function ImagesPage() {
  const items = await sanityClient.fetch(allImageSeriesQuery)

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-28 md:px-8 md:py-36">
      <div className="mx-auto max-w-[1120px]">
        <div className="max-w-[520px]">
          <h1 className="home-line text-[42px] leading-[1.2] text-[#F2F1EE] md:text-[58px]">
            影
          </h1>
          <p className="mt-4 text-[15px] leading-[1.9] text-[#C9C7C2] md:text-[16px]">
            光、空间，以及被截留下来的图像。
          </p>
        </div>

        <div className="mt-20 md:mt-24">
          <div className="grid grid-cols-1 gap-y-20 md:gap-y-28">
            {items.map((item: any) => (
              <Link
                key={item._id}
                href={`/images/${item.slug.current}`}
                className="group block"
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.25fr_0.75fr] md:items-end md:gap-10">
                  <div className="overflow-hidden rounded-[10px] bg-[#111214]">
                    {item.images?.[0] && (
                      <img
                        src={urlFor(item.images[0]).width(1800).quality(90).url()}
                        alt={item.title}
                        className="image-cover h-auto w-full object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-[1.018]"
                      />
                    )}
                  </div>

                  <div className="max-w-[360px] md:pb-2">
                    <h2 className="home-line text-[26px] leading-[1.35] text-[#F2F1EE] transition-colors duration-300 group-hover:text-white md:text-[32px]">
                      {item.title}
                    </h2>

                    {item.subtitle ? (
                      <p className="mt-3 text-[14px] leading-[1.9] text-[#8E8C88] transition-colors duration-300 group-hover:text-[#C9C7C2] md:text-[15px]">
                        {item.subtitle}
                      </p>
                    ) : null}

                    <div className="mt-6 home-meta text-[10px] text-[#8E8C88] md:text-[11px]">
                      ENTER SERIES
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
