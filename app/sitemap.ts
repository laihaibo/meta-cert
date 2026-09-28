import type { MetadataRoute } from 'next'
import { getManifest } from '@/lib/content'
import { SITE_BASE, SITE_ORIGIN } from '@/lib/site'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const manifest = getManifest()
  const now = new Date()

  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_ORIGIN}${SITE_BASE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    {
      url: `${SITE_ORIGIN}${SITE_BASE}/progress/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  for (const page of manifest.allPages) {
    if (!page.routePath) continue
    const priority =
      page.type === 'index' ? 0.9 : page.type === 'quiz' || page.type === 'summary' ? 0.7 : 0.6
    entries.push({
      url: `${SITE_ORIGIN}${page.sitePath}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority,
    })
  }

  return entries
}
