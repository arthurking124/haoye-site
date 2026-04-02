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
                <div className="about-body prose prose-invert max-w-none">
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

      <style jsx global>{`
        .about-body p {
          margin: 0 0 1.35em 0;
          color: #d7d3cc;
          font-size: 15px;
          line-height: 2.05;
        }

        .about-body p:last-child {
          margin-bottom: 0;
        }

        .about-body h2,
        .about-body h3,
        .about-body h4 {
          margin: 2.1em 0 0.8em 0;
          font-weight: 300;
          letter-spacing: 0.04em;
          color: #f2f1ee;
        }

        .about-body h2 {
          font-size: 26px;
          line-height: 1.45;
        }

        .about-body h3 {
          font-size: 20px;
          line-height: 1.5;
        }

        .about-body ul,
        .about-body ol {
          margin: 0 0 1.4em 0;
          padding-left: 1.1em;
          color: #d7d3cc;
        }

        .about-body li {
          margin: 0.45em 0;
          line-height: 1.95;
        }

        .about-body a {
          color: #d7d3cc;
          text-decoration: none;
          border-bottom: 1px solid rgba(215, 211, 204, 0.18);
          transition:
            color 220ms ease,
            border-color 220ms ease;
        }

        .about-body a:hover {
          color: #f2f1ee;
          border-color: rgba(242, 241, 238, 0.45);
        }

        .about-body strong {
          color: #f2f1ee;
          font-weight: 400;
        }

        @media (min-width: 768px) {
          .about-body p {
            font-size: 16px;
            line-height: 2.12;
          }

          .about-body h2 {
            font-size: 30px;
          }

          .about-body h3 {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  )
}