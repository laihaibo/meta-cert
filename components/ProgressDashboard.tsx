'use client'

/**
 * 学习进度仪表盘 —— 自 VitePress ProgressDashboard.vue 移植 + 可视化增强。
 * 数据源：meta-cert:progress（schema v1，与旧站一致）。
 */
import Link from 'next/link'
import { stripBase } from '@/lib/url'
import { useMemo, useState } from 'react'
import {
  getOverallStats,
  getSubjectStats,
  getWeakChapters,
  resetProgress,
  resetSubject,
  useProgressData,
} from '@/lib/progress'

export interface SubjectMeta {
  id: string
  name: string
  exam: string
  quizPath: string
}

export default function ProgressDashboard({ subjects }: { subjects: SubjectMeta[] }) {
  const data = useProgressData()
  const [confirming, setConfirming] = useState<'all' | string | null>(null)

  const overall = useMemo(() => getOverallStats(data), [data])
  const knownSubjects = useMemo(
    () => subjects.filter((s) => data.subjects[s.id]),
    [subjects, data],
  )
  const weak = useMemo(() => {
    const nameOf = new Map(subjects.map((s) => [s.id, s]))
    return getWeakChapters(data)
      .filter((w) => nameOf.has(w.subjectId))
      .slice(0, 8)
      .map((w) => ({ ...w, subject: nameOf.get(w.subjectId)! }))
  }, [data, subjects])

  const hasData = Object.keys(data.subjects).length > 0

  return (
    <div className="space-y-8">
      {/* 学习总览 */}
      <section>
        <h2 className="mb-4 text-[19px] font-bold tracking-tight text-ink">学习总览</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="已练科目" value={String(overall.subjectCount)} unit={`/${subjects.length}`} />
          <StatCard
            label="完成章节"
            value={String(overall.completedChapters)}
            unit={`/${overall.totalChapters}`}
            progress={overall.chapterProgress}
          />
          <StatCard label="已做题数" value={String(overall.totalAttempted)} unit={`/${overall.totalQuestions}`} />
          <StatCard label="总正确率" value={`${overall.overallCorrectRate}`} unit="%" ring={overall.overallCorrectRate} />
        </div>
      </section>

      {/* 各科统计 */}
      <section>
        <h2 className="mb-4 text-[19px] font-bold tracking-tight text-ink">各科统计</h2>
        {!hasData ? (
          <div className="glass rounded-2xl px-6 py-12 text-center">
            <p className="text-[15px] font-medium text-ink">还没有作答记录</p>
            <p className="mt-1.5 text-[13.5px] text-ink-2">
              进入任意科目的「题库练习」答题后，这里会自动记录进度与正确率。
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {knownSubjects.map((s) => {
              const stats = getSubjectStats(data, s.id)
              return (
                <div key={s.id} className="glass rounded-2xl p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11.5px] font-medium text-ink-3">{s.exam}</div>
                      <Link
                        href={stripBase(s.quizPath)}
                        className="text-[15px] font-semibold text-ink transition-colors hover:text-accent"
                      >
                        {s.name}
                      </Link>
                    </div>
                    <Ring value={stats.correctRate} size={44} />
                  </div>
                  <div className="mb-3 flex gap-4 text-[12.5px] text-ink-2">
                    <span>
                      已练 <b className="text-ink">{stats.attempted}</b>/{stats.totalQuestions} 题
                    </span>
                    <span>
                      正确率 <b className="text-ink">{stats.correctRate}%</b>
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(stats.chapters).map(([chId, ch]) => (
                      <div key={chId} className="flex items-center gap-2 text-[12px]">
                        <span className="w-12 shrink-0 text-ink-3">第{chId}章</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/[0.06] dark:bg-white/10">
                          <div
                            className="h-full rounded-full transition-[width] duration-500"
                            style={{
                              width: `${ch.correctRate}%`,
                              background:
                                ch.correctRate >= 80
                                  ? 'var(--correct)'
                                  : ch.correctRate >= 60
                                    ? '#ff9f0a'
                                    : 'var(--wrong)',
                            }}
                          />
                        </div>
                        <span className="w-20 shrink-0 text-right tabular-nums text-ink-3">
                          {ch.attempted > 0 ? `${ch.correctRate}% · ${ch.attempted}题` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-end border-t border-line pt-3">
                    {confirming === s.id ? (
                      <div className="flex items-center gap-2 text-[12.5px]">
                        <span className="text-ink-2">确认清空该科进度？</span>
                        <button
                          onClick={() => {
                            resetSubject(s.id)
                            setConfirming(null)
                          }}
                          className="font-medium text-wrong hover:underline"
                        >
                          清空
                        </button>
                        <button onClick={() => setConfirming(null)} className="text-ink-3 hover:text-ink">
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirming(s.id)}
                        className="text-[12.5px] text-ink-3 transition-colors hover:text-wrong"
                      >
                        清空该科
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 薄弱知识点 */}
      {weak.length > 0 && (
        <section>
          <h2 className="mb-4 text-[19px] font-bold tracking-tight text-ink">薄弱章节</h2>
          <div className="glass rounded-2xl border-wrong/20 p-5">
            <p className="mb-3 text-[13.5px] text-ink-2">正确率低于 60% 的章节，建议回到题库针对性重练：</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {weak.map((w) => (
                <Link
                  key={`${w.subjectId}-${w.chapterId}`}
                  href={stripBase(w.subject.quizPath)}
                  className="flex items-center justify-between rounded-xl border border-line bg-elev px-3.5 py-2.5 text-[13px] transition-colors hover:border-accent/40"
                >
                  <span className="truncate text-ink">
                    {w.subject.name} · 第{w.chapterId}章
                  </span>
                  <span className="ml-2 shrink-0 font-semibold tabular-nums text-wrong">{w.correctRate}%</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 重置全部 */}
      {hasData && (
        <section className="flex justify-center">
          {confirming === 'all' ? (
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-ink-2">确认清空全部学习进度？此操作不可恢复。</span>
              <button
                onClick={() => {
                  resetProgress()
                  setConfirming(null)
                }}
                className="font-medium text-wrong hover:underline"
              >
                全部清空
              </button>
              <button onClick={() => setConfirming(null)} className="text-ink-3 hover:text-ink">
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming('all')}
              className="text-[13px] text-ink-3 transition-colors hover:text-wrong"
            >
              清空全部学习进度
            </button>
          )}
        </section>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  unit,
  progress,
  ring,
}: {
  label: string
  value: string
  unit?: string
  progress?: number
  ring?: number
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[12.5px] text-ink-3">{label}</div>
      <div className="mt-1.5 flex items-end justify-between">
        <div className="text-[26px] font-bold leading-none tracking-tight text-ink">
          {value}
          {unit && <span className="ml-0.5 text-[13px] font-medium text-ink-3">{unit}</span>}
        </div>
        {ring != null && <Ring value={ring} size={40} />}
      </div>
      {progress != null && (
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-ink/[0.07] dark:bg-white/10">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

function Ring({ value, size }: { value: number; size: number }) {
  const stroke = 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color =
    value >= 80 ? 'var(--correct)' : value >= 60 ? '#ff9f0a' : value > 0 ? 'var(--wrong)' : 'var(--text-3)'
  return (
    <svg width={size} height={size} className="shrink-0" aria-hidden>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </g>
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-ink text-[10px] font-semibold"
      >
        {value}%
      </text>
    </svg>
  )
}
