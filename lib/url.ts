import { SITE_BASE } from '@/lib/site'

/**
 * Next.js <Link> 会自动附加 basePath，因此传给 Link 的内部路径必须先剥掉
 * manifest 中已带的前缀；普通 <a> / sitemap / JSON-LD 则使用完整路径。
 */
export function stripBase(path: string): string {
  if (path === SITE_BASE) return '/'
  return path.startsWith(SITE_BASE + '/') ? path.slice(SITE_BASE.length) : path
}
