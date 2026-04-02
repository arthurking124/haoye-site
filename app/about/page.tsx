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
    <div className="min-h-[100svh] bg-[#0D0D0D] text-[#F2F1EE]">
      <div className="mx-auto max-w-[1040px] px-6 pb-24 pt-28 md:px-10 md:pb-36 md:pt-36">
        <header className="max-w-[720px]">
          <p className="text-[11px] tracking-[0.22em] text-[#7F7D79]">BEHIND THE DOOR</p>

          <h1 className="mt-6 text-[34px] font-light leading-[1.35] md:text-[54px] md:leading-[1.28]">
            {about.title || '我'}
          </h1>

          {about.subtitle ? (
            <p className="mt-6 max-w-[560px] text-[14px] leading-[1.95] text-[#8E8C88] md:text-[15px]">
              {about.subtitle}
            </p>
          ) : null}
        </header>

        <div className="mt-18 border-t border-white/8 pt-10 md:mt-24 md:pt-14">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[120px_minmax(0,1fr)] md:gap-12">
            <div>
              <p className="text-[11px] tracking-[0.18em] text-[#6F6D69]">01</p>
              <p className="mt-4 text-[11px] tracking-[0.22em] text-[#8E8C88]">
                ABOUT
              </p>
            </div>

            <div className="max-w-[640px]">
              {about.body ? (
                <div
                  className="
                    max-w-none
                    [&_p]:mb-[1.35em]
                    [&_p]:text-[15px]
                    [&_p]:leading-[2.05]
                    [&_p]:text-[#D7D3CC]
                    [&_p:last-child]:mb-0

                    [&_h2]:mt-[2.1em]
                    [&_h2]:mb-[0.8em]
                    [&_h2]:text-[26px]
                    [&_h2]:font-light
                    [&_h2]:leading-[1.45]
                    [&_h2]:tracking-[0.04em]
                    [&_h2]:text-[#F2F1EE]

                    [&_h3]:mt-[2.1em]
                    [&_h3]:mb-[0.8em]
                    [&_h3]:text-[20px]
                    [&_h3]:font-light
                    [&_h3]:leading-[1.5]
                    [&_h3]:tracking-[0.04em]
                    [&_h3]:text-[#F2F1EE]

                    [&_h4]:mt-[2.1em]
                    [&_h4]:mb-[0.8em]
                    [&_h4]:font-light
                    [&_h4]:leading-[1.5]
                    [&_h4]:tracking-[0.04em]
                    [&_h4]:text-[#F2F1EE]

                    [&_ul]:mb-[1.4em]
                    [&_ul]:pl-[1.1em]
                    [&_ul]:text-[#D7D3CC]

                    [&_ol]:mb-[1.4em]
                    [&_ol]:pl-[1.1em]
                    [&_ol]:text-[#D7D3CC]

                    [&_li]:my-[0.45em]
                    [&_li]:leading-[1.95]

                    [&_a]:border-b
                    [&_a]:border-[rgba(215,211,204,0.18)]
                    [&_a]:text-[#D7D3CC]
                    [&_a]:no-underline
                    [&_a]:transition-colors
                    [&_a]:duration-200
                    hover:[&_a]:text-[#F2F1EE]

                    [&_strong]:font-normal
                    [&_strong]:text-[#F2F1EE]

                    md:[&_p]:text-[16px]
                    md:[&_p]:leading-[2.12]
                    md:[&_h2]:text-[30px]
                    md:[&_h3]:text-[22px]
                  "
                >
                  <PortableText value={about.body} />
                </div>
              ) : (
                <p className="text-[15px] leading-[2.05] text-[#A6A39D]">
                  这里暂时还没有留下更多内容。
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}