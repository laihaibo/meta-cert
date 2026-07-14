import DefaultTheme from 'vitepress/theme'
import { onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'
import './custom.css'
import Quiz from './components/Quiz.vue'
import ProgressDashboard from './components/ProgressDashboard.vue'

declare global {
  interface Window {
    mermaid: { initialize: (opts: any) => void; run: (opts: any) => Promise<void> }
  }
}

async function renderMermaid() {
  const mermaid = window?.mermaid
  if (!mermaid) return  // script not loaded yet

  const blocks = document.querySelectorAll('pre.mermaid:not([data-rendered])')
  for (const block of blocks) {
    ;(block as HTMLElement).setAttribute('data-rendered', 'true')
  }
  if (blocks.length > 0 && mermaid.run) {
    try {
      await mermaid.run({ nodes: Array.from(blocks) as HTMLElement[] })
    } catch {
      // Retry once if mermaid not yet initialized
      if (mermaid.initialize) {
        mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' })
        await mermaid.run({ nodes: Array.from(blocks) as HTMLElement[] })
      }
    }
  }
}

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Quiz', Quiz)
    app.component('ProgressDashboard', ProgressDashboard)
  },
  setup() {
    const route = useRoute()
    onMounted(() => {
      renderMermaid()
      watch(() => route.path, async () => {
        await nextTick()
        setTimeout(renderMermaid, 150)
      })
    })
  }
}
