import type { Metadata } from 'next'
import { getManifest } from '@/lib/content'
import ProgressDashboard from '@/components/ProgressDashboard'
import { SITE_BASE } from '@/lib/site'

export const metadata: Metadata = {
  title: '学习进度',
  description: '各科目答题量、正确率与薄弱章节汇总，数据保存在本机浏览器中。',
  alternates: { canonical: `${SITE_BASE}/progress/` },
}

export default function ProgressPage() {
  const subjects = getManifest().subjects.map((s) => ({
    id: s.id,
    name: s.name,
    exam: s.exam,
    quizPath: s.pages.find((p) => p.type === 'quiz')?.sitePath || s.path,
  }))

  return (
    <div className="mx-auto max-w-4xl px-5 pb-10 pt-10 lg:px-8 lg:pt-14">
      <header className="mb-8">
        <h1 className="text-[30px] font-bold tracking-tight text-ink">学习进度</h1>
        <p className="mt-2 text-[14.5px] text-ink-2">
          全部记录保存在你的浏览器本地，不会上传服务器。
        </p>
      </header>
      <ProgressDashboard subjects={subjects} />
    </div>
  )
}
