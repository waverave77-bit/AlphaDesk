import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Strictly private — require login, no public content
          '/dashboard',
          '/watchlist',
          '/alerts',
          '/settings',
          '/insights',
          '/admin',
          '/analytics',
          '/generate-assets',
          '/api/',
        ],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_URL ?? 'https://mrguyinvests.com'}/sitemap.xml`,
  }
}
