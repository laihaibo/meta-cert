import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getManifest, getPageData, getQuizQuestions } from '@/lib/content'
import SidebarNav from '@/components/SidebarNav'
import Toc from '@/components/Toc'
import ReadingProgress from '@/components/ReadingProgress'
import MermaidHydrator from '@/components/MermaidHydrator'
import Quiz from '@/components/Quiz'
import { SITE_BASE, SITE_NAME, SITE_ORIGIN } from '@/lib/site'
import { stripBase } from '@/lib/url'

export const dynamicParams = false

export function generateStaticParams() {
  return getManifest()
    .allPages.filter((p) => p.routePath !== '')
    .map((p) => ({ slug: p.routePath.split('/') }))
}

function findSubject(routePath: string) {
  return (
    getManifest().subjects.find((s) => routePath.startsWith(s.contentPath + '/')) || null
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata> {
  const { slug } = await params
  const routePath = slug.join('/')
  const page = getPageData(routePath)
  if (!page) return {}
  const subject = findSubject(routePath)
  const title =
    page.type === 'quiz' && subject ? `题库练习 · ${subject.name}` : page.title
  return {
    title,
    description: page.excerpt || undefined,
    alternates: { canonical: page.sitePath },
    openGraph: { title: `${title} · ${SITE_NAME}`, url: page.sitePath },
  }
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const routePath = slug.join('/')
  const page = getPageData(routePath)
  if (!page) notFound()

  const subject = page.subjectId
    ? getManifest().subjects.find((s) => s.id === page.subjectId) || null
    : null
  const exam = subject ? getManifest().exams.find((e) => e.name === subject.exam) : null

  const lawGroups =
    subject && subject.examSlug === 'law'
      ? getManifest()
          .exams.find((e) => e.slug === 'law')!
          .subjects.reduce<Array<{ name: string; subjects: Array<{ name: string; path: string }> }>>(
            (acc, s) => {
              const vol = s.volume || '其他'
              let group = acc.find((g) => g.name === vol)
              if (!group) {
                group = { name: vol, subjects: [] }
                acc.push(group)
              }
              group.subjects.push({ name: s.name, path: s.path })
              return acc
            },
            [],
          )
          .map((g) => ({
            name: g.name,
            subjects: g.subjects.filter((s) => !s.path.endsWith(subject.contentPath + '/')),
          }))
      : undefined

  const isQuiz = page.type === 'quiz' && subject !== null
  const questions = isQuiz ? getQuizQuestions(subject.id) : []

  const breadcrumb = buildBreadcrumb(routePath, page.title, subject, exam?.name)

  return (
    <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-5 pb-16 lg:grid-cols-[226px_minmax(0,1fr)] lg:px-8 xl:grid-cols-[226px_minmax(0,1fr)_212px]">
      {subject ? (
        <SidebarNav
          subject={{ id: subject.id, name: subject.name, pages: subject.pages }}
          groups={lawGroups}
        />
      ) : (
        <div className="hidden lg:block" />
      )}

      <article className="mc-article min-w-0 max-w-[780px] pb-4 pt-8 lg:pt-12">
        <ReadingProgress />
        <MermaidHydrator />

        <nav aria-label="面包屑" className="mb-5 flex flex-wrap items-center gap-1.5 text-[12.5px] text-ink-3">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-ink-3/60">/</span>}
              {b.href ? (
                <Link href={stripBase(b.href)} className="transition-colors hover:text-accent">
                  {b.name}
                </Link>
              ) : (
                <span className="text-ink-2">{b.name}</span>
              )}
            </span>
          ))}
        </nav>

        {isQuiz ? (
          <>
            <header className="mb-6">
              <h1 className="text-[28px] font-bold tracking-tight text-ink">题库练习</h1>
              <p className="mt-1.5 text-[14px] text-ink-2">
                {subject!.name} · 共 {questions.length} 题
                {page.toc.length === 0 ? '' : ''}
              </p>
            </header>
            <Quiz questions={questions} dataUrl="./quiz.json" />
          </>
        ) : (
          <>
            {(page.weight || page.isKey) && (
              <div className="mb-4 flex flex-wrap gap-2">
                {page.isKey && (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[12px] font-medium text-amber-600 dark:text-amber-400">
                    重点章节
                  </span>
                )}
                {page.weight && (
                  <span className="rounded-full border border-line bg-elev px-2.5 py-0.5 text-[12px] text-ink-2">
                    分值占比 {page.weight}
                  </span>
                )}
              </div>
            )}
            <div className="mc-prose" dangerouslySetInnerHTML={{ __html: page.html }} />
          </>
        )}

        {(page.prev || page.next) && (
          <nav className="mt-14 grid gap-3 sm:grid-cols-2" aria-label="上下篇">
            {page.prev ? (
              <Link
                href={stripBase(page.prev.href)}
                className="glass group rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="text-[12px] text-ink-3">上一篇</div>
                <div className="mt-1 line-clamp-2 text-[14.5px] font-medium text-ink group-hover:text-accent">
                  {page.prev.title}
                </div>
              </Link>
            ) : (
              <span />
            )}
            {page.next && (
              <Link
                href={stripBase(page.next.href)}
                className="glass group rounded-2xl p-4 text-right transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="text-[12px] text-ink-3">下一篇</div>
                <div className="mt-1 line-clamp-2 text-[14.5px] font-medium text-ink group-hover:text-accent">
                  {page.next.title}
                </div>
              </Link>
            )}
          </nav>
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumb)) }}
        />
      </article>

      {!isQuiz && <Toc items={page.toc} />}
      {isQuiz && <div className="hidden xl:block" />}
    </div>
  )
}

function buildBreadcrumb(
  routePath: string,
  pageTitle: string,
  subject: ReturnType<typeof findSubject>,
  examName?: string,
): Array<{ name: string; href?: string }> {
  const crumbs: Array<{ name: string; href?: string }> = [
    { name: '首页', href: `${SITE_BASE}/` },
  ]
  if (subject) {
    crumbs.push({ name: subject.exam, href: `${SITE_BASE}/` })
    if (subject.volume) crumbs.push({ name: subject.volume })
    crumbs.push({ name: subject.name, href: subject.path })
    if (routePath !== subject.contentPath) {
      crumbs.push({ name: pageTitle })
    }
  } else {
    crumbs.push({ name: pageTitle })
  }
  return crumbs
}

function breadcrumbJsonLd(breadcrumb: Array<{ name: string; href?: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumb.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      ...(b.href ? { item: `${SITE_ORIGIN}${b.href}` } : {}),
    })),
  }
}
