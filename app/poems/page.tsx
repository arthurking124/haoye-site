export const revalidate = 60

import Link from 'next/link'

import { sanityClient } from '@/lib/sanity.client'
import { allPoemsQuery } from '@/lib/queries'
import { urlFor } from '@/lib/sanity.image'

type PoemItem = {
  _id?: string
  title?: string
  slug?: { current?: string }
  publishedAt?: string
  intro?: string
  coverImage?: any
}

function formatPoemDate(date?: string) {
  if (!date) return null

  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
    }).format(new Date(date))
  } catch {
    return null
  }
}

export default async function PoemsPage() {
  const poems = await sanityClient.fetch<PoemItem[]>(allPoemsQuery)

  return (
    <div className="haoye-poems-page min-h-[100svh] bg-[var(--site-bg)] text-[var(--site-text-solid)]">
      <div className="mx-auto max-w-[1180px] px-6 pb-24 pt-28 md:px-10 md:pb-36 md:pt-36">
        <header className="haoye-poems-header max-w-[760px]">
          <p className="haoye-poems-kicker text-[11px] tracking-[0.22em] text-[var(--site-faint)]">
            POETRY ROOM
          </p>

          <h1 className="haoye-poems-title mt-6 text-[34px] font-light leading-[1.35] text-[var(--site-text-solid)] md:text-[54px] md:leading-[1.28]">
            诗
          </h1>

          <p className="haoye-poems-intro mt-6 max-w-[560px] text-[14px] leading-[1.95] text-[var(--site-dim)] md:text-[15px]">
            没有说完的话，被留在这里。
          </p>
        </header>

        <div className="haoye-poems-list mt-20 space-y-12 md:mt-28 md:space-y-16">
          {(poems ?? []).map((poem, index) => {
            const href = poem.slug?.current ? `/poems/${poem.slug.current}` : '/poems'
            const poemDate = formatPoemDate(poem.publishedAt)

            return (
              <article
                key={poem._id ?? `${poem.title}-${index}`}
                data-index={index % 3}
                className="haoye-poems-item group border-t border-[color:var(--site-border-soft)] pt-8 md:pt-10"
              >
                <div className="grid grid-cols-1 gap-8 md:grid-cols-[110px_minmax(0,1fr)] md:gap-10">
                  <div className="haoye-poems-meta flex items-start justify-between md:block">
                    <p className="haoye-poems-index text-[11px] tracking-[0.18em] text-[var(--site-faint)]">
                      {String(index + 1).padStart(2, '0')}
                    </p>

                    {poemDate ? (
                      <p className="haoye-poems-date text-[11px] tracking-[0.18em] text-[var(--site-faint)] md:mt-4">
                        {poemDate}
                      </p>
                    ) : null}
                  </div>

                  <div className="haoye-poems-row grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(240px,0.78fr)] md:gap-12">
                    <div className="haoye-poems-main max-w-[620px]">
                      <h2 className="haoye-poems-item-title text-[24px] font-light leading-[1.5] text-[var(--site-text-solid)] md:text-[34px] md:leading-[1.42]">
                        <Link
                          href={href}
                          className="haoye-poems-item-link transition-colors duration-300 hover:text-[var(--site-text)]"
                        >
                          《{poem.title ?? '未命名'}》
                        </Link>
                      </h2>

                      {poem.intro ? (
                        <p className="haoye-poems-item-intro mt-5 max-w-[520px] text-[14px] leading-[2.02] text-[var(--site-soft)] md:text-[15px] md:leading-[2.08]">
                          {poem.intro}
                        </p>
                      ) : null}

                      <div className="haoye-poems-enter-wrap mt-7">
                        <Link
                          href={href}
                          className="haoye-poems-enter inline-flex items-center gap-3 text-[11px] tracking-[0.22em] text-[var(--site-soft)] transition-all duration-300 hover:text-[var(--site-text-solid)]"
                        >
                          <span>ENTER POEM</span>
                          <span className="translate-y-[-1px] transition-transform duration-300 group-hover:translate-x-[2px]">
                            →
                          </span>
                        </Link>
                      </div>
                    </div>

                    {poem.coverImage ? (
                      <Link
                        href={href}
                        className="haoye-poems-media relative block overflow-hidden rounded-[16px] bg-[color:var(--site-border-soft)]"
                      >
                        <img
                          src={urlFor(poem.coverImage).width(1200).quality(90).url()}
                          alt={poem.title ?? `poem-${index + 1}`}
                          className="haoye-poems-cover h-[220px] w-full object-cover transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02] group-hover:brightness-[1.03] md:h-[280px]"
                        />
                        <div className="haoye-poems-overlay pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.34),rgba(0,0,0,0.08),rgba(0,0,0,0.16))]" />
                      </Link>
                    ) : (
                      <div className="hidden md:block" />
                    )}
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