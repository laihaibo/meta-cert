import type { Metadata } from 'next'
import Link from 'next/link'
import { getManifest, getQuizQuestions } from '@/lib/content'
import { SITE_BASE, SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN, SITE_TAGLINE } from '@/lib/site'
import { stripBase } from '@/lib/url'

export const metadata: Metadata = {
  title: `${SITE_NAME} · ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: `${SITE_BASE}/` },
}

/** 法考卡片展示的高权重科目（其余科目收入法考 hub 页） */
const LAW_FEATURED = [
  'law-public-criminal',
  'law-private-civil',
  'law-public-constitution',
  'law-public-jurisprudence',
  'law-public-criminal-procedure',
  'law-private-civil-procedure',
]

export default function Home() {
  const manifest = getManifest()

  const exams = manifest.exams.map((exam) => ({
    ...exam,
    subjects: exam.subjects.map((s) => {
      const subject = manifest.subjects.find((x) => x.id === s.id)!
      const chapters = subject.pages.filter((p) => p.type === 'chapter' || p.type === 'index').length
      const questions = getQuizQuestions(s.id).length
      return { id: s.id, name: s.name, path: s.path, volume: s.volume, chapters, questions }
    }),
  }))

  const totalQuestions = exams.reduce(
    (n, e) => n + e.subjects.reduce((m, s) => m + s.questions, 0),
    0,
  )

  return (
    <div className="mx-auto max-w-6xl px-5 pb-10 lg:px-8">
      {/* Hero —— 全页唯一的响亮时刻 */}
      <section className="pb-16 pt-20 text-center lg:pb-20 lg:pt-28">
        <h1 className="rise-1 mx-auto max-w-3xl text-[42px] font-bold leading-[1.15] tracking-[-0.03em] lg:text-[64px]">
          <span className="bg-gradient-to-r from-[#0071e3] via-[#5e5ce6] to-[#0071e3] bg-clip-text text-transparent dark:from-[#2997ff] dark:via-[#7d7aff] dark:to-[#2997ff]">
            从考点到通关，
          </span>
          <br />
          <span className="text-ink">一条清晰的路。</span>
        </h1>
        <p className="rise-2 mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-ink-2 lg:text-[18px]">
          基金从业、证券从业、法考的章节精讲、高频考点与在线题库，
          <br className="hidden sm:block" />
          答题记录自动汇总成学习进度。
        </p>
        <div className="rise-3 mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="#subjects"
            className="h-11 rounded-full bg-accent px-7 text-[15px] font-medium leading-[44px] text-white transition-all duration-200 hover:bg-accent/85"
          >
            选择科目
          </Link>
          <Link
            href='/progress/'
            className="glass h-11 rounded-full px-7 text-[15px] font-medium leading-[42px] text-ink transition-colors hover:text-accent"
          >
            查看学习进度
          </Link>
        </div>
        <p className="rise-4 mt-7 text-[13px] tabular-nums text-ink-3">
          {manifest.stats.pages} 页精讲笔记 · {totalQuestions} 道练习题 · {manifest.stats.subjects} 个科目
        </p>
      </section>

      {/* 三大考试 */}
      <section id="subjects" className="scroll-mt-24">
        <div className="grid gap-5 md:grid-cols-3">
          {exams.map((exam) => (
            <div key={exam.slug} className="glass group flex flex-col rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-2)]">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-[22px]">
                  {exam.icon}
                </span>
                <div>
                  <h2 className="text-[19px] font-bold tracking-tight text-ink">{exam.name}</h2>
                  <p className="text-[12px] text-ink-3">{exam.tagline}</p>
                </div>
              </div>
              {exam.slug === 'law' ? (
                <>
                  <ul className="mb-4 grid flex-1 grid-cols-1 gap-0.5 sm:grid-cols-2">
                    {exam.subjects
                      .filter((s) => LAW_FEATURED.includes(s.id))
                      .map((s) => (
                        <li key={s.path}>
                          <Link
                            href={stripBase(s.path)}
                            className="flex items-center rounded-xl px-3 py-2.5 transition-colors hover:bg-accent-soft"
                          >
                            <span className="min-w-0 truncate text-[13.5px] font-medium text-ink">
                              {s.name}
                            </span>
                          </Link>
                        </li>
                      ))}
                  </ul>
                  <Link
                    href={`${SITE_BASE}/law/`}
                    className="mx-1 flex items-center justify-between rounded-xl border-t border-line pt-3.5 text-[13px] font-medium text-accent transition-colors hover:text-accent/80"
                  >
                    <span>全部 {exam.subjects.length} 个科目 · 按卷分组</span>
                    <span aria-hidden>→</span>
                  </Link>
                </>
              ) : (
                <ul className="mb-5 flex-1 space-y-1">
                  {exam.subjects.map((s) => (
                    <li key={s.path}>
                      <Link
                        href={stripBase(s.path)}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-accent-soft"
                      >
                        <span className="min-w-0 truncate text-[14px] font-medium text-ink">
                          {s.volume && (
                            <span className="mr-1.5 rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-[10.5px] font-normal text-ink-3 dark:bg-white/[0.08]">
                              {s.volume.replace(' · ', '')}
                            </span>
                          )}
                          {s.name}
                        </span>
                        <span className="ml-2 shrink-0 text-[11.5px] tabular-nums text-ink-3">
                          {s.chapters} 章 · {s.questions} 题
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 学习建议 —— 内容本身就是步骤序列，编号是信息不是装饰 */}
      <section className="mt-20">
        <h2 className="mb-6 text-[22px] font-bold tracking-tight text-ink">这样用，效率最高</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['通读章节', '按科目章节顺序精读笔记，分值占比与重点标记帮你分配时间。'],
            ['章节自测', '每章后进入题库练习，答错即时看解析，只练当前章节。'],
            ['回顾错题', '题库里的「错题本」筛出答错的题，考前针对性重做。'],
            ['盯住进度', '学习进度页汇总各科正确率，薄弱章节一目了然。'],
          ].map(([title, desc], i) => (
            <li key={title} className="rounded-2xl border border-line bg-elev p-5">
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent">
                {i + 1}
              </div>
              <h3 className="mb-1.5 text-[15px] font-semibold text-ink">{title}</h3>
              <p className="text-[13px] leading-relaxed text-ink-2">{desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: SITE_NAME,
            alternateName: SITE_TAGLINE,
            description: SITE_DESCRIPTION,
            url: SITE_ORIGIN,
            inLanguage: 'zh-CN',
          }),
        }}
      />
    </div>
  )
}
