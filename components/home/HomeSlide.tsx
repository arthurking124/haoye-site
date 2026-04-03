'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

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
  parallax?: { rotateX: number; rotateY: number; tx: number; ty: number }
}

type PortalTarget = 'poems' | 'images' | 'notes' | 'about' | null

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
  parallax = { rotateX: 0, rotateY: 0, tx: 0, ty: 0 },
}: HomeSlideProps) {
  const router = useRouter()
  const leaveTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  const [portalTarget, setPortalTarget] = useState<PortalTarget>(null)
  const [isEntering, setIsEntering] = useState(false)

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current !== null) {
        window.clearTimeout(leaveTimerRef.current)
      }
    }
  }, [])

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

  const bgRotateX = isLast ? parallax.rotateX * 0.38 : parallax.rotateX * 0.34
  const bgRotateY = isLast ? parallax.rotateY * 0.38 : parallax.rotateY * 0.34
  const bgTx = isLast ? parallax.tx * 0.3 : parallax.tx * 0.22
  const bgTy = isLast ? parallax.ty * 0.3 : parallax.ty * 0.22

  const atmosphereTx = isLast ? parallax.tx * 0.12 : 0
  const atmosphereTy = isLast ? parallax.ty * 0.12 : 0

  const backgroundTransform = `
    perspective(1200px)
    rotateX(${bgRotateX}deg)
    rotateY(${bgRotateY}deg)
    translate3d(${bgTx}px, ${bgTy}px, 0)
    scale(${isLast ? 1.02 : 1.018})
  `

  const atmosphereTransform = `
    translate3d(${atmosphereTx}px, ${atmosphereTy}px, 0)
    scale(1.01)
  `

  const revealStyle = (delay: number, duration = 1800) => ({
    transitionDelay: active ? `${delay}ms` : '0ms',
    transitionDuration: `${duration}ms`,
  })

  const beginPortalEnter =
    (href: string, target: Exclude<PortalTarget, null>) =>
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!isLast) return
      if (isEntering) {
        e.preventDefault()
        return
      }

      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return
      }

      e.preventDefault()

      setPortalTarget(target)
      setIsEntering(true)

      window.dispatchEvent(
        new CustomEvent('haoye:portal-enter', {
          detail: { href, target },
        })
      )

      leaveTimerRef.current = window.setTimeout(() => {
        router.push(href)
      }, 300)
    }

  const isTarget = (target: Exclude<PortalTarget, null>) =>
    isEntering && portalTarget === target

  const isOther = (target: Exclude<PortalTarget, null>) =>
    isEntering && portalTarget !== null && portalTarget !== target

  return (
    <section className="relative h-screen w-screen shrink-0 overflow-hidden bg-[#0B0B0C]">
      {imageUrl ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{ perspective: '1200px' }}
          >
            <div
              className="absolute"
              style={{
                transform: backgroundTransform,
                transition: 'transform 1400ms cubic-bezier(0.2, 0.5, 0.3, 1)',
                willChange: 'transform',
                width: 'calc(100% + 12px)',
                height: 'calc(100% + 12px)',
                top: '-6px',
                left: '-6px',
              }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${imageUrl})` }}
              />

              {isLast && (
                <>
                  <div
                    className={`absolute inset-0 transition-opacity duration-[2200ms] ease-out ${
                      active ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{
                      transform: atmosphereTransform,
                      transitionProperty: 'transform, opacity',
                      background:
                        'radial-gradient(circle at 50% 18%, rgba(255,255,255,0.06), transparent 30%), radial-gradient(circle at 50% 42%, rgba(255,255,255,0.045), transparent 42%)',
                      mixBlendMode: 'screen',
                      filter: 'blur(24px)',
                    }}
                  />

                  <div
                    className={`absolute inset-0 z-[1] transition-opacity ease-in-out ${
                      active
                        ? 'opacity-100 duration-[4200ms] delay-500'
                        : 'opacity-0 duration-[900ms]'
                    }`}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(to bottom, rgba(255,255,255,0.16), rgba(255,255,255,0.06) 28%, rgba(255,255,255,0.02) 52%, transparent 100%)',
                        clipPath: 'polygon(49.72% 0.1%, 50.72% 0.1%, 58% 100%, 42% 100%)',
                        mixBlendMode: 'screen',
                        filter:
                          'blur(42px) drop-shadow(0 0 28px rgba(255,255,255,0.22))',
                        animation: active
                          ? 'church-beam-breathe 14s ease-in-out infinite'
                          : 'none',
                        transformOrigin: 'top center',
                      }}
                    />

                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(to bottom, rgba(255,255,255,0.22), rgba(255,255,255,0.07) 24%, transparent 72%)',
                        clipPath: 'polygon(49.9% 0%, 50.45% 0%, 54.5% 100%, 45.5% 100%)',
                        mixBlendMode: 'screen',
                        filter: 'blur(18px)',
                        opacity: active ? 0.72 : 0,
                        transition: 'opacity 2400ms ease 700ms',
                      }}
                    />

                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(to bottom, rgba(255,255,255,0.06), transparent 60%)',
                        clipPath: 'polygon(49.95% 0%, 50.15% 0%, 51.4% 100%, 48.6% 100%)',
                        mixBlendMode: 'screen',
                        filter: 'blur(8px)',
                        opacity: active ? 0.5 : 0,
                        transition: 'opacity 2200ms ease 900ms',
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 z-[2] bg-black/48" />
          <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_20%_20%,rgba(120,128,137,0.14),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.04),transparent_24%)]" />
          <div className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(to_bottom,rgba(0,0,0,0.24),rgba(0,0,0,0.06),rgba(0,0,0,0.36))]" />

          {isLast && (
            <>
              <div className="pointer-events-none absolute inset-0 z-[2] bg-black/22" />
              <div
                className={`pointer-events-none absolute inset-0 z-[3] transition-opacity duration-[1800ms] ease-out ${
                  active ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  background:
                    'radial-gradient(circle at 50% 12%, rgba(255,255,255,0.035), transparent 26%), linear-gradient(to bottom, rgba(255,255,255,0.025), transparent 22%)',
                  mixBlendMode: 'screen',
                }}
              />
            </>
          )}
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[#0B0B0C]" />
      )}

      {isLast && (
        <div
          className={`pointer-events-none absolute inset-0 z-[8] transition-all duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isEntering ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_54%,rgba(255,255,255,0.025),transparent_32%),radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.06)_44%,rgba(0,0,0,0.18)_100%)]" />

          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.03) 26%, rgba(255,255,255,0.01) 54%, transparent 100%)',
              clipPath: 'polygon(49.78% 0%, 50.72% 0%, 58.1% 100%, 41.9% 100%)',
              mixBlendMode: 'screen',
              filter: 'blur(24px)',
              transform: isEntering ? 'scaleY(1.018)' : 'scaleY(0.995)',
              transition:
                'transform 360ms cubic-bezier(0.22,1,0.36,1), opacity 360ms ease',
              opacity: isEntering ? 0.55 : 0,
            }}
          />
        </div>
      )}

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
          className={`absolute z-10 ${basePosition} ${
            active ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          } transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isEntering ? 'scale-[1.002]' : 'scale-100'
          }`}
        >
          <div
            className={`home-entry ${
              mobile
                ? 'mb-6 text-[26px] tracking-[0.1em] leading-[1.75]'
                : 'mb-8 text-[30px] tracking-[0.12em] md:text-[52px]'
            }`}
          >
            <div className={`${mobile ? 'flex flex-col items-center gap-2' : ''}`}>
              <Link
                href="/poems"
                onClick={beginPortalEnter('/poems', 'poems')}
                className={`pointer-events-auto illuminated-text transition-all ease-out ${
                  active ? 'dimmed-word-active' : 'dimmed-word-idle'
                } ${isTarget('poems') ? 'portal-target-active' : ''} ${
                  isOther('poems') ? 'portal-target-dim' : ''
                }`}
                style={revealStyle(1350, 1600)}
              >
                诗
              </Link>{' '}
              <Link
                href="/images"
                onClick={beginPortalEnter('/images', 'images')}
                className={`pointer-events-auto illuminated-text transition-all ease-out ${
                  active ? 'lit-word-active' : 'lit-word-idle'
                } ${isTarget('images') ? 'portal-target-active' : ''} ${
                  isOther('images') ? 'portal-target-dim' : ''
                }`}
                style={revealStyle(1520, 1800)}
              >
                影
              </Link>{' '}
              <Link
                href="/notes"
                onClick={beginPortalEnter('/notes', 'notes')}
                className={`pointer-events-auto illuminated-text transition-all ease-out ${
                  active ? 'lit-word-active' : 'lit-word-idle'
                } ${isTarget('notes') ? 'portal-target-active' : ''} ${
                  isOther('notes') ? 'portal-target-dim' : ''
                }`}
                style={revealStyle(1680, 1900)}
              >
                与
              </Link>{' '}
              <Link
                href="/about"
                onClick={beginPortalEnter('/about', 'about')}
                className={`pointer-events-auto illuminated-text transition-all ease-out ${
                  active ? 'dimmed-word-active' : 'dimmed-word-idle'
                } ${isTarget('about') ? 'portal-target-active' : ''} ${
                  isOther('about') ? 'portal-target-dim' : ''
                }`}
                style={revealStyle(1460, 1600)}
              >
                我
              </Link>
            </div>
          </div>

          <div
            className={`home-signature pointer-events-none transition-all ease-out ${
              active ? 'lit-signature-active' : 'lit-signature-idle'
            } ${mobile ? 'text-[13px]' : 'text-[14px] md:text-[15px]'} ${
              isEntering ? 'portal-signature-soften' : ''
            }`}
            style={revealStyle(1860, 2200)}
          >
            {signature}
          </div>

          <div
            className={`home-meta pointer-events-none transition-all ease-out ${
              active ? 'meta-active' : 'meta-idle'
            } ${mobile ? 'mt-3 text-[10px]' : 'mt-3 text-[10px] md:text-[11px]'} ${
              isEntering ? 'portal-meta-soften' : ''
            }`}
            style={revealStyle(2080, 1800)}
          >
            {domainText}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes church-beam-breathe {
          0%,
          100% {
            opacity: 0.12;
            transform: scaleY(0.992);
          }
          50% {
            opacity: 0.88;
            transform: scaleY(1.04);
          }
        }

        .illuminated-text {
          position: relative;
          display: inline-block;
          opacity: 0;
          transform: translateY(10px);
          filter: blur(8px);
        }

        .lit-word-active,
        .dimmed-word-active,
        .lit-signature-active,
        .meta-active {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }

        .illuminated-text::after {
          content: '';
          position: absolute;
          left: -0.08em;
          right: -0.08em;
          bottom: 0.04em;
          height: 0.34em;
          pointer-events: none;
          border-radius: 999px;
          opacity: 0;
          transform: scaleX(0.9);
          transition: opacity 1800ms ease, transform 1800ms ease;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(255, 255, 255, 0.22),
            rgba(255, 255, 255, 0.08) 45%,
            transparent 78%
          );
          filter: blur(8px);
        }

        .lit-word-idle {
          color: rgba(233, 231, 225, 0.72);
          text-shadow: 0 0 0 rgba(255, 255, 255, 0),
            0 0 0 rgba(255, 255, 255, 0);
          opacity: 0;
          transform: translateY(10px);
          filter: blur(8px);
        }

        .lit-word-active {
          color: rgba(249, 248, 244, 0.96);
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.14),
            0 0 24px rgba(255, 255, 255, 0.08),
            0 0 54px rgba(255, 255, 255, 0.06);
        }

        .lit-word-active::after {
          opacity: 0.9;
          transform: scaleX(1);
        }

        .dimmed-word-idle {
          color: rgba(207, 204, 197, 0.56);
          text-shadow: none;
          opacity: 0;
          transform: translateY(10px);
          filter: blur(8px);
        }

        .dimmed-word-active {
          color: rgba(220, 216, 207, 0.68);
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.03),
            0 0 18px rgba(255, 255, 255, 0.02);
        }

        .dimmed-word-active::after {
          opacity: 0.14;
          transform: scaleX(0.96);
        }

        .lit-signature-idle {
          color: rgba(201, 199, 194, 0.72);
          text-shadow: none;
          opacity: 0;
          transform: translateY(10px);
          filter: blur(10px);
        }

        .lit-signature-active {
          color: rgba(238, 236, 229, 0.92);
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.12),
            0 0 26px rgba(255, 255, 255, 0.07),
            0 0 58px rgba(255, 255, 255, 0.05);
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }

        .meta-idle {
          color: rgba(127, 125, 121, 0.72);
          opacity: 0;
          transform: translateY(8px);
          filter: blur(8px);
        }

        .meta-active {
          color: rgba(154, 151, 145, 0.82);
          text-shadow: 0 0 18px rgba(255, 255, 255, 0.03);
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }

        .portal-target-active {
          transform: translateY(-0.5px) scale(1.01) !important;
          filter: blur(0) !important;
        }

        .portal-target-active::after {
          opacity: 0.72 !important;
          transform: scaleX(1.02) !important;
        }

        .portal-target-dim {
          opacity: 0.62 !important;
          filter: blur(0.6px) !important;
          transform: translateY(1px) scale(0.998) !important;
        }

        .portal-signature-soften {
          opacity: 0.76 !important;
          filter: blur(0.8px) !important;
          transform: translateY(1px) !important;
        }

        .portal-meta-soften {
          opacity: 0.58 !important;
          filter: blur(1px) !important;
          transform: translateY(1px) !important;
        }
      `}</style>
    </section>
  )
}