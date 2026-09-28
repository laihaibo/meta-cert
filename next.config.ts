import type { NextConfig } from 'next'

export const SITE_BASE = '/meta-cert'

const nextConfig: NextConfig = {
  output: 'export',
  basePath: SITE_BASE,
  trailingSlash: true,
  images: { unoptimized: true },
  outputFileTracingRoot: __dirname,
}

export default nextConfig
