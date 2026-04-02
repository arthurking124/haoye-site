export const revalidate = 60

import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import { sanityClient } from '@/lib/sanity.client'
import { poemBySlugQuery } from '@/lib/queries'
import { urlFor } from '@/lib/sanity.image'

type PoemDetail = {
  title: string
  intro?: string
  coverImage?: any
  body?: any
}

export default async function PoemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const poem = await sanityClient.fetch<PoemDetail>(poemBySlugQuery, { slug })

  const cover = poem.coverImage
    ? urlFor(poem.coverImage).width(1800).quality(92).url()
    : ''

  return (
    <article className="poem-detail">
      <Link href="/poems" className="poem-detail__back font-ui">
        Back to Poems
      </Link>

      <header className="poem-detail__head">
        <h1 className="poem-detail__title home-line">《{poem.title}》</h1>

        {poem.intro ? <p className="poem-detail__intro">{poem.intro}</p> : null}
      </header>

      {cover ? (
        <div className="poem-detail__cover">
          <img src={cover} alt={poem.title} />
        </div>
      ) : null}

      <section className="poem-detail__reading">
        <div className="poem-reading home-line">
          <PortableText value={poem.body} />
        </div>
      </section>
    </article>
  )
}