<script setup lang="ts">
import { computed } from 'vue'
import { useProgress } from '../composables/useProgress'

const { progressData, getOverallStats, getSubjectStats, getWeakChapters, resetProgress, resetSubject } = useProgress()

const overall = computed(() => getOverallStats())
const weakChapters = computed(() => getWeakChapters())

// Subject display names
const subjectNames: Record<string, string> = {
  'securities-laws': '证券市场基本法律法规',
  'securities-fundamentals': '金融市场基础知识',
  'fund-laws': '基金法律法规',
  'fund-basics': '证券投资基金基础知识',
  'fund-pe': '私募股权投资基金',
}

// Subject stats
const subjectStatsList = computed(() => {
  return Object.entries(progressData.value.subjects).map(([id, _]) => ({
    id,
    name: subjectNames[id] || id,
    ...getSubjectStats(id),
  }))
})

// Has any progress
const hasProgress = computed(() => overall.value.totalAttempted > 0)

function handleResetAll() {
  if (confirm('确定要重置所有学习进度吗？此操作不可撤销。')) {
    resetProgress()
  }
}

function handleResetSubject(subjectId: string) {
  if (confirm(`确定要重置「${subjectNames[subjectId] || subjectId}」的学习进度吗？`)) {
    resetSubject(subjectId)
  }
}
</script>

<template>
  <div class="progress-dashboard">
    <!-- Overall Progress -->
    <section class="dashboard-section">
      <h2 class="section-title">📊 学习总览</h2>

      <div class="stats-grid" v-if="hasProgress">
        <div class="stat-card">
          <div class="stat-value">{{ overall.totalAttempted }}</div>
          <div class="stat-label">已答题数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ overall.totalCorrect }}</div>
          <div class="stat-label">答对题数</div>
        </div>
        <div class="stat-card accent">
          <div class="stat-value">{{ overall.overallCorrectRate }}%</div>
          <div class="stat-label">总正确率</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ overall.completedChapters }}/{{ overall.totalChapters }}</div>
          <div class="stat-label">已完成章节</div>
        </div>
      </div>

      <div class="empty-state" v-else>
        <p>还没有学习记录，开始答题后这里会显示你的学习进度。</p>
      </div>
    </section>

    <!-- Chapter Progress Bar -->
    <section class="dashboard-section" v-if="hasProgress">
      <h2 class="section-title">📈 章节进度</h2>
      <div class="progress-overview">
        <div class="progress-bar-large">
          <div
            class="fill"
            :style="{ width: overall.chapterProgress + '%' }"
          ></div>
        </div>
        <span class="progress-text">{{ overall.chapterProgress }}%</span>
      </div>
    </section>

    <!-- Per-Subject Stats -->
    <section class="dashboard-section" v-if="subjectStatsList.length > 0">
      <h2 class="section-title">📚 各科统计</h2>

      <div class="subject-cards">
        <div
          v-for="subject in subjectStatsList"
          :key="subject.id"
          class="subject-card"
        >
          <div class="subject-header">
            <h3 class="subject-name">{{ subject.name }}</h3>
            <button
              class="btn-reset-sm"
              @click="handleResetSubject(subject.id)"
              title="重置此科目进度"
            >
              重置
            </button>
          </div>

          <div class="subject-stats-row">
            <div class="mini-stat">
              <span class="mini-value">{{ subject.attempted }}</span>
              <span class="mini-label">已答</span>
            </div>
            <div class="mini-stat">
              <span class="mini-value">{{ subject.correct }}</span>
              <span class="mini-label">正确</span>
            </div>
            <div class="mini-stat highlight">
              <span class="mini-value">{{ subject.correctRate }}%</span>
              <span class="mini-label">正确率</span>
            </div>
          </div>

          <!-- Chapter breakdown -->
          <div class="chapter-list" v-if="Object.keys(subject.chapters).length > 0">
            <div
              v-for="(stats, chapterId) in subject.chapters"
              :key="chapterId"
              class="chapter-row"
            >
              <span class="chapter-name">{{ chapterId }}</span>
              <div class="chapter-bar">
                <div
                  class="fill"
                  :class="{
                    'good': stats.correctRate >= 80,
                    'ok': stats.correctRate >= 60 && stats.correctRate < 80,
                    'weak': stats.correctRate < 60,
                  }"
                  :style="{ width: (stats.attempted > 0 ? stats.correctRate : 0) + '%' }"
                ></div>
              </div>
              <span class="chapter-rate" :class="{
                'good': stats.correctRate >= 80,
                'ok': stats.correctRate >= 60 && stats.correctRate < 80,
                'weak': stats.correctRate < 60,
              }">
                {{ stats.attempted > 0 ? stats.correctRate + '%' : '-' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Weak Chapters Alert -->
    <section class="dashboard-section" v-if="weakChapters.length > 0">
      <h2 class="section-title">⚠️ 薄弱知识点</h2>
      <div class="weak-alert">
        <p class="weak-desc">以下章节正确率低于 60%，建议重点复习：</p>
        <div class="weak-list">
          <div
            v-for="weak in weakChapters"
            :key="`${weak.subjectId}-${weak.chapterId}`"
            class="weak-item"
          >
            <span class="weak-name">{{ subjectNames[weak.subjectId] || weak.subjectId }} - {{ weak.chapterId }}</span>
            <span class="weak-rate">{{ weak.correctRate }}%</span>
            <span class="weak-detail">({{ weak.attempted }}/{{ weak.total }})</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Reset All -->
    <section class="dashboard-section" v-if="hasProgress">
      <div class="reset-area">
        <button class="btn-reset" @click="handleResetAll">
          重置所有进度
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.progress-dashboard {
  margin: 1.5rem 0;
}

.dashboard-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--vp-c-divider);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.stat-card {
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  text-align: center;
}

.stat-card.accent {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  line-height: 1.2;
}

.stat-card.accent .stat-value {
  color: var(--vp-c-brand-1);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  margin-top: 0.25rem;
}

/* Progress Bar */
.progress-overview {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar-large {
  flex: 1;
  height: 12px;
  background: var(--vp-c-divider);
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar-large .fill {
  height: 100%;
  background: linear-gradient(90deg, var(--vp-c-brand-1), var(--vp-c-brand-2));
  border-radius: 6px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  min-width: 3rem;
  text-align: right;
}

/* Subject Cards */
.subject-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.subject-card {
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.subject-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.subject-stats-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.mini-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mini-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.mini-stat.highlight .mini-value {
  color: var(--vp-c-brand-1);
}

.mini-label {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
}

/* Chapter List */
.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.chapter-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
}

.chapter-name {
  min-width: 5rem;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chapter-bar {
  flex: 1;
  height: 6px;
  background: var(--vp-c-divider);
  border-radius: 3px;
  overflow: hidden;
}

.chapter-bar .fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.chapter-bar .fill.good { background: var(--correct-color); }
.chapter-bar .fill.ok { background: #f9a825; }
.chapter-bar .fill.weak { background: var(--wrong-color); }

.chapter-rate {
  min-width: 2.5rem;
  text-align: right;
  font-weight: 600;
}

.chapter-rate.good { color: var(--correct-color); }
.chapter-rate.ok { color: #f9a825; }
.chapter-rate.weak { color: var(--wrong-color); }

/* Weak Chapters */
.weak-alert {
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid var(--wrong-border);
  background: var(--wrong-bg);
}

.weak-desc {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.weak-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.weak-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.weak-name {
  flex: 1;
  color: var(--vp-c-text-1);
}

.weak-rate {
  font-weight: 700;
  color: var(--wrong-color);
}

.weak-detail {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

/* Empty State */
.empty-state {
  padding: 2rem;
  text-align: center;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 12px;
  color: var(--vp-c-text-3);
}

/* Reset Buttons */
.reset-area {
  text-align: center;
}

.btn-reset {
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--wrong-border);
  background: transparent;
  color: var(--wrong-color);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-reset:hover {
  background: var(--wrong-bg);
}

.btn-reset-sm {
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: transparent;
  color: var(--vp-c-text-3);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-reset-sm:hover {
  border-color: var(--wrong-color);
  color: var(--wrong-color);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .subject-stats-row {
    gap: 1rem;
  }

  .chapter-name {
    min-width: 3rem;
  }
}
</style>
