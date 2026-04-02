import type { MetadataRoute } from 'next'

import { sanityClient } from '@/lib/sanity.client'
import { allImageSeriesQuery, allPoemsQuery } from '@/lib/queries'

const baseUrl = 'https://www.haoye.cyou'

type PoemItem = {
  slug?: { current?: string }
  publishedAt?: string
}

type ImageSeriesItem = {
  slug?: { current?: string }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/poems`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/images`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/notes`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  const [poems, imageSeries] = await Promise.all([
    sanityClient.fetch<PoemItem[]>(allPoemsQuery),
    sanityClient.fetch<ImageSeriesItem[]>(allImageSeriesQuery),
  ])

  const poemRoutes: MetadataRoute.Sitemap = (poems ?? [])
    .filter((poem) => poem?.slug?.current)
    .map((poem) => ({
      url: `${baseUrl}/poems/${poem.slug!.current!}`,
      lastModified: poem.publishedAt ? new Date(poem.publishedAt) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    }))

  const imageRoutes: MetadataRoute.Sitemap = (imageSeries ?? [])
    .filter((item) => item?.slug?.current)
    .map((item) => ({
      url: `${baseUrl}/images/${item.slug!.current!}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    }))

  return [...staticRoutes, ...poemRoutes, ...imageRoutes]
}