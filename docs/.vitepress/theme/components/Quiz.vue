<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface QuizQuestion {
  stem: string
  options: string[]
  answer: string
  analysis: string
  chapter?: string
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
const filterChapter = ref<string>('')
const chapters = ref<string[]>([])

// Load questions from props or JSON file
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
  const chapterSet = new Set(allQuestions.value.map(q => q.chapter).filter(Boolean))
  chapters.value = Array.from(chapterSet) as string[]
})

// Filtered questions based on chapter selection
const filteredQuestions = computed(() => {
  if (!filterChapter.value) return allQuestions.value
  return allQuestions.value.filter(q => String(q.chapter) === filterChapter.value)
})

const currentQuestion = computed(() => filteredQuestions.value[currentIndex.value])
const totalQuestions = computed(() => filteredQuestions.value.length)

const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F']

function selectOption(index: number) {
  if (showResult.value) return
  selected.value = index
}

function submitAnswer() {
  if (selected.value === null) return
  showResult.value = true
  if (optionLabels[selected.value] === currentQuestion.value.answer) {
    score.value++
  }
}

function nextQuestion() {
  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++
    selected.value = null
    showResult.value = false
  }
}

function prevQuestion() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    selected.value = null
    showResult.value = false
  }
}

function resetQuiz() {
  currentIndex.value = 0
  selected.value = null
  showResult.value = false
  score.value = 0
}

function isCorrect(index: number): boolean {
  return showResult.value && optionLabels[index] === currentQuestion.value?.answer
}

function isWrong(index: number): boolean {
  return showResult.value && selected.value === index && optionLabels[index] !== currentQuestion.value?.answer
}

// Reset index when filter changes
watch(filterChapter, () => {
  currentIndex.value = 0
  selected.value = null
  showResult.value = false
  score.value = 0
})
</script>

<template>
  <div class="quiz-container" v-if="allQuestions.length > 0">
    <!-- Header -->
    <div class="quiz-header">
      <div class="quiz-info">
        <span class="quiz-progress">{{ currentIndex + 1 }} / {{ totalQuestions }}</span>
        <span class="quiz-score">得分: {{ score }}</span>
      </div>

      <!-- Chapter filter -->
      <div class="quiz-filter" v-if="chapters.length > 1">
        <select v-model="filterChapter" class="chapter-select">
          <option value="">全部章节</option>
          <option v-for="ch in chapters" :key="ch" :value="ch">{{ ch }}</option>
        </select>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="quiz-progress-bar">
      <div class="fill" :style="{ width: ((currentIndex + 1) / totalQuestions * 100) + '%' }"></div>
    </div>

    <!-- Question card -->
    <div class="question-card" v-if="currentQuestion">
      <!-- Badges -->
      <div class="question-badges">
        <span v-if="currentQuestion.isKey" class="badge badge-key">重点</span>
        <span v-if="currentQuestion.isHot" class="badge badge-hot">高频</span>
        <span v-if="currentQuestion.chapter" class="badge badge-chapter">{{ currentQuestion.chapter }}</span>
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

.question-card {
  margin-bottom: 1rem;
}

.question-badges {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
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

.option-item.selected .option-label {
  background: var(--vp-c-brand-1);
  color: #fff;
}

.option-item.correct .option-label {
  background: var(--correct-color);
  color: #fff;
}

.option-item.wrong .option-label {
  background: var(--wrong-color);
  color: #fff;
}

.option-text {
  flex: 1;
}

.option-icon {
  font-size: 1.1rem;
  font-weight: 700;
}

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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--vp-c-brand-1);
  color: #fff;
  border-color: var(--vp-c-brand-1);
}

.btn-primary:hover:not(:disabled) {
  background: var(--vp-c-brand-2);
}

.btn-secondary {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.btn-secondary:hover:not(:disabled) {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.btn-success {
  background: var(--correct-color);
  color: #fff;
  border-color: var(--correct-color);
}

.btn-success:hover:not(:disabled) {
  opacity: 0.9;
}

.quiz-empty {
  padding: 2rem;
  text-align: center;
  color: var(--vp-c-text-3);
  border: 1px dashed var(--vp-c-divider);
  border-radius: 12px;
}

@media (max-width: 768px) {
  .quiz-container {
    padding: 1rem;
    margin: 1rem 0;
    border-radius: 8px;
  }

  .quiz-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .question-stem {
    font-size: 0.95rem;
    line-height: 1.7;
  }

  .option-item {
    padding: 0.75rem;
    min-height: 48px;
    font-size: 0.9rem;
  }

  .option-label {
    width: 32px;
    height: 32px;
    font-size: 0.85rem;
  }

  .quiz-actions {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .btn {
    padding: 0.65rem 1rem;
    font-size: 0.95rem;
    min-height: 44px;
    flex: 1;
    min-width: 100px;
  }

  .chapter-select {
    width: 100%;
    padding: 0.5rem;
    font-size: 0.9rem;
  }

  .analysis-box {
    padding: 0.75rem;
  }
}
</style>
