import { MetadataRoute } from 'next'
import { TERMS, termToSlug } from '@/lib/glossary-terms'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_URL ?? 'https://mrguyinvests.com'
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base,                    lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/glossary`,      lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/register`,      lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/upgrade`,       lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/login`,         lastModified: now, changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${base}/privacy`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${base}/terms`,         lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
  ]

  // All 100+ glossary term pages — these are the best SEO targets
  // People search "what is P/E ratio", "what is beta stock", etc. every day
  const glossaryRoutes: MetadataRoute.Sitemap = TERMS.map(term => ({
    url:             `${base}/glossary/${termToSlug(term.term)}`,
    lastModified:    now,
    changeFrequency: 'monthly' as const,
    priority:        0.8,
  }))

  return [...staticRoutes, ...glossaryRoutes]
}
