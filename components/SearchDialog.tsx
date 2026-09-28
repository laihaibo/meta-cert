'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { SITE_BASE } from '@/lib/site'

interface SearchResult {
  url: string
  title: string
  excerpt: string
  meta?: Record<string, string>
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Pagefind = {
  search: (q: string) => Promise<{ results: Array<{ data: () => Promise<PagefindResult> }> }>
}
type PagefindResult = {
  url: string
  excerpt: string
  meta?: { title?: string; site?: string }
}

export default function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'done'>('idle')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const pagefindRef = useRef<Pagefind | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const loadPagefind = useCallback(async (): Promise<Pagefind> => {
    if (pagefindRef.current) return pagefindRef.current
    const pf = await import(/* webpackIgnore: true */ `${window.location.origin}${SITE_BASE}/pagefind/pagefind.js`)
    const api = ((pf as any).default || pf) as Pagefind
    pagefindRef.current = api
    return api
  }, [])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setResults([])
    setActive(0)
    setStatus('idle')
    setTimeout(() => inputRef.current?.focus(), 30)
  }, [open])

  useEffect(() => {
    if (!open) return
    const q = query.trim()
    if (!q) {
      setResults([])
      setStatus('idle')
      return
    }
    setStatus('loading')
    const timer = setTimeout(async () => {
      try {
        const pf = await loadPagefind()
        const res = await pf.search(q)
        const data = await Promise.all(res.results.slice(0, 10).map((r) => r.data()))
        setResults(
          data.map((d) => ({
            url: d.url.startsWith(SITE_BASE) ? d.url : SITE_BASE + d.url,
            title: d.meta?.title || d.url,
            excerpt: d.excerpt,
          })),
        )
        setActive(0)
        setStatus('done')
      } catch {
        setStatus('error')
      }
    }, 160)
    return () => clearTimeout(timer)
  }, [query, open, loadPagefind])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => Math.min(i + 1, results.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter' && results[active]) {
        window.location.href = results[active].url
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, active, onClose])

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/25 px-4 pt-[12vh] backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="glass-strong w-full max-w-xl overflow-hidden rounded-2xl" role="dialog" aria-label="搜索">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-ink-3">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索章节、考点、题目…"
            className="h-12 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
          />
          <kbd className="shrink-0 rounded-md border border-line px-1.5 py-0.5 text-[10px] text-ink-3">Esc</kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {status === 'idle' && (
            <div className="px-3 py-8 text-center text-[13px] text-ink-3">
              输入关键词检索全部 292 个页面
            </div>
          )}
          {status === 'error' && (
            <div className="px-3 py-8 text-center text-[13px] text-ink-3">
              搜索索引未生成 —— 构建后可用（pnpm build）
            </div>
          )}
          {status === 'done' && results.length === 0 && (
            <div className="px-3 py-8 text-center text-[13px] text-ink-3">没有找到「{query}」相关内容</div>
          )}
          {results.map((r, i) => (
            <a
              key={r.url}
              href={r.url}
              data-active={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={onClose}
              className={`block rounded-xl px-3.5 py-2.5 transition-colors ${
                i === active ? 'bg-accent-soft' : ''
              }`}
            >
              <div className={`text-[13.5px] font-medium ${i === active ? 'text-accent' : 'text-ink'}`}>
                {r.title}
              </div>
              <div
                className="mt-0.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-3 [&_mark]:rounded [&_mark]:bg-amber-300/40 [&_mark]:text-inherit"
                dangerouslySetInnerHTML={{ __html: r.excerpt }}
              />
            </a>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[11px] text-ink-3">
          <span>↑↓ 选择 · ↵ 打开</span>
          <span>Pagefind 全文检索</span>
        </div>
      </div>
    </div>
  )
}
