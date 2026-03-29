'use client'

import Link from 'next/link'

type HomeSlideProps = {
  imageUrl?: string
  text?: string
  signature?: string
  domainText?: string
  align?: 'left' | 'right' | 'center'
  isLast?: boolean
  index?: number
  total?: number
  active?: boolean
  mobile?: boolean
}

export default function HomeSlide({
  imageUrl,
  text,
  signature = '皓野',
  domainText = 'haoye.cyou',
  align = 'left',
  isLast = false,
  index = 0,
  total = 4,
  active = false,
  mobile = false,
}: HomeSlideProps) {
  const basePosition =
    align === 'left'
      ? mobile
        ? 'left-[8%] bottom-[24%] text-left'
        : 'left-[8%] bottom-[18%] text-left'
      : align === 'right'
      ? mobile
        ? 'right-[8%] bottom-[24%] text-right'
        : 'right-[8%] bottom-[18%] text-right'
      : mobile
      ? 'left-1/2 top-[56%] -translate-x-1/2 text-center'
      : 'left-1/2 top-[60%] -translate-x-1/2 text-center'

  return (
    <section className="relative h-screen w-screen shrink-0 overflow-hidden bg-[#0B0B0C]">
      {imageUrl ? (
        <>
          <div
            className={`pointer-events-none absolute inset-0 bg-cover bg-center transition-transform duration-[1400ms] ease-out ${
              active ? 'scale-[1.02]' : 'scale-[1.0]'
            }`}
            style={{ backgroundImage: `url(${imageUrl})` }}
          />

          <div className="pointer-events-none absolute inset-0 bg-black/48" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(120,128,137,0.14),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.04),transparent_24%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.24),rgba(0,0,0,0.06),rgba(0,0,0,0.36))]" />
          {isLast && <div className="pointer-events-none absolute inset-0 bg-black/12" />}
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[#0B0B0C]" />
      )}

      {/* 页码 */}
      <div
        className={`pointer-events-none absolute z-10 home-index ${
          mobile
            ? 'left-6 top-8 text-[10px] text-white/18'
            : 'left-8 top-8 text-[11px] text-white/28'
        }`}
      >
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>

      {!isLast ? (
        <div
          className={`pointer-events-none absolute z-10 ${basePosition} max-w-[760px] transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            active ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <p
            className={`home-line max-w-[760px] ${
              mobile
                ? 'text-[22px] leading-[1.42]'
                : 'text-[24px] leading-[1.48] md:text-[42px]'
            }`}
          >
            {text}
          </p>

          <p
            className={`home-signature text-[#C9C7C2] ${
              mobile ? 'mt-4 text-[14px]' : 'mt-5 text-[15px] md:text-[16px]'
            }`}
          >
            {signature}
          </p>
        </div>
      ) : (
        <div
          className={`absolute z-10 ${basePosition} transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            active ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <div
            className={`home-entry ${
              mobile
                ? 'mb-5 text-[28px] tracking-[0.12em] leading-[1.7]'
                : 'mb-6 text-[32px] tracking-[0.18em] md:text-[58px]'
            }`}
          >
            {mobile ? (
              <div className="flex flex-col items-center gap-2">
                <Link
                  href="/poems"
                  className="pointer-events-auto transition-colors duration-300 hover:text-white/90"
                >
                  诗
                </Link>
                <Link
                  href="/images"
                  className="pointer-events-auto transition-colors duration-300 hover:text-white/90"
                >
                  影
                </Link>
                <Link
                  href="/notes"
                  className="pointer-events-auto transition-colors duration-300 hover:text-white/90"
                >
                  与
                </Link>
                <Link
                  href="/about"
                  className="pointer-events-auto transition-colors duration-300 hover:text-white/90"
                >
                  我
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/poems"
                  className="pointer-events-auto transition-colors duration-300 hover:text-white/90"
                >
                  诗
                </Link>{' '}
                <Link
                  href="/images"
                  className="pointer-events-auto transition-colors duration-300 hover:text-white/90"
                >
                  影
                </Link>{' '}
                <Link
                  href="/notes"
                  className="pointer-events-auto transition-colors duration-300 hover:text-white/90"
                >
                  与
                </Link>{' '}
                <Link
                  href="/about"
                  className="pointer-events-auto transition-colors duration-300 hover:text-white/90"
                >
                  我
                </Link>
              </>
            )}
          </div>

          <div
            className={`home-signature pointer-events-none text-[#C9C7C2] ${
              mobile ? 'text-[14px]' : 'text-[15px] md:text-[16px]'
            }`}
          >
            {signature}
          </div>

          <div
            className={`home-meta pointer-events-none text-[#8E8C88] ${
              mobile ? 'mt-2 text-[10px]' : 'mt-2 text-[11px] md:text-[12px]'
            }`}
          >
            {domainText}
          </div>
        </div>
      )}
    </section>
  )
}
