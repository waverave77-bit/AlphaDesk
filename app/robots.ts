import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/research/',
          '/watchlist',
          '/earnings',
          '/hedgefunds',
          '/insiders',
          '/markets',
          '/alerts',
          '/settings/',
          '/chat',
          '/learn',
          '/quant',
          '/game',
          '/roast',
          '/briefing',
          '/bull-vs-bear',
          '/hot-take',
          '/report-card',
          '/reality-check',
          '/translator',
          '/am-i-dumb',
          '/bs-checker',
          '/challenge',
          '/insights',
          '/admin',
          '/generate-assets',
          '/upgrade',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://mrguyinvests.com/sitemap.xml',
  }
}
