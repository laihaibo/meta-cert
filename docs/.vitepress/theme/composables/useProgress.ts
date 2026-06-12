import { ref, computed, watch } from 'vue'

// ============================================
// localStorage Schema
// ============================================

interface QuestionAttempt {
  answer: string
  isCorrect: boolean
  timestamp: string
}

interface QuestionProgress {
  attempts: QuestionAttempt[]
  lastAttempt: string
  bestScore: boolean
}

interface ChapterProgress {
  questions: Record<string, QuestionProgress>
  completedCount: number
  totalCount: number
  correctRate: number
}

interface SubjectProgress {
  chapters: Record<string, ChapterProgress>
  overallCorrectRate: number
}

export interface ProgressData {
  version: number
  lastUpdated: string
  subjects: Record<string, SubjectProgress>
}

// ============================================
// Constants
// ============================================

const STORAGE_KEY = 'meta-cert:progress'
const CURRENT_VERSION = 1

// ============================================
// Storage abstraction (memory fallback)
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
  if (isLocalStorageAvailable()) {
    return localStorage.getItem(STORAGE_KEY)
  }
  return memoryStore
}

function writeRaw(value: string): void {
  if (isLocalStorageAvailable()) {
    localStorage.setItem(STORAGE_KEY, value)
  } else {
    memoryStore = value
  }
}

// ============================================
// Migration
// ============================================

export function migrateProgress(data: any): ProgressData {
  if (!data || typeof data !== 'object') {
    return createEmptyProgress()
  }

  // Version 0 -> 1: add version field, normalize structure
  if (!data.version || data.version < 1) {
    const migrated: ProgressData = {
      version: 1,
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      subjects: {},
    }

    // Attempt to preserve existing subject data
    if (data.subjects && typeof data.subjects === 'object') {
      for (const [subjectId, subject] of Object.entries(data.subjects as Record<string, any>)) {
        migrated.subjects[subjectId] = {
          chapters: {},
          overallCorrectRate: 0,
        }
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

  return data as ProgressData
}

// ============================================
// Helpers
// ============================================

function createEmptyProgress(): ProgressData {
  return {
    version: CURRENT_VERSION,
    lastUpdated: new Date().toISOString(),
    subjects: {},
  }
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
      // best score: any attempt was correct
      if (q.bestScore) {
        correct++
      }
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
    const ch = subject.chapters[chId]
    const qIds = Object.keys(ch.questions)
    for (const qId of qIds) {
      const q = ch.questions[qId]
      if (q.attempts.length > 0) {
        totalAttempted++
        if (q.bestScore) totalCorrect++
      }
    }
  }

  subject.overallCorrectRate = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0
}

function generateQuestionId(stem: string): string {
  // Simple hash from question stem for stable ID
  let hash = 0
  for (let i = 0; i < stem.length; i++) {
    const char = stem.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return 'q_' + Math.abs(hash).toString(36)
}

// ============================================
// Composable
// ============================================

// Shared reactive state (singleton across components)
const progressData = ref<ProgressData>(createEmptyProgress())

// Initialize from storage
function initProgress(): void {
  const raw = readRaw()
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      progressData.value = migrateProgress(parsed)
    } catch {
      progressData.value = createEmptyProgress()
    }
  } else {
    progressData.value = createEmptyProgress()
  }
}

// Persist to storage
function persist(): void {
  progressData.value.lastUpdated = new Date().toISOString()
  writeRaw(JSON.stringify(progressData.value))
}

// Initialize on first import
initProgress()

export function useProgress() {
  /**
   * Record an answer attempt for a question.
   */
  function recordAnswer(
    subjectId: string,
    chapterId: string,
    questionStem: string,
    answer: string,
    isCorrect: boolean,
  ): void {
    const questionId = generateQuestionId(questionStem)
    const now = new Date().toISOString()

    // Ensure subject exists
    if (!progressData.value.subjects[subjectId]) {
      progressData.value.subjects[subjectId] = {
        chapters: {},
        overallCorrectRate: 0,
      }
    }
    const subject = progressData.value.subjects[subjectId]

    // Ensure chapter exists
    if (!subject.chapters[chapterId]) {
      subject.chapters[chapterId] = {
        questions: {},
        completedCount: 0,
        totalCount: 0,
        correctRate: 0,
      }
    }
    const chapter = subject.chapters[chapterId]

    // Ensure question exists
    if (!chapter.questions[questionId]) {
      chapter.questions[questionId] = {
        attempts: [],
        lastAttempt: now,
        bestScore: false,
      }
    }
    const question = chapter.questions[questionId]

    // Record attempt
    question.attempts.push({ answer, isCorrect, timestamp: now })
    question.lastAttempt = now
    if (isCorrect) {
      question.bestScore = true
    }

    // Recalculate rates
    recalculateChapterRates(chapter)
    recalculateSubjectRates(subject)

    // Persist
    persist()
  }

  /**
   * Get overall statistics across all subjects.
   */
  function getOverallStats() {
    const subjects = progressData.value.subjects
    const subjectIds = Object.keys(subjects)

    let totalQuestions = 0
    let totalAttempted = 0
    let totalCorrect = 0
    let totalChapters = 0
    let completedChapters = 0

    for (const subjectId of subjectIds) {
      const subject = subjects[subjectId]
      const chapterIds = Object.keys(subject.chapters)
      totalChapters += chapterIds.length

      for (const chapterId of chapterIds) {
        const chapter = subject.chapters[chapterId]
        const questionIds = Object.keys(chapter.questions)
        totalQuestions += questionIds.length

        let chapterAttempted = 0
        for (const qId of questionIds) {
          const q = chapter.questions[qId]
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

  /**
   * Get statistics for a specific subject.
   */
  function getSubjectStats(subjectId: string) {
    const subject = progressData.value.subjects[subjectId]
    if (!subject) {
      return {
        chapterCount: 0,
        totalQuestions: 0,
        attempted: 0,
        correct: 0,
        correctRate: 0,
        chapters: {},
      }
    }

    let totalQuestions = 0
    let attempted = 0
    let correct = 0
    const chapterStats: Record<string, {
      totalQuestions: number
      attempted: number
      correct: number
      correctRate: number
    }> = {}

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

      chapterStats[chapterId] = {
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
      chapters: chapterStats,
    }
  }

  /**
   * Get statistics for a specific chapter.
   */
  function getChapterStats(subjectId: string, chapterId: string) {
    const subject = progressData.value.subjects[subjectId]
    if (!subject) return null

    const chapter = subject.chapters[chapterId]
    if (!chapter) return null

    return {
      totalQuestions: chapter.totalCount,
      completedCount: chapter.completedCount,
      correctRate: chapter.correctRate,
      questions: chapter.questions,
    }
  }

  /**
   * Get all weak chapters (correctRate < 60%) across all subjects.
   */
  function getWeakChapters(): Array<{
    subjectId: string
    chapterId: string
    correctRate: number
    attempted: number
    total: number
  }> {
    const weak: Array<{
      subjectId: string
      chapterId: string
      correctRate: number
      attempted: number
      total: number
    }> = []

    for (const [subjectId, subject] of Object.entries(progressData.value.subjects)) {
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

  /**
   * Check if a specific question has been attempted.
   */
  function isQuestionAttempted(subjectId: string, chapterId: string, questionStem: string): boolean {
    const questionId = generateQuestionId(questionStem)
    const subject = progressData.value.subjects[subjectId]
    if (!subject) return false
    const chapter = subject.chapters[chapterId]
    if (!chapter) return false
    const question = chapter.questions[questionId]
    return question ? question.attempts.length > 0 : false
  }

  /**
   * Get the best score for a specific question.
   */
  function getQuestionBestScore(subjectId: string, chapterId: string, questionStem: string): boolean | null {
    const questionId = generateQuestionId(questionStem)
    const subject = progressData.value.subjects[subjectId]
    if (!subject) return null
    const chapter = subject.chapters[chapterId]
    if (!chapter) return null
    const question = chapter.questions[questionId]
    return question ? question.bestScore : null
  }

  /**
   * Reset all progress data.
   */
  function resetProgress(): void {
    progressData.value = createEmptyProgress()
    persist()
  }

  /**
   * Reset progress for a specific subject.
   */
  function resetSubject(subjectId: string): void {
    delete progressData.value.subjects[subjectId]
    persist()
  }

  /**
   * Reset progress for a specific chapter.
   */
  function resetChapter(subjectId: string, chapterId: string): void {
    const subject = progressData.value.subjects[subjectId]
    if (subject) {
      delete subject.chapters[chapterId]
      recalculateSubjectRates(subject)
      persist()
    }
  }

  return {
    progressData,
    recordAnswer,
    getOverallStats,
    getSubjectStats,
    getChapterStats,
    getWeakChapters,
    isQuestionAttempted,
    getQuestionBestScore,
    resetProgress,
    resetSubject,
    resetChapter,
  }
}
