import { SITE_BASE, SITE_NAME, SITE_TAGLINE } from '@/lib/site'

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-10 text-center">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <LogoMark className="h-[18px] w-[18px]" />
          {SITE_NAME}
        </div>
        <p className="text-xs text-ink-3">{SITE_TAGLINE}</p>
        <p className="text-xs text-ink-3">
          © 2026 {SITE_NAME} ·{' '}
          <a
            href="https://github.com/laihaibo/meta-cert"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-accent"
          >
            GitHub
          </a>
        </p>
      </div>
    </footer>
  )
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="mc-lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b9eff" />
          <stop offset="1" stopColor="#1558d6" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8.5" fill="url(#mc-lg)" />
      <rect x="1" y="1" width="30" height="30" rx="8.5" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1" />
      <path
        d="M9 22V11.5c0-.8.9-1.2 1.5-.7l4.6 4.2c.5.5 1.3.5 1.8 0l4.6-4.2c.6-.5 1.5-.1 1.5.7V22"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  )
}
