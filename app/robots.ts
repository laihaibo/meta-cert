import type { MetadataRoute } from 'next'
import { SITE_BASE, SITE_ORIGIN } from '@/lib/site'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_ORIGIN}${SITE_BASE}/sitemap.xml`,
  }
}
