'use client'

import { useEffect, useState } from 'react'

export interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

export default function Toc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (items.length === 0) return
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null)
    if (headings.length === 0) return

    const visible = new Map<string, boolean>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible.set(entry.target.id, entry.isIntersecting)
        }
        // 取视口中第一个可见标题；无可见时保持上一个
        for (const h of headings) {
          if (visible.get(h.id)) {
            setActiveId(h.id)
            return
          }
        }
      },
      { rootMargin: '-84px 0px -66% 0px', threshold: 0 },
    )
    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-[76px] max-h-[calc(100vh-100px)] overflow-y-auto py-10 no-scrollbar">
        <div className="pb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-3">本页目录</div>
        <nav aria-label="页面目录">
          <ul className="space-y-0.5 border-l border-line text-[12.5px]">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className={`-ml-px block border-l-2 py-1 leading-snug transition-colors duration-150 ${
                    item.level === 3 ? 'pl-7' : 'pl-3.5'
                  } ${
                    activeId === item.id
                      ? 'border-accent font-medium text-accent'
                      : 'border-transparent text-ink-2 hover:border-line-strong hover:text-ink'
                  }`}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  )
}
