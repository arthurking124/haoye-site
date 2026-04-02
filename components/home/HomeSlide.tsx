'use client'

import Link from 'next/link'

type Portal = {
  href: string
  label: string
  kicker: string
  subtitle: string
}

type HomeSlideProps = {
  imageUrl?: string
  text?: string
  eyebrow?: string
  caption?: string
  signature?: string
  domainText?: string
  align?: 'left' | 'right' | 'center'
  isLast?: boolean
  index: number
  total: number
  active: boolean
  theme: 'distant' | 'approach' | 'weight' | 'portal'
}

const portals: Portal[] = [
  {
    href: '/poems',
    label: '诗',
    kicker: 'Poems',
    subtitle: '被留住的话，以及那些仍在暗处慢慢发亮的句子。',
  },
  {
    href: '/images',
    label: '影',
    kicker: 'Images',
    subtitle: '光、空间、被停住的表面，以及凝固下来的时间。',
  },
  {
    href: '/notes',
    label: '与',
    kicker: 'Notes',
    subtitle: '并非注解，只是回声，是主舞台之外仍在继续的低声。',
  },
  {
    href: '/about',
    label: '我',
    kicker: 'About',
    subtitle: '不是简历，而是一点更靠近源头的说明与尾声。',
  },
]

export default function HomeSlide({
  imageUrl,
  text,
  eyebrow,
  caption,
  signature = '皓野',
  domainText = 'haoye.cyou',
  align = 'left',
  isLast = false,
  index,
  total,
  active,
  theme,
}: HomeSlideProps) {
  const alignClass =
    align === 'left' ? 'is-left' : align === 'right' ? 'is-right' : 'is-center'

  return (
    <section
      className="haoye-slide"
      data-active={active}
      data-theme={theme}
      aria-hidden={!active}
    >
      <div className="haoye-slide__media">
        {imageUrl ? (
          <div
            className="haoye-slide__image"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        ) : null}

        <div className="haoye-slide__veil haoye-slide__veil--base" />
        <div className="haoye-slide__veil haoye-slide__veil--grain" />
        <div className="haoye-slide__veil haoye-slide__veil--vignette" />
        <div className="haoye-slide__light" />
        {theme === 'portal' ? <div className="haoye-slide__cross" /> : null}
      </div>

      <div className="haoye-slide__index home-index">
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>

      {!isLast ? (
        <div className={`haoye-slide__content ${alignClass}`}>
          {eyebrow ? (
            <div className="haoye-slide__eyebrow font-ui">{eyebrow}</div>
          ) : null}

          {text ? <p className="haoye-slide__line home-line">{text}</p> : null}

          {caption ? <p className="haoye-slide__caption">{caption}</p> : null}

          <div className="haoye-slide__signature home-signature">{signature}</div>
          <div className="haoye-slide__domain home-meta">{domainText}</div>
        </div>
      ) : (
        <div className="haoye-slide__content is-center haoye-slide__portal-wrap">
          {eyebrow ? (
            <div className="haoye-slide__eyebrow font-ui">{eyebrow}</div>
          ) : null}

          {text ? <p className="haoye-slide__line home-line">{text}</p> : null}

          {caption ? <p className="haoye-slide__caption mx-auto">{caption}</p> : null}

          <div className="haoye-slide__portal-grid">
            {portals.map((item) => (
              <Link key={item.href} href={item.href} className="haoye-slide__portal">
                <div>
                  <div className="haoye-slide__portal-kicker font-ui">{item.kicker}</div>
                  <div className="haoye-slide__portal-title home-entry">{item.label}</div>
                  <div className="haoye-slide__portal-subtitle">{item.subtitle}</div>
                </div>

                <div className="haoye-slide__portal-foot font-ui">Enter</div>
              </Link>
            ))}
          </div>

          <div className="haoye-slide__signature home-signature mt-8">{signature}</div>
          <div className="haoye-slide__domain home-meta">{domainText}</div>
        </div>
      )}
    </section>
  )
}