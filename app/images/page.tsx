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

export default async function ImagesPage() {
  const items = await sanityClient.fetch<ImageSeriesItem[]>(allImageSeriesQuery)

  return (
    <div className="min-h-[100svh] bg-[var(--site-bg)] text-[var(--site-text-solid)]">
      <div className="mx-auto max-w-[1320px] px-6 pb-24 pt-28 md:px-10 md:pb-36 md:pt-36">
        <header className="max-w-[760px]">
          <p className="text-[11px] tracking-[0.22em] text-[var(--site-faint)]">
            IMAGE ARCHIVE
          </p>

          <h1 className="mt-6 text-[34px] font-light leading-[1.35] text-[var(--site-text-solid)] md:text-[54px] md:leading-[1.28]">
            影
          </h1>

          <p className="mt-6 max-w-[560px] text-[14px] leading-[1.95] text-[var(--site-dim)] md:text-[15px]">
            光、空间，以及被截留下来的图像。
          </p>
        </header>

        <div className="mt-20 md:mt-28">
          {(items ?? []).map((item, index) => {
            const cover = item.images?.[0]
            const href = item.slug?.current ? `/images/${item.slug.current}` : '/images'

            return (
              <article
                key={item._id ?? `${item.title}-${index}`}
                className="group border-t border-[color:var(--site-border-soft)] py-10 md:py-14"
              >
                <div className="grid grid-cols-1 gap-8 md:grid-cols-[120px_minmax(0,1fr)] md:gap-10">
                  <div className="flex items-start justify-between md:block">
                    <p className="text-[11px] tracking-[0.18em] text-[var(--site-faint)]">
                      {String(index + 1).padStart(2, '0')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-7 md:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.76fr)] md:gap-12">
                    <Link
                      href={href}
                      className="relative block overflow-hidden rounded-[18px] bg-[color:var(--site-border-soft)]"
                    >
                      {cover ? (
                        <>
                          <img
                            src={urlFor(cover).width(1800).quality(90).url()}
                            alt={item.title ?? `image-series-${index + 1}`}
                            className="h-[300px] w-full object-cover transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02] group-hover:brightness-[1.04] md:h-[500px]"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.36),rgba(0,0,0,0.06),rgba(0,0,0,0.12))]" />
                          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.12),transparent_32%)] mix-blend-screen" />
                          </div>
                        </>
                      ) : (
                        <div className="flex h-[300px] w-full items-center justify-center bg-[color:var(--site-border-soft)] text-[12px] tracking-[0.18em] text-[var(--site-faint)] md:h-[500px]">
                          NO IMAGE
                        </div>
                      )}
                    </Link>

                    <div className="flex flex-col justify-between">
                      <div>
                        <h2 className="text-[26px] font-light leading-[1.35] text-[var(--site-text-solid)] md:text-[38px] md:leading-[1.28]">
                          {item.title ?? '未命名'}
                        </h2>

                        <p className="mt-5 max-w-[420px] text-[14px] leading-[1.95] text-[var(--site-dim)] md:text-[15px]">
                          {item.subtitle || '一些被停住的光，以及仍在继续的沉默。'}
                        </p>
                      </div>

                      <div className="mt-8 md:mt-12">
                        <Link
                          href={href}
                          className="inline-flex items-center gap-3 text-[11px] tracking-[0.24em] text-[var(--site-soft)] transition-all duration-300 hover:text-[var(--site-text-solid)]"
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