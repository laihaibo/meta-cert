'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
    const onThemeChange = (e: Event) => {
      setDark((e as CustomEvent<boolean>).detail)
    }
    window.addEventListener('themechange', onThemeChange)
    return () => window.removeEventListener('themechange', onThemeChange)
  }, [])

  function toggle() {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent('themechange', { detail: next }))
    setDark(next)
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? '切换到浅色模式' : '切换到深色模式'}
      className="flex h-8 w-8 items-center justify-center rounded-full text-ink-2 transition-colors duration-200 hover:bg-ink/5 hover:text-ink dark:hover:bg-white/10"
    >
      {dark === null ? (
        <span className="block h-[17px] w-[17px]" />
      ) : dark ? (
        <SunIcon />
      ) : (
        <MoonIcon />
      )}
    </button>
  )
}

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4 19 19M19 5l-1.6 1.6M6.6 17.4 5 19" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M20.4 14.2A8.3 8.3 0 0 1 9.8 3.6a8.3 8.3 0 1 0 10.6 10.6Z" />
    </svg>
  )
}
