import { MetadataRoute } from 'next'
import { TERMS, termToSlug } from '@/lib/glossary-terms'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_URL ?? 'https://mrguyinvests.com'
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    // ── Public marketing pages ─────────────────────────────────────────
    { url: base,                        lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/glossary`,          lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/register`,          lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

    // ── Guest-accessible app pages (real content Google can rank) ──────
    { url: `${base}/trading-simulator`, lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/markets`,           lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${base}/challenge`,         lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/bull-vs-bear`,      lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/translator`,        lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/report-card`,       lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/hot-take`,          lastModified: now, changeFrequency: 'daily',   priority: 0.6 },
    { url: `${base}/reality-check`,     lastModified: now, changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${base}/spike-summary`,     lastModified: now, changeFrequency: 'daily',   priority: 0.6 },
    { url: `${base}/earnings`,          lastModified: now, changeFrequency: 'daily',   priority: 0.6 },
    { url: `${base}/hedgefunds`,        lastModified: now, changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${base}/markets`,           lastModified: now, changeFrequency: 'daily',   priority: 0.6 },
    { url: `${base}/learn`,             lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/upgrade`,           lastModified: now, changeFrequency: 'monthly', priority: 0.6 },

    // ── Legal ──────────────────────────────────────────────────────────
    { url: `${base}/privacy`,           lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${base}/terms`,             lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
  ]

  // All 100+ glossary term pages — best SEO targets
  // People search "what is P/E ratio", "what is beta stock", etc. every day
  const glossaryRoutes: MetadataRoute.Sitemap = TERMS.map(term => ({
    url:             `${base}/glossary/${termToSlug(term.term)}`,
    lastModified:    now,
    changeFrequency: 'monthly' as const,
    priority:        0.8,
  }))

  return [...staticRoutes, ...glossaryRoutes]
}
