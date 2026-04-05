export const revalidate = 60

import Link from 'next/link'

import { sanityClient } from '@/lib/sanity.client'
import { allImageSeriesQuery } from '@/lib/queries'
import { urlFor } from '@/lib/sanity.image'

type ImageSeriesItem = {
  _id?: string
  title?: string
  subtitle?: string
  slug?: { current?: string }
  images?: any[]
}

const layoutMap = [
  {
    article: 'md:pl-[2%]',
    media: 'md:max-w-[74%]',
    copy: 'md:ml-[9%] md:max-w-[34ch]',
    align: 'items-start',
  },
  {
    article: 'md:pl-[20%]',
    media: 'md:ml-auto md:max-w-[66%]',
    copy: 'md:mr-[8%] md:max-w-[32ch]',
    align: 'items-end',
  },
  {
    article: 'md:pl-[8%]',
    media: 'md:max-w-[70%]',
    copy: 'md:ml-[14%] md:max-w-[36ch]',
    align: 'items-start',
  },
]

export default async function ImagesPage() {
  const items = await sanityClient.fetch<ImageSeriesItem[]>(allImageSeriesQuery)

  return (
    <div className="min-h-[100svh] bg-[var(--site-bg)] text-[var(--site-text-solid)]">
      <div className="mx-auto max-w-[1480px] px-6 pb-28 pt-28 md:px-10 md:pb-40 md:pt-36">
        <header className="max-w-[720px]">
          <p className="text-[11px] tracking-[0.24em] text-[var(--site-faint)]">
            IMAGE FIELD
          </p>

          <h1 className="mt-6 text-[34px] font-light leading-[1.3] text-[var(--site-text-solid)] md:text-[56px] md:leading-[1.22]">
            影
          </h1>

          <p className="mt-7 max-w-[34ch] text-[14px] leading-[2.02] text-[var(--site-dim)] md:text-[15px]">
            不是收藏图像，而是在经过它们的时候，被它们短暂停住。
          </p>
        </header>

        <div className="mt-18 space-y-18 md:mt-28 md:space-y-28">
          {(items ?? []).map((item, index) => {
            const cover = item.images?.[0]
            const href = item.slug?.current ? `/images/${item.slug.current}` : '/images'
            const layout = layoutMap[index % layoutMap.length]

            return (
              <article
                key={item._id ?? `${item.title}-${index}`}
                className={`border-t border-[color:var(--site-border-soft)] pt-8 md:pt-10 ${layout.article}`}
              >
                <div className={`flex flex-col gap-7 md:gap-9 ${layout.align}`}>
                  <div className="w-full">
                    <div className="mb-5 flex items-center gap-4 md:mb-6">
                      <span className="text-[11px] tracking-[0.2em] text-[var(--site-faint)]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="h-px flex-1 bg-[color:var(--site-line-soft)]" />
                    </div>

                    <Link
                      href={href}
                      className={`group block overflow-hidden rounded-[22px] surface-soft ${layout.media}`}
                    >
                      {cover ? (
                        <img
                          src={urlFor(cover).width(1800).quality(90).url()}
                          alt={item.title ?? `image-series-${index + 1}`}
                          className="image-cover h-[300px] w-full object-cover motion-image group-hover:scale-[1.01] md:h-[520px]"
                        />
                      ) : (
                        <div className="flex h-[300px] w-full items-center justify-center text-[12px] tracking-[0.18em] text-[var(--site-faint)] md:h-[520px]">
                          NO IMAGE
                        </div>
                      )}
                    </Link>
                  </div>

                  <div className={`w-full ${layout.copy}`}>
                    <div className="flex flex-col gap-4 md:gap-5">
                      <h2 className="text-[24px] font-light leading-[1.34] text-[var(--site-text-solid)] md:text-[36px] md:leading-[1.26]">
                        {item.title ?? '未命名'}
                      </h2>

                      <p className="text-[14px] leading-[2.02] text-[var(--site-dim)] md:text-[15px]">
                        {item.subtitle || '一些被停住的光，以及仍在继续的沉默。'}
                      </p>

                      <div className="pt-2 md:pt-3">
                        <Link
                          href={href}
                          className="inline-flex items-center gap-3 text-[11px] tracking-[0.22em] text-[var(--site-soft)] transition-all duration-300 hover:text-[var(--site-text-solid)]"
                        >
                          <span>ENTER SERIES</span>
                          <span className="translate-y-[-1px] transition-transform duration-300 group-hover:translate-x-[2px]">
                            →
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}