import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: 'https://www.haoye.cyou/sitemap.xml',
    host: 'https://www.haoye.cyou',
  }
}