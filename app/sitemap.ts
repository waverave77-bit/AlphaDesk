import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://mrguyinvests.com'
  const now = new Date()

  return [
    { url: base,                    lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/upgrade`,       lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/glossary`,      lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/login`,         lastModified: now, changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${base}/register`,      lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/privacy`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/terms`,         lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]
}
