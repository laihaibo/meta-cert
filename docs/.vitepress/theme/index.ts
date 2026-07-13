import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './custom.css'
import Quiz from './components/Quiz.vue'
import ProgressDashboard from './components/ProgressDashboard.vue'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid({
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Quiz', Quiz)
    app.component('ProgressDashboard', ProgressDashboard)
  },
  mermaid: {},
  mermaidZoom: true
}) satisfies Theme
