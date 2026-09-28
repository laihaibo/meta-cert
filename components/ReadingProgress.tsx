'use client'

import { useEffect, useState } from 'react'

/** 顶部阅读进度条 —— 跟踪 .mc-article 元素的滚动比例 */
export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const article = document.querySelector('.mc-article')
    if (!article) return
    const onScroll = () => {
      const rect = article.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      if (total <= 0) {
        setProgress(1)
        return
      }
      const scrolled = Math.min(Math.max(-rect.top, 0), total)
      setProgress(scrolled / total)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[52px] z-40 h-[2px]" aria-hidden>
      <div
        className="h-full bg-gradient-to-r from-[#2997ff] to-[#5e5ce6] transition-[width] duration-150 ease-out"
        style={{ width: `${progress * 100}%`, opacity: progress > 0.005 ? 1 : 0 }}
      />
    </div>
  )
}
