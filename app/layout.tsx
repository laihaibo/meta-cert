import type { Metadata, Viewport } from 'next'
import './globals.css'
import { getManifest } from '@/lib/content'
import GlassNav, { type NavExam } from '@/components/GlassNav'
import Footer from '@/components/Footer'
import BackToTop from '@/components/BackToTop'
import { THEME_INIT_SCRIPT } from '@/components/theme-script'
import { SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN, SITE_TAGLINE } from '@/lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: `${SITE_NAME} · ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: { icon: '/logo.svg' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} · ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    locale: 'zh_CN',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f7' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0c' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const manifest = getManifest()
  const exams: NavExam[] = manifest.exams.map((e) => ({
    name: e.name,
    icon: e.icon,
    subjects: e.subjects.map((s) => ({ name: s.name, path: s.path, volume: s.volume })),
  }))

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <div className="ambient" aria-hidden>
          <span className="ambient-3" />
        </div>
        <GlassNav exams={exams} />
        <main className="pt-[52px]">{children}</main>
        <Footer />
        <BackToTop />
      </body>
    </html>
  )
}
