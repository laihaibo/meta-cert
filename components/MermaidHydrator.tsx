'use client'

import { useEffect } from 'react'

/**
 * 内容页 mermaid 水合：管线把 ```mermaid 围栏编译为 .mc-mermaid[data-mermaid] 占位，
 * 挂载后动态加载 mermaid（仅图表页下载）渲染 SVG；主题切换时按新主题重绘。
 */
export default function MermaidHydrator() {
  useEffect(() => {
    let cancelled = false

    async function renderAll() {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>('.mc-mermaid:not([data-done])'))
      if (nodes.length === 0) return
      try {
        const mermaid = (await import('mermaid')).default
        if (cancelled) return
        const dark = document.documentElement.classList.contains('dark')
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: dark ? 'dark' : 'default',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
        })
        for (let i = 0; i < nodes.length; i++) {
          if (cancelled) return
          const el = nodes[i]
          const code = decodeBase64Utf8(el.dataset.mermaid || '')
          try {
            const { svg } = await mermaid.render(`mc-mmd-${i}-${Date.now()}`, code)
            if (cancelled) return
            el.innerHTML = svg
            el.dataset.done = '1'
          } catch {
            const pre = document.createElement('pre')
            pre.textContent = code
            el.innerHTML = ''
            el.appendChild(pre)
            el.dataset.done = '1'
          }
        }
      } catch {
        /* mermaid 加载失败时保留占位样式 */
      }
    }

    renderAll()

    const onThemeChange = () => {
      document.querySelectorAll<HTMLElement>('.mc-mermaid[data-done]').forEach((el) => {
        el.removeAttribute('data-done')
        el.innerHTML = ''
      })
      renderAll()
    }
    window.addEventListener('themechange', onThemeChange)
    return () => {
      cancelled = true
      window.removeEventListener('themechange', onThemeChange)
    }
  }, [])

  return null
}

function decodeBase64Utf8(b64: string): string {
  const bin = atob(b64)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}
