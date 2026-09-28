'use client'

/**
 * 题库练习 —— 自 VitePress Quiz.vue 移植。
 * localStorage key 沿用 `quiz_progress_` + dataUrl（与旧站一致，数据无缝延续）；
 * dataUrl 仅用于存储键，题目数据由服务端构建时直接注入。
 * 增强：错题本回顾、键盘作答（A–D / 1–4 选择，↵ 提交，←→ 切题）。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { QuizQuestion } from '@/lib/content'
import { deriveSubjectId, recordAnswer } from '@/lib/progress'

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']
const LETTER_KEYS = ['a', 'b', 'c', 'd', 'e', 'f']
const NUM_KEYS = ['1', '2', '3', '4', '5', '6']

function getQuestionId(q: QuizQuestion, idx: number): string {
  return q.id || `q${idx}`
}

function stripLabel(option: string): string {
  return option.replace(/^[A-F]\s*[.、．]\s*/, '')
}

export default function Quiz({
  questions,
  dataUrl,
  initialChapter,
}: {
  questions: QuizQuestion[]
  dataUrl?: string
  initialChapter?: string | number
}) {
  const storageKey = 'quiz_progress_' + (dataUrl || 'inline')
  const containerRef = useRef<HTMLDivElement>(null)

  const [answers, setAnswers] = useState<Map<string, number | null>>(new Map())
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [filterChapter, setFilterChapter] = useState(
    initialChapter != null ? String(initialChapter) : '',
  )
  const [showBookmarkOnly, setShowBookmarkOnly] = useState(false)
  const [showWrongOnly, setShowWrongOnly] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  const chapters = useMemo(
    () => [...new Set(questions.map((q) => String(q.chapter)).filter(Boolean))],
    [questions],
  )

  const filteredQuestions = useMemo(() => {
    let qs = questions
    if (filterChapter) qs = qs.filter((q) => Number(q.chapter) === Number(filterChapter))
    if (showBookmarkOnly) qs = qs.filter((q, i) => bookmarks.has(getQuestionId(q, i)))
    if (showWrongOnly)
      qs = qs.filter((q, i) => {
        const a = answers.get(getQuestionId(q, i))
        return a != null && OPTION_LABELS[a] !== q.answer
      })
    return qs
  }, [questions, filterChapter, showBookmarkOnly, showWrongOnly, bookmarks, answers])

  const currentQuestion = filteredQuestions[currentIndex]
  const totalQuestions = filteredQuestions.length

  const answeredCount = useMemo(
    () => [...answers.values()].filter((v) => v != null).length,
    [answers],
  )
  const wrongCount = useMemo(() => {
    let n = 0
    questions.forEach((q, i) => {
      const a = answers.get(getQuestionId(q, i))
      if (a != null && OPTION_LABELS[a] !== q.answer) n++
    })
    return n
  }, [questions, answers])
  const accuracy =
    answeredCount === 0
      ? 0
      : Math.round(((answeredCount - wrongShown(answers, questions)) / answeredCount) * 100)

  // ---- 状态恢复：当前题是否有历史作答 ----
  useEffect(() => {
    const q = filteredQuestions[currentIndex]
    if (!q) {
      setSelected(null)
      setShowResult(false)
      return
    }
    const prev = answers.get(getQuestionId(q, questions.indexOf(q)))
    if (prev != null) {
      setSelected(prev)
      setShowResult(true)
    } else {
      setSelected(null)
      setShowResult(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, filteredQuestions, answers])

  // ---- 筛选变化时回到第一题 ----
  useEffect(() => {
    setCurrentIndex(0)
  }, [filterChapter, showBookmarkOnly, showWrongOnly])

  // ---- 初次挂载：读取存储 + hash 深链 ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const data = JSON.parse(raw)
        const loaded = new Map<string, number | null>(data.answers || [])
        // 旧数据迁移：视图索引键 → questionId 键
        let migrated = false
        for (const [key, value] of [...loaded]) {
          if (/^\d+$/.test(String(key))) {
            const idx = Number(key)
            if (idx < questions.length) loaded.set(getQuestionId(questions[idx], idx), value)
            loaded.delete(key)
            migrated = true
          }
        }
        setAnswers(loaded)
        setBookmarks(new Set(data.bookmarks || []))
        setScore(data.score || 0)
        if (migrated || true) {
          // 迁移后立即回写
          try {
            localStorage.setItem(
              storageKey,
              JSON.stringify({
                score: data.score || 0,
                currentIndex: 0,
                answers: [...loaded],
                bookmarks: [...(data.bookmarks || [])],
                savedAt: Date.now(),
              }),
            )
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      /* 忽略损坏数据 */
    }
    setHydrated(true)

    const hashId = getHashQuestionId()
    if (hashId) jumpToQuestionId(hashId)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- 任何状态变化自动持久化 ----
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          score,
          currentIndex,
          answers: [...answers],
          bookmarks: [...bookmarks],
          savedAt: Date.now(),
        }),
      )
    } catch {
      /* 配额超限，忽略 */
    }
  }, [hydrated, storageKey, score, currentIndex, answers, bookmarks])

  function getHashQuestionId(): string | null {
    const m = window.location.hash.match(/#([A-Za-z0-9_-]+-\d+)/)
    return m ? m[1] : null
  }

  function onHashChange() {
    const hashId = getHashQuestionId()
    if (hashId) jumpToQuestionId(hashId)
  }

  function jumpToQuestionId(id: string) {
    const idxInAll = questions.findIndex((q, i) => getQuestionId(q, i) === id)
    if (idxInAll === -1) return
    const q = questions[idxInAll]
    const chapterKey = q.chapter != null ? String(q.chapter) : ''
    let list = questions
    if (chapterKey) list = list.filter((x) => Number(x.chapter) === Number(chapterKey))
    if (showBookmarkOnly) list = list.filter((x, i) => bookmarks.has(getQuestionId(x, i)))
    if (showWrongOnly)
      list = list.filter((x, i) => {
        const a = answers.get(getQuestionId(x, i))
        return a != null && OPTION_LABELS[a] !== x.answer
      })
    const fIdx = list.findIndex((x) => getQuestionId(x, questions.indexOf(x)) === id)
    if (chapterKey) setFilterChapter(chapterKey)
    if (fIdx !== -1) setCurrentIndex(fIdx)
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ---- 全局学习进度联动 ----
  const recordGlobal = useCallback((q: QuizQuestion, answerLetter: string, isCorrect: boolean) => {
    if (typeof window === 'undefined') return
    const subjectId = deriveSubjectId(window.location.pathname)
    if (!subjectId || !q.chapter || !q.stem) return
    try {
      recordAnswer(subjectId, String(q.chapter), q.stem, answerLetter, isCorrect)
    } catch {
      /* 进度持久化尽力而为 */
    }
  }, [])

  // ---- 交互 ----
  const submitAnswer = useCallback(() => {
    const q = currentQuestion
    if (!q || selected === null || showResult) return
    const answerLetter = OPTION_LABELS[selected]
    const isCorrect = answerLetter === q.answer
    const id = getQuestionId(q, questions.indexOf(q))
    setAnswers((prev) => new Map(prev).set(id, selected))
    if (isCorrect) setScore((s) => s + 1)
    recordGlobal(q, answerLetter, isCorrect)
  }, [currentQuestion, selected, showResult, questions, recordGlobal])

  const nextQuestion = useCallback(() => {
    if (currentIndex < totalQuestions - 1) setCurrentIndex((i) => i + 1)
  }, [currentIndex, totalQuestions])

  const prevQuestion = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
  }, [currentIndex])

  const jumpToQuestion = useCallback((idx: number) => setCurrentIndex(idx), [])

  function resetQuiz() {
    setCurrentIndex(0)
    setSelected(null)
    setShowResult(false)
    setScore(0)
    setAnswers(new Map())
    try {
      localStorage.removeItem(storageKey)
    } catch {
      /* ignore */
    }
  }

  function toggleBookmark() {
    if (!currentQuestion) return
    const id = getQuestionId(currentQuestion, questions.indexOf(currentQuestion))
    setBookmarks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isCorrectOption = (index: number) =>
    showResult && currentQuestion && OPTION_LABELS[index] === currentQuestion.answer
  const isWrongOption = (index: number) =>
    showResult && selected === index && currentQuestion && OPTION_LABELS[index] !== currentQuestion.answer

  // ---- 键盘作答 ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && ['INPUT', 'SELECT', 'TEXTAREA'].includes(t.tagName)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (!currentQuestion) return

      const key = e.key.toLowerCase()
      const optIdx = LETTER_KEYS.indexOf(key) >= 0 ? LETTER_KEYS.indexOf(key) : NUM_KEYS.indexOf(key)
      if (optIdx >= 0 && optIdx < currentQuestion.options.length && !showResult) {
        e.preventDefault()
        setSelected(optIdx)
        return
      }
      if (e.key === 'Enter') {
        if (!showResult) {
          e.preventDefault()
          submitAnswer()
        } else if (currentIndex < totalQuestions - 1) {
          e.preventDefault()
          nextQuestion()
        }
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        nextQuestion()
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prevQuestion()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentQuestion, showResult, submitAnswer, nextQuestion, prevQuestion, currentIndex, totalQuestions])

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-ink-3">
        暂无题目数据
      </div>
    )
  }

  const bookmarked = currentQuestion
    ? bookmarks.has(getQuestionId(currentQuestion, questions.indexOf(currentQuestion)))
    : false

  return (
    <div ref={containerRef} className="glass rounded-2xl p-5 md:p-6">
      {/* 头部：统计 + 控制 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-2">
          <span className="font-medium tabular-nums text-ink">
            {currentIndex + 1} / {totalQuestions}
          </span>
          <span>
            得分 <span className="font-semibold tabular-nums text-accent">{score}</span>
          </span>
          {answeredCount > 0 && (
            <span>
              正确率 <span className="font-semibold tabular-nums text-accent">{accuracy}%</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {chapters.length > 1 && (
            <select
              value={filterChapter}
              onChange={(e) => setFilterChapter(e.target.value)}
              className="h-8 rounded-lg border border-line bg-elev px-2 text-[12.5px] text-ink outline-none transition-colors hover:border-line-strong"
              aria-label="按章节筛选"
            >
              <option value="">全部章节</option>
              {chapters.map((ch) => (
                <option key={ch} value={ch}>
                  第 {ch} 章
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => {
              setShowWrongOnly((v) => !v)
              setShowBookmarkOnly(false)
            }}
            className={`h-8 rounded-lg border px-2.5 text-[12.5px] font-medium transition-colors ${
              showWrongOnly
                ? 'border-wrong/40 bg-wrong-bg text-wrong'
                : 'border-line bg-elev text-ink-2 hover:text-ink'
            }`}
            title="只看答错的题"
          >
            错题本{wrongCount > 0 ? ` ${wrongCount}` : ''}
          </button>
          <button
            onClick={() => {
              setShowBookmarkOnly((v) => !v)
              setShowWrongOnly(false)
            }}
            aria-label="只看收藏"
            title="只看收藏"
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
              showBookmarkOnly
                ? 'border-star/50 bg-star/10 text-star'
                : 'border-line bg-elev text-ink-3 hover:text-ink'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={showBookmarkOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
              <path d="m12 3 2.5 5.4 5.9.7-4.4 4 1.2 5.8L12 16l-5.2 2.9 1.2-5.8-4.4-4 5.9-.7Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-5 h-1 overflow-hidden rounded-full bg-ink/[0.07] dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#2997ff] to-[#5e5ce6] transition-[width] duration-300"
          style={{ width: `${((currentIndex + 1) / Math.max(totalQuestions, 1)) * 100}%` }}
        />
      </div>

      {currentQuestion ? (
        <>
          {/* 题干卡片 */}
          <div className="mb-1.5 flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {currentQuestion.isKey && <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">重点</Badge>}
              {currentQuestion.isHot && <Badge className="border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400">高频</Badge>}
              {currentQuestion.chapter != null && (
                <Badge className="border-line bg-elev text-ink-2">第 {currentQuestion.chapter} 章</Badge>
              )}
            </div>
            <button
              onClick={toggleBookmark}
              aria-label={bookmarked ? '取消收藏' : '收藏本题'}
              className={`shrink-0 rounded-lg p-1 transition-colors ${bookmarked ? 'text-star' : 'text-ink-3 hover:text-ink'}`}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                <path d="m12 3 2.5 5.4 5.9.7-4.4 4 1.2 5.8L12 16l-5.2 2.9 1.2-5.8-4.4-4 5.9-.7Z" />
              </svg>
            </button>
          </div>

          <div className="mb-5 text-[16.5px] font-medium leading-[1.8] text-ink">{currentQuestion.stem}</div>

          {/* 选项 */}
          <div className="flex flex-col gap-2.5">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !showResult && setSelected(index)}
                disabled={showResult}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14.5px] leading-relaxed transition-all duration-150 ${
                  isCorrectOption(index)
                    ? 'border-correct/40 bg-correct-bg text-ink'
                    : isWrongOption(index)
                      ? 'border-wrong/40 bg-wrong-bg text-ink'
                      : selected === index
                        ? 'border-accent/50 bg-accent-soft text-ink'
                        : 'border-line bg-elev text-ink hover:border-accent/40'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12.5px] font-semibold ${
                    isCorrectOption(index)
                      ? 'bg-correct text-white'
                      : isWrongOption(index)
                        ? 'bg-wrong text-white'
                        : selected === index
                          ? 'bg-accent text-white'
                          : 'bg-ink/[0.07] text-ink-2 dark:bg-white/10'
                  }`}
                >
                  {OPTION_LABELS[index]}
                </span>
                <span className="min-w-0 flex-1">{stripLabel(option)}</span>
                {isCorrectOption(index) && <CheckIcon className="text-correct" />}
                {isWrongOption(index) && <CrossIcon className="text-wrong" />}
              </button>
            ))}
          </div>

          {/* 解析 */}
          {showResult && currentQuestion && (
            <div className="mt-4 rounded-xl border border-line bg-elev p-4">
              <div className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-accent">
                解析
                <span className="font-normal text-ink-3">
                  正确答案 {currentQuestion.answer}
                </span>
              </div>
              <p className="text-[14px] leading-[1.75] text-ink-2">{currentQuestion.analysis}</p>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-line px-6 py-10 text-center text-[14px] text-ink-3">
          {totalQuestions === 0 && (showBookmarkOnly || showWrongOnly || filterChapter) ? (
            <>
              当前筛选没有题目
              <button
                onClick={() => {
                  setFilterChapter('')
                  setShowBookmarkOnly(false)
                  setShowWrongOnly(false)
                }}
                className="ml-2 text-accent hover:underline"
              >
                清除筛选
              </button>
            </>
          ) : (
            '暂无题目'
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        <button
          onClick={prevQuestion}
          disabled={currentIndex === 0}
          className="h-9 rounded-lg border border-line bg-elev px-4 text-[13.5px] font-medium text-ink transition-colors hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          上一题
        </button>
        {!showResult ? (
          <button
            onClick={submitAnswer}
            disabled={selected === null}
            className="h-9 rounded-lg bg-accent px-5 text-[13.5px] font-medium text-white transition-colors hover:bg-accent/85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            提交答案
          </button>
        ) : currentIndex < totalQuestions - 1 ? (
          <button
            onClick={nextQuestion}
            className="h-9 rounded-lg bg-accent px-5 text-[13.5px] font-medium text-white transition-colors hover:bg-accent/85"
          >
            下一题
          </button>
        ) : (
          <button
            onClick={resetQuiz}
            className="h-9 rounded-lg bg-correct px-5 text-[13.5px] font-medium text-white transition-opacity hover:opacity-90"
          >
            重新开始
          </button>
        )}
        <button
          onClick={resetQuiz}
          className="h-9 px-3 text-[12.5px] text-ink-3 transition-colors hover:text-ink"
          title="清除答题记录"
        >
          清除记录
        </button>
      </div>

      {/* 题目导航 */}
      <div className="mt-5 border-t border-line pt-4">
        <div className="mb-2 text-[12px] text-ink-3">
          题目导航（已答 {answeredCount}/{totalQuestions}）
          {showWrongOnly && wrongCount > 0 ? ' · 错题回顾模式' : ''}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filteredQuestions.map((q, idx) => {
            const id = getQuestionId(q, questions.indexOf(q))
            const ans = answers.get(id)
            const answered = ans != null
            const correct = answered && OPTION_LABELS[ans] === q.answer
            return (
              <button
                key={id}
                onClick={() => jumpToQuestion(idx)}
                title={`第 ${idx + 1} 题`}
                className={`h-7 w-7 rounded-md text-[11px] font-semibold tabular-nums transition-all duration-100 ${
                  idx === currentIndex
                    ? 'scale-110 bg-accent text-white'
                    : answered
                      ? correct
                        ? 'bg-correct-bg text-correct'
                        : 'bg-wrong-bg text-wrong'
                      : 'bg-ink/[0.05] text-ink-2 hover:bg-ink/10 dark:bg-white/[0.08] dark:hover:bg-white/15'
                } ${bookmarks.has(id) ? 'ring-2 ring-star/70' : ''}`}
              >
                {idx + 1}
              </button>
            )
          })}
        </div>
        <div className="mt-3 text-center text-[11.5px] text-ink-3">
          键盘作答：A–D 选择 · ↵ 提交 / 下一题 · ← → 切题
        </div>
      </div>
    </div>
  )
}

function wrongShown(answers: Map<string, number | null>, questions: QuizQuestion[]): number {
  let n = 0
  questions.forEach((q, i) => {
    const a = answers.get(getQuestionId(q, i))
    if (a != null && OPTION_LABELS[a] !== q.answer) n++
  })
  return n
}

function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${className}`}>
      {children}
    </span>
  )
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  )
}

function CrossIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={`shrink-0 ${className}`}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}
