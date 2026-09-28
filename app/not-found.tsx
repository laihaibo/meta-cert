import Link from 'next/link'
import { getManifest } from '@/lib/content'
import { stripBase } from '@/lib/url'

export default function NotFound() {
  const subjects = getManifest().subjects.slice(0, 6)
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-5 pb-16 pt-24 text-center lg:pt-32">
      <p className="bg-gradient-to-r from-[#0071e3] to-[#5e5ce6] bg-clip-text text-[72px] font-bold leading-none tracking-tight text-transparent">
        404
      </p>
      <h1 className="mt-4 text-[22px] font-bold tracking-tight text-ink">这个页面不存在</h1>
      <p className="mt-2 text-[14.5px] text-ink-2">链接可能已失效，或内容在改版中被移动了。</p>
      <div className="mt-8 flex gap-3">
        <Link
          href='/'
          className="h-10 rounded-full bg-accent px-6 text-[14px] font-medium leading-[40px] text-white transition-colors hover:bg-accent/85"
        >
          返回首页
        </Link>
      </div>
      <div className="mt-10 w-full">
        <p className="mb-3 text-[12px] text-ink-3">热门科目</p>
        <div className="flex flex-wrap justify-center gap-2">
          {subjects.map((s) => (
            <Link
              key={s.id}
              href={stripBase(s.path)}
              className="glass rounded-full px-4 py-1.5 text-[13px] text-ink-2 transition-colors hover:text-accent"
            >
              {s.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
