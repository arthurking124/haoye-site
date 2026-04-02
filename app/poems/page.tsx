export const revalidate = 60

import Link from 'next/link'
import { sanityClient } from '@/lib/sanity.client'
import { allPoemsQuery } from '@/lib/queries'

type Poem = {
  _id: string
  title: string
  slug: { current: string }
  intro?: string
}

export default async function PoemsPage() {
  const poems = await sanityClient.fetch<Poem[]>(allPoemsQuery)

  return (
    <div className="page-shell">
      <div className="page-hero">
        <div className="page-kicker font-ui">Reading Space · Poems</div>
        <h1 className="page-title home-line">诗</h1>
        <p className="page-subtitle">
          这里不是文章列表，而是一些被慢慢允许出现的句子。不要急着把它们读完，
          先让它们在页面里停一下，再向你靠近。
        </p>
      </div>

      <div className="poem-list">
        {poems.map((poem, index) => (
          <Link key={poem._id} href={`/poems/${poem.slug.current}`} className="poem-item group">
            <div className="poem-item__index font-ui">
              {String(index + 1).padStart(2, '0')} / Poem
            </div>

            <article>
              <h2 className="poem-item__title home-line">《{poem.title}》</h2>

              {poem.intro ? <p className="poem-item__intro">{poem.intro}</p> : null}

              <div className="poem-item__foot font-ui">Enter Reading</div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  )
}