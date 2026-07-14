<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface QuizQuestion {
  id?: string
  stem: string
  options: string[]
  answer: string
  analysis: string
  chapter?: string | number
  isKey?: boolean
  isHot?: boolean
}

const props = defineProps<{
  questions?: QuizQuestion[]
  dataUrl?: string
}>()

const allQuestions = ref<QuizQuestion[]>([])
const currentIndex = ref(0)
const selected = ref<number | null>(null)
const showResult = ref(false)
const score = ref(0)
const answers = ref<Map<number, number | null>>(new Map())  // user's answers
const filterChapter = ref<string>('')
const chapters = ref<string[]>([])
const bookmarks = ref<Set<string>>(new Set())  // bookmarked question IDs
const showBookmarkOnly = ref(false)
const storageKey = 'quiz_progress_' + (props.dataUrl || 'inline')

// ---- localStorage helpers ----
function loadProgress() {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const data = JSON.parse(raw)
      score.value = data.score || 0
      currentIndex.value = data.currentIndex || 0
      if (data.answers) answers.value = new Map(data.answers)
      if (data.bookmarks) bookmarks.value = new Set(data.bookmarks)
    }
  } catch { /* ignore corrupt data */ }
}

function saveProgress() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({
      score: score.value,
      currentIndex: currentIndex.value,
      answers: Array.from(answers.value.entries()),
      bookmarks: Array.from(bookmarks.value),
      savedAt: Date.now()
    }))
  } catch { /* quota exceeded, ignore */ }
}

function clearProgress() {
  try { localStorage.removeItem(storageKey) } catch { /* ignore */ }
}

// ---- Load questions ----
onMounted(async () => {
  if (props.questions && props.questions.length > 0) {
    allQuestions.value = props.questions
  } else if (props.dataUrl) {
    try {
      const resp = await fetch(props.dataUrl)
      allQuestions.value = await resp.json()
    } catch (e) {
      console.error('Failed to load quiz data:', e)
    }
  }
  // Extract unique chapters
  const chapterSet = new Set(allQuestions.value.map(q => String(q.chapter)).filter(Boolean))
  chapters.value = Array.from(chapterSet)
  // Restore progress from localStorage
  loadProgress()
})

// ---- Filtering ----
const filteredQuestions = computed(() => {
  let qs = allQuestions.value
  if (filterChapter.value) {
    qs = qs.filter(q => String(q.chapter) === filterChapter.value)
  }
  if (showBookmarkOnly.value) {
    qs = qs.filter(q => bookmarks.value.has(getQuestionId(q)))
  }
  return qs
})

const currentQuestion = computed(() => filteredQuestions.value[currentIndex.value])
const totalQuestions = computed(() => filteredQuestions.value.length)

function getQuestionId(q: QuizQuestion, idx?: number): string {
  return q.id || `q${idx ?? currentIndex.value}`
}

const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F']

// ---- Interaction ----
function selectOption(index: number) {
  if (showResult.value) return
  selected.value = index
}

function submitAnswer() {
  if (selected.value === null) return
  showResult.value = true
  answers.value.set(currentIndex.value, selected.value)
  if (optionLabels[selected.value] === currentQuestion.value.answer) {
    score.value++
  }
  saveProgress()
}

function nextQuestion() {
  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++
    restoreStateForCurrent()
    saveProgress()
  }
}

function prevQuestion() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    restoreStateForCurrent()
    saveProgress()
  }
}

function jumpToQuestion(idx: number) {
  currentIndex.value = idx
  restoreStateForCurrent()
  saveProgress()
}

function restoreStateForCurrent() {
  const prev = answers.value.get(currentIndex.value)
  if (prev !== undefined && prev !== null) {
    selected.value = prev
    showResult.value = true
  } else {
    selected.value = null
    showResult.value = false
  }
}

function resetQuiz() {
  currentIndex.value = 0
  selected.value = null
  showResult.value = false
  score.value = 0
  answers.value.clear()
  clearProgress()
}

function isCorrect(index: number): boolean {
  return showResult.value && optionLabels[index] === currentQuestion.value?.answer
}

function isWrong(index: number): boolean {
  return showResult.value && selected.value === index && optionLabels[index] !== currentQuestion.value?.answer
}

function toggleBookmark() {
  const id = getQuestionId(currentQuestion.value, currentIndex.value)
  if (bookmarks.value.has(id)) {
    bookmarks.value.delete(id)
  } else {
    bookmarks.value.add(id)
  }
  saveProgress()
}

function isBookmarked(): boolean {
  return bookmarks.value.has(getQuestionId(currentQuestion.value, currentIndex.value))
}

// ---- Progress stats ----
const answeredCount = computed(() => answers.value.size)
const accuracy = computed(() => {
  if (answeredCount.value === 0) return 0
  let correct = 0
  answers.value.forEach((ans, idx) => {
    const q = filteredQuestions.value[idx]
    if (q && optionLabels[ans!] === q.answer) correct++
  })
  return Math.round((correct / answeredCount.value) * 100)
})

// Reset index when filter changes
watch([filterChapter, showBookmarkOnly], () => {
  currentIndex.value = 0
  selected.value = null
  showResult.value = false
})

// On first load, restore current question state
watch(allQuestions, () => {
  if (allQuestions.value.length > 0) restoreStateForCurrent()
})
</script>

<template>
  <div class="quiz-container" v-if="allQuestions.length > 0">
    <!-- Header -->
    <div class="quiz-header">
      <div class="quiz-info">
        <span class="quiz-progress">{{ currentIndex + 1 }} / {{ totalQuestions }}</span>
        <span class="quiz-score">得分: {{ score }}</span>
        <span class="quiz-accuracy" v-if="answeredCount > 0">正确率: {{ accuracy }}%</span>
      </div>

      <div class="quiz-controls">
        <!-- Chapter filter -->
        <div class="quiz-filter" v-if="chapters.length > 1">
          <select v-model="filterChapter" class="chapter-select">
            <option value="">全部章节</option>
            <option v-for="ch in chapters" :key="ch" :value="ch">{{ ch }}</option>
          </select>
        </div>

        <!-- Bookmark toggle -->
        <button class="btn btn-icon" :class="{ active: showBookmarkOnly }" @click="showBookmarkOnly = !showBookmarkOnly" :title="showBookmarkOnly ? '显示全部' : '只看收藏'">
          ★
        </button>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="quiz-progress-bar">
      <div class="fill" :style="{ width: ((currentIndex + 1) / totalQuestions * 100) + '%' }"></div>
    </div>

    <!-- Question card -->
    <div class="question-card" v-if="currentQuestion">
      <!-- Badges + Bookmark -->
      <div class="question-top-row">
        <div class="question-badges">
          <span v-if="currentQuestion.isKey" class="badge badge-key">重点</span>
          <span v-if="currentQuestion.isHot" class="badge badge-hot">高频</span>
          <span v-if="currentQuestion.chapter" class="badge badge-chapter">{{ currentQuestion.chapter }}</span>
        </div>
        <button class="btn-bookmark" :class="{ active: isBookmarked() }" @click="toggleBookmark" :title="isBookmarked() ? '取消收藏' : '收藏本题'">
          {{ isBookmarked() ? '★' : '☆' }}
        </button>
      </div>

      <!-- Stem -->
      <div class="question-stem">{{ currentQuestion.stem }}</div>

      <!-- Options -->
      <div class="options-list">
        <button
          v-for="(option, index) in currentQuestion.options"
          :key="index"
          class="option-item"
          :class="{
            'selected': selected === index && !showResult,
            'correct': isCorrect(index),
            'wrong': isWrong(index),
          }"
          @click="selectOption(index)"
        >
          <span class="option-label">{{ optionLabels[index] }}</span>
          <span class="option-text">{{ option }}</span>
          <span v-if="isCorrect(index)" class="option-icon">&#10003;</span>
          <span v-if="isWrong(index)" class="option-icon">&#10007;</span>
        </button>
      </div>

      <!-- Analysis -->
      <div class="analysis-box" v-if="showResult">
        <div class="analysis-title">解析</div>
        <div class="analysis-text">{{ currentQuestion.analysis }}</div>
      </div>
    </div>

    <!-- Actions -->
    <div class="quiz-actions">
      <button class="btn btn-secondary" @click="prevQuestion" :disabled="currentIndex === 0">
        上一题
      </button>
      <button
        v-if="!showResult"
        class="btn btn-primary"
        @click="submitAnswer"
        :disabled="selected === null"
      >
        提交答案
      </button>
      <button
        v-else-if="currentIndex < totalQuestions - 1"
        class="btn btn-primary"
        @click="nextQuestion"
      >
        下一题
      </button>
      <button v-else class="btn btn-success" @click="resetQuiz">
        重新开始
      </button>
      <button class="btn btn-ghost" @click="resetQuiz" title="清除答题记录">
        清除记录
      </button>
    </div>

    <!-- Question navigator (dots) -->
    <div class="quiz-navigator">
      <div class="navigator-title">题目导航 (已答 {{ answeredCount }}/{{ totalQuestions }})</div>
      <div class="navigator-dots">
        <button
          v-for="(q, idx) in filteredQuestions"
          :key="idx"
          class="nav-dot"
          :class="{
            current: idx === currentIndex,
            answered: answers.value.has(idx),
            correct: answers.value.has(idx) && optionLabels[answers.value.get(idx)!] === q.answer,
            wrong: answers.value.has(idx) && optionLabels[answers.value.get(idx)!] !== q.answer,
            bookmarked: bookmarks.value.has(getQuestionId(q, idx))
          }"
          @click="jumpToQuestion(idx)"
          :title="`第 ${idx + 1} 题`"
        >
          {{ idx + 1 }}
        </button>
      </div>
    </div>

    <!-- Bookmark count -->
    <div class="bookmark-info" v-if="bookmarks.size > 0">
      <span>已收藏 {{ bookmarks.size }} 题</span>
    </div>
  </div>

  <!-- Empty state -->
  <div class="quiz-empty" v-else>
    <p>暂无题目数据</p>
  </div>
</template>

<style scoped>
.quiz-container {
  margin: 1.5rem 0;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.quiz-info {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.quiz-score {
  font-weight: 600;
  color: var(--vp-c-brand-1);
}

.quiz-accuracy {
  font-weight: 600;
  color: var(--vp-c-brand-2);
}

.quiz-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.15s ease;
}

.btn-icon:hover { border-color: var(--vp-c-brand-1); }
.btn-icon.active { background: var(--vp-c-brand-1); color: #fff; }

.chapter-select {
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.85rem;
  cursor: pointer;
}

.quiz-progress-bar {
  height: 4px;
  background: var(--vp-c-divider);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 1.25rem;
}

.quiz-progress-bar .fill {
  height: 100%;
  background: linear-gradient(90deg, var(--vp-c-brand-1), var(--vp-c-brand-2));
  border-radius: 2px;
  transition: width 0.3s ease;
}

.question-card { margin-bottom: 1rem; }

.question-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.question-badges {
  display: flex;
  gap: 0.5rem;
}

.badge {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-key {
  background: var(--badge-key-bg);
  color: var(--badge-key-color);
  border: 1px solid var(--badge-key-border);
}

.badge-hot {
  background: var(--badge-hot-bg);
  color: var(--badge-hot-color);
  border: 1px solid var(--badge-hot-border);
}

.badge-chapter {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  border: 1px solid var(--vp-c-brand-1);
}

.btn-bookmark {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--vp-c-text-3);
  transition: color 0.15s;
  padding: 0 0.25rem;
}

.btn-bookmark:hover { color: var(--vp-c-brand-1); }
.btn-bookmark.active { color: #f59e0b; }

.question-stem {
  font-size: 1.05rem;
  line-height: 1.8;
  margin-bottom: 1.25rem;
  font-weight: 500;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.option-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  font-size: 0.95rem;
  color: var(--vp-c-text-1);
}

.option-item:hover:not(.correct):not(.wrong) {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.option-item.selected {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.option-item.correct {
  border-color: var(--correct-border);
  background: var(--correct-bg);
  color: var(--correct-color);
}

.option-item.wrong {
  border-color: var(--wrong-border);
  background: var(--wrong-bg);
  color: var(--wrong-color);
}

.option-label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--vp-c-divider);
  font-size: 0.8rem;
  font-weight: 600;
  flex-shrink: 0;
}

.option-item.selected .option-label { background: var(--vp-c-brand-1); color: #fff; }
.option-item.correct .option-label { background: var(--correct-color); color: #fff; }
.option-item.wrong .option-label { background: var(--wrong-color); color: #fff; }

.option-text { flex: 1; }
.option-icon { font-size: 1.1rem; font-weight: 700; }

.analysis-box {
  margin-top: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.analysis-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--vp-c-brand-1);
  margin-bottom: 0.5rem;
}

.analysis-text {
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

.quiz-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.55rem 1.25rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-primary { background: var(--vp-c-brand-1); color: #fff; border-color: var(--vp-c-brand-1); }
.btn-primary:hover:not(:disabled) { background: var(--vp-c-brand-2); }

.btn-secondary { background: var(--vp-c-bg); color: var(--vp-c-text-1); }
.btn-secondary:hover:not(:disabled) { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }

.btn-success { background: var(--correct-color); color: #fff; border-color: var(--correct-color); }
.btn-success:hover:not(:disabled) { opacity: 0.9; }

.btn-ghost { background: transparent; color: var(--vp-c-text-3); font-size: 0.8rem; }
.btn-ghost:hover { color: var(--vp-c-text-1); }

/* Question navigator */
.quiz-navigator {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.navigator-title {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  margin-bottom: 0.5rem;
}

.navigator-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.nav-dot {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  transition: all 0.15s ease;
}

.nav-dot:hover { border-color: var(--vp-c-brand-1); transform: scale(1.1); }
.nav-dot.current { background: var(--vp-c-brand-1); color: #fff; border-color: var(--vp-c-brand-1); }
.nav-dot.answered.correct { background: var(--correct-bg); border-color: var(--correct-border); color: var(--correct-color); }
.nav-dot.answered.wrong { background: var(--wrong-bg); border-color: var(--wrong-border); color: var(--wrong-color); }
.nav-dot.bookmarked { box-shadow: 0 0 0 2px #f59e0b; }

.bookmark-info {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  text-align: center;
}

.quiz-empty {
  padding: 2rem;
  text-align: center;
  color: var(--vp-c-text-3);
  border: 1px dashed var(--vp-c-divider);
  border-radius: 12px;
}

@media (max-width: 768px) {
  .quiz-container { padding: 1rem; margin: 1rem 0; border-radius: 8px; }
  .quiz-header { flex-direction: column; gap: 0.5rem; align-items: flex-start; }
  .question-stem { font-size: 0.95rem; line-height: 1.7; }
  .option-item { padding: 0.75rem; font-size: 0.9rem; }
  .option-label { width: 28px; height: 28px; font-size: 0.8rem; }
  .quiz-actions { flex-wrap: wrap; gap: 0.5rem; }
  .btn { padding: 0.6rem 0.9rem; font-size: 0.85rem; }
  .nav-dot { width: 26px; height: 26px; font-size: 0.65rem; }
}
</style>
