'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'
import SearchDialog from '@/components/SearchDialog'
import { LogoMark } from '@/components/Footer'
import { SITE_BASE } from '@/lib/site'
import { stripBase } from '@/lib/url'

export interface NavSubject {
  name: string
  path: string
  volume: string | null
}

export interface NavExam {
  name: string
  icon: string
  subjects: NavSubject[]
}

export default function GlassNav({ exams }: { exams: NavExam[] }) {
  const pathname = usePathname()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setOpenMenu(null)
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null)
        setMobileOpen(false)
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setMobileOpen(false)
        setSearchOpen((v) => !v)
      }
    }
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('click', onClick)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 140)
  }
  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  /** fullPath 为含 basePath 的完整站点路径（manifest 中均带前缀） */
  function isActive(fullPath: string) {
    return fullPath === `${SITE_BASE}/` ? pathname === `${SITE_BASE}/` : pathname.startsWith(fullPath)
  }

  const linkCls = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-[13.5px] font-medium transition-colors duration-200 ${
      active ? 'text-accent' : 'text-ink-2 hover:text-ink'
    }`

  return (
    <>
      <header
        ref={navRef}
        className="fixed inset-x-0 top-0 z-40 transition-shadow duration-300"
        onMouseLeave={scheduleClose}
      >
        <div className="glass border-x-0 border-t-0" style={{ borderRadius: 0 }}>
          <nav className="mx-auto flex h-[52px] max-w-6xl items-center justify-between px-5">
            <Link
              href='/'
              className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-ink"
              aria-label="Meta Cert 首页"
            >
              <LogoMark className="h-[22px] w-[22px]" />
              Meta&nbsp;Cert
            </Link>

            {/* 桌面导航 */}
            <div className="hidden items-center gap-0.5 md:flex" onMouseEnter={cancelClose}>
              <Link href='/' className={linkCls(isActive(`${SITE_BASE}/`))}>
                首页
              </Link>
              {exams.map((exam) => (
                <div key={exam.name} className="relative" onMouseEnter={() => setOpenMenu(exam.name)}>
                  <button
                    className={linkCls(
                      exam.subjects.some((s) => isActive(s.path)) ||
                        (exam.name === '法考' && isActive(`${SITE_BASE}/law/`)),
                    )}
                    aria-expanded={openMenu === exam.name}
                    onClick={() => setOpenMenu(openMenu === exam.name ? null : exam.name)}
                  >
                    {exam.name}
                  </button>
                  {openMenu === exam.name && <Dropdown exam={exam} />}
                </div>
              ))}
              <Link href='/progress/' className={linkCls(isActive(`${SITE_BASE}/progress/`))}>
                学习进度
              </Link>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="搜索"
                className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-ink-2 transition-colors duration-200 hover:bg-ink/5 hover:text-ink dark:hover:bg-white/10"
              >
                <SearchIcon />
                <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 text-[10px] font-medium text-ink-3 lg:inline-block">
                  ⌘K
                </kbd>
              </button>
              <ThemeToggle />
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="打开菜单"
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink md:hidden dark:hover:bg-white/10"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* 移动端全屏玻璃抽屉 */}
      {mobileOpen && (
        <div className="glass-strong fixed inset-0 z-50 overflow-y-auto md:hidden" style={{ borderRadius: 0 }}>
          <div className="sticky top-0 z-10 flex h-[52px] items-center justify-between border-b border-line px-5">
            <span className="flex items-center gap-2.5 text-[15px] font-semibold text-ink">
              <LogoMark className="h-[22px] w-[22px]" />
              Meta&nbsp;Cert
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="关闭菜单"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-ink/5 dark:hover:bg-white/10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <div className="space-y-6 px-6 py-8">
            <Link href='/' className="block text-xl font-semibold text-ink">
              首页
            </Link>
            {exams.map((exam) => (
              <details key={exam.name} className="group" open>
                <summary className="flex cursor-pointer list-none items-center justify-between text-xl font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  <span>
                    {exam.icon} {exam.name}
                  </span>
                  <span className="text-ink-3 transition-transform group-open:rotate-45">＋</span>
                </summary>
                <div className="mt-3 space-y-2.5 border-l border-line pl-4">
                  {exam.subjects.map((s) => (
                    <Link
                      key={s.path}
                      href={stripBase(s.path)}
                      className="block text-[15px] leading-snug text-ink-2 transition-colors hover:text-accent"
                    >
                      {s.name}
                    </Link>
                  ))}
                </div>
              </details>
            ))}
            <Link href='/progress/' className="block text-xl font-semibold text-ink">
              学习进度
            </Link>
          </div>
        </div>
      )}

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}

function Dropdown({ exam }: { exam: NavExam }) {
  // 法考按卷分组两列展示，其余单列
  const volumes = [...new Set(exam.subjects.map((s) => s.volume || ''))]
  const grouped = exam.subjects.some((s) => s.volume)

  return (
    <div
      className="glass-strong absolute left-1/2 top-full z-50 mt-3 -translate-x-1/2 rounded-2xl p-2"
      onClick={(e) => e.stopPropagation()}
    >
      {grouped ? (
        <div className="grid w-max grid-cols-2 gap-x-1 px-2 py-1.5">
          {volumes.map((vol) => (
            <div key={vol} className="py-1.5 pr-3">
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-3">{vol}</div>
              {exam.subjects
                .filter((s) => (s.volume || '') === vol)
                .map((s) => (
                  <Link
                    key={s.path}
                    href={stripBase(s.path)}
                    className="block whitespace-nowrap rounded-lg px-3 py-[5px] text-[13px] text-ink-2 transition-colors hover:bg-accent-soft hover:text-accent"
                  >
                    {s.name}
                  </Link>
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="w-64 py-1">
          {exam.subjects.map((s) => (
            <Link
              key={s.path}
              href={stripBase(s.path)}
              className="block rounded-lg px-3 py-2 text-[13.5px] text-ink-2 transition-colors hover:bg-accent-soft hover:text-accent"
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}
