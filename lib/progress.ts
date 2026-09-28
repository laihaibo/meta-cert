/**
 * 学习进度 store —— 从 VitePress 版 useProgress.ts 移植。
 * localStorage key 与 schema（version 1）保持不变，老用户数据无缝延续。
 */
import { useEffect, useSyncExternalStore } from 'react'

export interface QuestionAttempt {
  answer: string
  isCorrect: boolean
  timestamp: string
}

export interface QuestionProgress {
  attempts: QuestionAttempt[]
  lastAttempt: string
  bestScore: boolean
}

export interface ChapterProgress {
  questions: Record<string, QuestionProgress>
  completedCount: number
  totalCount: number
  correctRate: number
}

export interface SubjectProgress {
  chapters: Record<string, ChapterProgress>
  overallCorrectRate: number
}

export interface ProgressData {
  version: number
  lastUpdated: string
  subjects: Record<string, SubjectProgress>
}

const STORAGE_KEY = 'meta-cert:progress'
const CURRENT_VERSION = 1

// ============================================
// 存储（含内存回退）
// ============================================

let memoryStore: string | null = null

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__meta_cert_test__'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

function readRaw(): string | null {
  if (typeof window === 'undefined') return memoryStore
  try {
    if (isLocalStorageAvailable()) return localStorage.getItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  return memoryStore
}

function writeRaw(value: string): void {
  if (typeof window === 'undefined') {
    memoryStore = value
    return
  }
  try {
    if (isLocalStorageAvailable()) {
      localStorage.setItem(STORAGE_KEY, value)
      return
    }
  } catch {
    /* ignore */
  }
  memoryStore = value
}

// ============================================
// 迁移（v0 → v1，逻辑与 Vue 版一致）
// ============================================

/**
 * 迁移旧站遗留的带前缀 subjectId（'meta-cert-law-public-criminal' → 'law-public-criminal'）。
 * 旧版从含 basePath 的 pathname 派生 subjectId，而进度页的名称映射从未匹配上，
 * 这里在读取时统一归一化，老数据无缝并入。
 */
function normalizeSubjectIds(data: ProgressData): ProgressData {
  const LEGACY = 'meta-cert-'
  const subjects = data.subjects
  for (const key of Object.keys(subjects)) {
    if (key.startsWith(LEGACY)) {
      const clean = key.slice(LEGACY.length)
      if (!subjects[clean]) {
        subjects[clean] = subjects[key]
      }
      delete subjects[key]
    }
  }
  return data
}

export function migrateProgress(data: unknown): ProgressData {
  if (!data || typeof data !== 'object') {
    return createEmptyProgress()
  }
  const d = data as Record<string, any>
  if (!d.version || d.version < 1) {
    const migrated: ProgressData = {
      version: 1,
      lastUpdated: d.lastUpdated || new Date().toISOString(),
      subjects: {},
    }
    if (d.subjects && typeof d.subjects === 'object') {
      for (const [subjectId, subject] of Object.entries(d.subjects as Record<string, any>)) {
        migrated.subjects[subjectId] = { chapters: {}, overallCorrectRate: 0 }
        if (subject?.chapters && typeof subject.chapters === 'object') {
          for (const [chapterId, chapter] of Object.entries(subject.chapters as Record<string, any>)) {
            migrated.subjects[subjectId].chapters[chapterId] = {
              questions: chapter?.questions || {},
              completedCount: chapter?.completedCount || 0,
              totalCount: chapter?.totalCount || 0,
              correctRate: chapter?.correctRate || 0,
            }
          }
        }
        recalculateSubjectRates(migrated.subjects[subjectId])
      }
    }
    return migrated
  }
  return d as unknown as ProgressData
}

// ============================================
// 内部工具（与 Vue 版逐行对应，保证 questionId 哈希一致）
// ============================================

function createEmptyProgress(): ProgressData {
  return { version: CURRENT_VERSION, lastUpdated: new Date().toISOString(), subjects: {} }
}

function recalculateChapterRates(chapter: ChapterProgress): void {
  const questionIds = Object.keys(chapter.questions)
  chapter.totalCount = questionIds.length
  let completed = 0
  let correct = 0
  for (const qId of questionIds) {
    const q = chapter.questions[qId]
    if (q.attempts.length > 0) {
      completed++
      if (q.bestScore) correct++
    }
  }
  chapter.completedCount = completed
  chapter.correctRate = completed > 0 ? Math.round((correct / completed) * 100) : 0
}

function recalculateSubjectRates(subject: SubjectProgress): void {
  const chapterIds = Object.keys(subject.chapters)
  if (chapterIds.length === 0) {
    subject.overallCorrectRate = 0
    return
  }
  let totalCorrect = 0
  let totalAttempted = 0
  for (const chId of chapterIds) {
    for (const qId of Object.keys(subject.chapters[chId].questions)) {
      const q = subject.chapters[chId].questions[qId]
      if (q.attempts.length > 0) {
        totalAttempted++
        if (q.bestScore) totalCorrect++
      }
    }
  }
  subject.overallCorrectRate =
    totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0
}

export function generateQuestionId(stem: string): string {
  let hash = 0
  for (let i = 0; i < stem.length; i++) {
    const char = stem.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
    hash |= 0
  }
  return 'q_' + Math.abs(hash).toString(36)
}

/** 从 URL pathname 派生 subjectId（剥掉 basePath，如 /meta-cert/law/.../quiz/ → law-public-criminal） */
export function deriveSubjectId(pathname: string): string | null {
  let path = pathname.replace(/\.html$/, '')
  if (path.startsWith('/meta-cert/')) path = path.slice('/meta-cert'.length)
  else if (path === '/meta-cert') path = '/'
  const segments = path.split('/').filter(Boolean)
  segments.pop()
  return segments.length > 0 ? segments.join('-') : null
}

// ============================================
// 模块级 store + React 绑定
// ============================================

let state: ProgressData = createEmptyProgress()
let initialized = false
const listeners = new Set<() => void>()

function emit() {
  for (const fn of listeners) fn()
}

function ensureInit() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  const raw = readRaw()
  if (raw) {
    try {
      state = normalizeSubjectIds(migrateProgress(JSON.parse(raw)))
    } catch {
      state = createEmptyProgress()
    }
  }
  emit()
}

function persist() {
  state = { ...state, lastUpdated: new Date().toISOString() }
  writeRaw(JSON.stringify(state))
  emit()
}

function subscribe(fn: () => void): () => void {
  ensureInit()
  listeners.add(fn)
  // 客户端水合后再读取一次存储（SSR 快照为空结构）
  Promise.resolve().then(() => {
    ensureInit()
  })
  return () => listeners.delete(fn)
}

function getSnapshot(): ProgressData {
  return state
}

function getServerSnapshot(): ProgressData {
  return EMPTY
}

const EMPTY = createEmptyProgress()

/** 订阅进度数据的 React hook */
export function useProgressData(): ProgressData {
  useEffect(() => {
    ensureInit()
  }, [])
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

// ============================================
// 公开 API
// ============================================

export function recordAnswer(
  subjectId: string,
  chapterId: string,
  questionStem: string,
  answer: string,
  isCorrect: boolean,
): void {
  ensureInit()
  const questionId = generateQuestionId(questionStem)
  const now = new Date().toISOString()

  const next: ProgressData = {
    ...state,
    subjects: { ...state.subjects },
  }
  if (!next.subjects[subjectId]) {
    next.subjects[subjectId] = { chapters: {}, overallCorrectRate: 0 }
  }
  const subject = { ...next.subjects[subjectId], chapters: { ...next.subjects[subjectId].chapters } }
  next.subjects[subjectId] = subject

  if (!subject.chapters[chapterId]) {
    subject.chapters[chapterId] = { questions: {}, completedCount: 0, totalCount: 0, correctRate: 0 }
  }
  const chapter = { ...subject.chapters[chapterId], questions: { ...subject.chapters[chapterId].questions } }
  subject.chapters[chapterId] = chapter

  const prevQ = chapter.questions[questionId]
  const question: QuestionProgress = prevQ
    ? { attempts: [...prevQ.attempts], lastAttempt: now, bestScore: prevQ.bestScore }
    : { attempts: [], lastAttempt: now, bestScore: false }
  question.attempts.push({ answer, isCorrect, timestamp: now })
  question.lastAttempt = now
  if (isCorrect) question.bestScore = true
  chapter.questions[questionId] = question

  recalculateChapterRates(chapter)
  recalculateSubjectRates(subject)

  state = next
  persist()
}

export interface OverallStats {
  subjectCount: number
  totalChapters: number
  completedChapters: number
  totalQuestions: number
  totalAttempted: number
  totalCorrect: number
  overallCorrectRate: number
  chapterProgress: number
}

export function getOverallStats(data: ProgressData): OverallStats {
  const subjectIds = Object.keys(data.subjects)
  let totalQuestions = 0
  let totalAttempted = 0
  let totalCorrect = 0
  let totalChapters = 0
  let completedChapters = 0

  for (const subjectId of subjectIds) {
    const subject = data.subjects[subjectId]
    const chapterIds = Object.keys(subject.chapters)
    totalChapters += chapterIds.length
    for (const chapterId of chapterIds) {
      const questionIds = Object.keys(subject.chapters[chapterId].questions)
      totalQuestions += questionIds.length
      let chapterAttempted = 0
      for (const qId of questionIds) {
        const q = subject.chapters[chapterId].questions[qId]
        if (q.attempts.length > 0) {
          totalAttempted++
          chapterAttempted++
          if (q.bestScore) totalCorrect++
        }
      }
      if (chapterAttempted === questionIds.length && questionIds.length > 0) {
        completedChapters++
      }
    }
  }

  return {
    subjectCount: subjectIds.length,
    totalChapters,
    completedChapters,
    totalQuestions,
    totalAttempted,
    totalCorrect,
    overallCorrectRate: totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0,
    chapterProgress: totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0,
  }
}

export interface SubjectStats {
  chapterCount: number
  totalQuestions: number
  attempted: number
  correct: number
  correctRate: number
  chapters: Record<
    string,
    { totalQuestions: number; attempted: number; correct: number; correctRate: number }
  >
}

export function getSubjectStats(data: ProgressData, subjectId: string): SubjectStats {
  const subject = data.subjects[subjectId]
  if (!subject) {
    return { chapterCount: 0, totalQuestions: 0, attempted: 0, correct: 0, correctRate: 0, chapters: {} }
  }
  let totalQuestions = 0
  let attempted = 0
  let correct = 0
  const chapters: SubjectStats['chapters'] = {}
  for (const [chapterId, chapter] of Object.entries(subject.chapters)) {
    const questionIds = Object.keys(chapter.questions)
    totalQuestions += questionIds.length
    let chAttempted = 0
    let chCorrect = 0
    for (const qId of questionIds) {
      const q = chapter.questions[qId]
      if (q.attempts.length > 0) {
        attempted++
        chAttempted++
        if (q.bestScore) {
          correct++
          chCorrect++
        }
      }
    }
    chapters[chapterId] = {
      totalQuestions: questionIds.length,
      attempted: chAttempted,
      correct: chCorrect,
      correctRate: chAttempted > 0 ? Math.round((chCorrect / chAttempted) * 100) : 0,
    }
  }
  return {
    chapterCount: Object.keys(subject.chapters).length,
    totalQuestions,
    attempted,
    correct,
    correctRate: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
    chapters,
  }
}

export interface WeakChapter {
  subjectId: string
  chapterId: string
  correctRate: number
  attempted: number
  total: number
}

export function getWeakChapters(data: ProgressData): WeakChapter[] {
  const weak: WeakChapter[] = []
  for (const [subjectId, subject] of Object.entries(data.subjects)) {
    for (const [chapterId, chapter] of Object.entries(subject.chapters)) {
      if (chapter.completedCount > 0 && chapter.correctRate < 60) {
        weak.push({
          subjectId,
          chapterId,
          correctRate: chapter.correctRate,
          attempted: chapter.completedCount,
          total: chapter.totalCount,
        })
      }
    }
  }
  return weak.sort((a, b) => a.correctRate - b.correctRate)
}

/** 查询某题的最近作答记录（用于错题本等） */
export function getQuestionProgress(
  data: ProgressData,
  subjectId: string,
  chapterId: string,
  questionStem: string,
): QuestionProgress | null {
  const subject = data.subjects[subjectId]
  if (!subject) return null
  const chapter = subject.chapters[chapterId]
  if (!chapter) return null
  return chapter.questions[generateQuestionId(questionStem)] || null
}

export function resetProgress(): void {
  ensureInit()
  state = createEmptyProgress()
  persist()
}

export function resetSubject(subjectId: string): void {
  ensureInit()
  const subjects = { ...state.subjects }
  delete subjects[subjectId]
  state = { ...state, subjects }
  persist()
}
