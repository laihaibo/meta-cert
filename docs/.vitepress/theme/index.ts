import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './custom.css'
import Quiz from './components/Quiz.vue'
import ProgressDashboard from './components/ProgressDashboard.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Quiz', Quiz)
    app.component('ProgressDashboard', ProgressDashboard)
  }
} satisfies Theme
