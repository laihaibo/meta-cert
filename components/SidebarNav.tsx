'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { stripBase } from '@/lib/url'

export interface SidebarPage {
  slug: string
  sitePath: string
  type: string
  title: string
  weight: string | null
}

export interface SidebarSubject {
  id: string
  name: string
  pages: SidebarPage[]
}

export interface SidebarGroup {
  name: string
  subjects: Array<{ name: string; path: string }>
}

export default function SidebarNav({
  subject,
  groups,
}: {
  subject: SidebarSubject
  groups?: SidebarGroup[]
}) {
  const pathname = usePathname()

  const label = (p: SidebarPage) => {
    if (p.type === 'index') return '概述'
    if (p.type === 'summary') return '总结与速查'
    if (p.type === 'quiz') return '题库练习'
    return p.title
  }

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-[76px] max-h-[calc(100vh-100px)] space-y-6 overflow-y-auto pb-8 pr-2 no-scrollbar">
        <nav aria-label="科目目录">
          <ul className="space-y-0.5 text-[13.5px]">
            {subject.pages.map((p) => {
              const active = pathname === p.sitePath
              return (
                <li key={p.sitePath}>
                  <Link
                    href={stripBase(p.sitePath)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center justify-between rounded-lg px-3 py-[7px] leading-snug transition-colors duration-150 ${
                      active
                        ? 'bg-accent-soft font-medium text-accent'
                        : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="truncate">{label(p)}</span>
                    {p.weight && (
                      <span className="ml-2 shrink-0 text-[11px] tabular-nums text-ink-3">{p.weight}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {groups?.map((g) => (
          <nav key={g.name} aria-label={g.name}>
            <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
              {g.name}
            </div>
            <ul className="space-y-0.5 text-[13px]">
              {g.subjects.map((s) => {
                const active = pathname === s.path || pathname.startsWith(s.path)
                return (
                  <li key={s.path}>
                    <Link
                      href={stripBase(s.path)}
                      className={`block truncate rounded-lg px-3 py-[6px] transition-colors duration-150 ${
                        active
                          ? 'font-medium text-accent'
                          : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink dark:hover:bg-white/[0.06]'
                      }`}
                    >
                      {s.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        ))}
      </div>
    </aside>
  )
}
