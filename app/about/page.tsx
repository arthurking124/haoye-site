export const revalidate = 60

import { notFound } from 'next/navigation'
import { PortableText } from '@portabletext/react'
import { sanityClient } from '@/lib/sanity.client'
import { aboutPageQuery } from '@/lib/queries'

export default async function AboutPage() {
  const about = await sanityClient.fetch<{
    title?: string
    subtitle?: string
    body?: any
  }>(aboutPageQuery)

  if (!about) {
    notFound()
  }

  return (
    <main className="screen-balance page-top-offset relative z-[1] bg-[var(--site-bg)] text-[var(--site-text)]">
      <section className="mx-auto max-w-[1440px] px-5 pb-20 md:px-8 md:pb-28">
        <div className="grid gap-14 md:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] md:gap-20">
          <div className="surface-soft edge-line rounded-[28px] border p-7 md:p-10">
            <p className="font-ui text-[11px] tracking-[0.42em] text-[var(--site-muted)]">
              BEHIND THE DOOR
            </p>

            <h1 className="mt-7 home-line text-[68px] leading-none text-[var(--site-text-solid)] md:text-[92px]">
              {about.title || '我'}
            </h1>

            {about.subtitle ? (
              <p className="mt-8 max-w-[24ch] text-[17px] leading-[1.95] text-[var(--site-soft)] md:text-[19px]">
                {about.subtitle}
              </p>
            ) : null}
          </div>

          <div className="grid gap-8 md:grid-cols-[84px_minmax(0,1fr)] md:gap-10">
            <div className="edge-line-soft flex items-start justify-between border-b pb-3 md:block md:border-b-0 md:border-r md:pb-0 md:pr-6">
              <span className="font-ui text-[11px] tracking-[0.34em] text-[var(--site-faint)]">
                01
              </span>
              <span className="font-ui text-[11px] tracking-[0.28em] text-[var(--site-muted)] md:mt-4 md:block">
                ABOUT
              </span>
            </div>

            <div className="surface-soft edge-line rounded-[28px] border p-7 md:p-10">
              {about.body ? (
                <div className="reading-body prose prose-invert max-w-none">
                  <PortableText value={about.body} />
                </div>
              ) : (
                <p className="text-[16px] leading-[1.95] text-[var(--site-soft)]">
                  这里暂时还没有留下更多内容。
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}