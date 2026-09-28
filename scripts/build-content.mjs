/**
 * Meta Cert 内容管线
 *
 * 将 content 目录下全部 markdown 在构建期编译为 JSON（HTML + 元数据 + TOC + 上下篇），
 * 并产出 content-data/manifest.json（科目结构 / 路由清单 / 侧边栏数据）。
 *
 * 产物供 Next.js 静态导出在 SSG 阶段读取 —— 运行时零 markdown 解析。
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname, basename, relative, resolve } from 'node:path'
import { posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import matter from 'gray-matter'
import { visit } from 'unist-util-visit'
import { toString as hastToString } from 'hast-util-to-string'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const CONTENT_DIR = join(ROOT, 'content')
const OUT_DIR = join(ROOT, 'content-data')
const SITE_BASE = '/meta-cert'

// ============================================
// 站点结构定义（科目的唯一事实来源）
// ============================================

const EXAMS = [
  {
    name: '证券从业',
    slug: 'securities',
    tagline: 'SAC 从业资格考试',
    icon: '📈',
    accent: 'blue',
    subjects: [
      { path: 'securities/laws', name: '证券市场基本法律法规' },
      { path: 'securities/fundamentals', name: '金融市场基础知识' },
    ],
  },
  {
    name: '基金从业',
    slug: 'fund',
    tagline: 'AMAC 从业资格考试',
    icon: '💰',
    accent: 'emerald',
    subjects: [
      { path: 'fund/laws', name: '基金法律法规' },
      { path: 'fund/basics', name: '证券投资基金基础知识' },
      { path: 'fund/pe', name: '私募股权投资基金' },
    ],
  },
  {
    name: '法考',
    slug: 'law',
    tagline: '国家统一法律职业资格考试',
    icon: '⚖️',
    accent: 'violet',
    subjects: [
      { path: 'law/public/rule-of-law', name: '法治思想', volume: '卷一 · 公法' },
      { path: 'law/public/jurisprudence', name: '法理学', volume: '卷一 · 公法' },
      { path: 'law/public/constitution', name: '宪法', volume: '卷一 · 公法' },
      { path: 'law/public/legal-history', name: '中国法律史', volume: '卷一 · 公法' },
      { path: 'law/public/international', name: '国际法', volume: '卷一 · 公法' },
      { path: 'law/public/judicial-ethics', name: '司法制度和法律职业道德', volume: '卷一 · 公法' },
      { path: 'law/public/criminal', name: '刑法', volume: '卷一 · 公法' },
      { path: 'law/public/criminal-procedure', name: '刑事诉讼法', volume: '卷一 · 公法' },
      { path: 'law/public/administrative', name: '行政法与行政诉讼法', volume: '卷一 · 公法' },
      { path: 'law/private/civil', name: '民法', volume: '卷二 · 私法' },
      { path: 'law/private/ip', name: '知识产权法', volume: '卷二 · 私法' },
      { path: 'law/private/commercial', name: '商法', volume: '卷二 · 私法' },
      { path: 'law/private/economic', name: '经济法', volume: '卷二 · 私法' },
      { path: 'law/private/environment', name: '环境资源法', volume: '卷二 · 私法' },
      { path: 'law/private/labor', name: '劳动与社会保障法', volume: '卷二 · 私法' },
      { path: 'law/private/private-international', name: '国际私法', volume: '卷二 · 私法' },
      { path: 'law/private/economic-international', name: '国际经济法', volume: '卷二 · 私法' },
      { path: 'law/private/civil-procedure', name: '民事诉讼法', volume: '卷二 · 私法' },
    ],
  },
]

const CALLOUT_NAMES = new Set(['tip', 'warning', 'danger', 'note', 'guide', 'info'])

/** 内容中出现的 GitHub 风格 emoji 短代码 → 实际字符 */
const EMOJI_SHORTCODES = { ':warning:': '⚠️', ':fire:': '🔥' }

// ============================================
// 工具
// ============================================

/** 将 content/ 下的相对文件路径转换为站点路由路径（无 basePath、无尾斜杠） */
function fileToRoutePath(relMdPath) {
  let p = relMdPath.replace(/\.md$/, '').replace(/\\/g, '/')
  if (basename(p) === 'index') p = dirname(p)
  return p === '.' ? '' : p
}

/** 预处理 VitePress 风格容器 `::: tip 标题` → 指令 label 形式（跳过代码围栏） */
function preprocessContainers(md) {
  const lines = md.split('\n')
  let inFence = false
  return lines
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
      if (inFence) return line
      const m = line.match(/^:::\s*([a-zA-Z]+)\s*(.*)$/)
      if (m && CALLOUT_NAMES.has(m[1])) {
        const title = m[2].trim()
        return title ? `:::${m[1]}[${title}]` : `:::${m[1]}`
      }
      return line
    })
    .join('\n')
}

// ============================================
// rehype 插件
// ============================================

/** 提取 mdast 节点纯文本（用于指令标题） */
function mdastText(node) {
  if (node.type === 'text') return node.value
  return (node.children || []).map(mdastText).join('')
}

/** 容器指令 → 玻璃 callout 结构（label 语法下标题是首个带 directiveLabel 标记的子段落） */
function containerDirectiveHandler(state, node) {
  let children = node.children
  let title = null
  const first = children[0]
  if (first?.type === 'paragraph' && first.data?.directiveLabel) {
    title = mdastText(first).trim()
    children = children.slice(1)
  }
  const rest = state.all({ ...node, children })
  if (node.name === 'details') {
    return {
      type: 'element',
      tagName: 'details',
      properties: { className: ['mc-details'] },
      children: [
        {
          type: 'element',
          tagName: 'summary',
          properties: {},
          children: [{ type: 'text', value: title || '详情' }],
        },
        ...children,
      ],
    }
  }
  const kids = []
  if (title) {
    kids.push({
      type: 'element',
      tagName: 'p',
      properties: { className: ['mc-callout-title'] },
      children: [{ type: 'text', value: title }],
    })
  }
  kids.push(...rest)
  return {
    type: 'element',
    tagName: 'div',
    properties: { className: ['mc-callout', `mc-${node.name}`] },
    children: kids,
  }
}

/** ```mermaid 围栏 → 客户端水合占位（base64 编码存入 data 属性） */
function rehypeMermaid() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'pre') return
      const code = node.children[0]
      if (!code || code.type !== 'element' || code.tagName !== 'code') return
      const classes = code.properties?.className || []
      const hasMermaid = (Array.isArray(classes) ? classes : [classes]).some(
        (c) => String(c) === 'language-mermaid',
      )
      if (!hasMermaid) return
      const text = hastToString(code)
      node.tagName = 'div'
      node.properties = {
        className: ['mc-mermaid'],
        dataMermaid: Buffer.from(text, 'utf8').toString('base64'),
      }
      node.children = []
    })
  }
}

/** 内链改写：相对/站点绝对路径 → basePath 前缀 + 尾斜杠；外链新窗口打开 */
function rehypeLinks({ fromDir, validRoutes }) {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return
      const href = node.properties?.href
      if (!href) return
      const raw = String(href)
      if (raw.startsWith('#') || raw === '') return
      if (/^(https?:)?\/\//.test(raw) || /^(mailto|tel):/.test(raw)) {
        node.properties.target = '_blank'
        node.properties.rel = ['noopener', 'noreferrer']
        return
      }
      const [pathPart, hashPart] = raw.split('#')
      let target
      if (pathPart.startsWith('/')) {
        target = pathPart.slice(1)
      } else {
        target = posix.normalize(posix.join(fromDir, pathPart))
      }
      target = target.replace(/\.md$/, '').replace(/\/index$/, '').replace(/^\.$/, '').replace(/\/+$/, '')
      if (validRoutes && !validRoutes.has(target)) {
        console.warn(`  ⚠ 死链: ${raw} (解析为 /${target})`)
      }
      const prefix = `${SITE_BASE}/${target === '' ? '' : target + '/'}`
      node.properties.href = prefix + (hashPart ? `#${hashPart}` : '')
    })
  }
}

/** 提取元数据：标题 / TOC / 摘要 */
function rehypeExtract({ meta }) {
  return (tree) => {
    visit(tree, 'element', (node) => {
      const text = hastToString(node).trim()
      if (!node.properties?.id && text) {
        // rehype-slug 未覆盖的兜底（不应发生）
      }
      if (node.tagName === 'h1' && !meta.h1) {
        meta.h1 = text
      }
      if ((node.tagName === 'h2' || node.tagName === 'h3') && node.properties?.id && text) {
        meta.toc.push({ id: String(node.properties.id), text, level: node.tagName === 'h2' ? 2 : 3 })
      }
      if (!meta.excerpt && node.tagName === 'p') {
        meta.excerpt = text.slice(0, 160)
      }
    })
  }
}

// ============================================
// 主流程
// ============================================

function walkMd(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walkMd(full))
    } else if (entry.name.endsWith('.md')) {
      out.push(full)
    }
  }
  return out
}

rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(join(OUT_DIR, 'pages'), { recursive: true })
mkdirSync(join(OUT_DIR, 'quiz'), { recursive: true })

const t0 = Date.now()

// ---- 第一遍：确定全部路由（用于死链校验） ----
const allMd = walkMd(CONTENT_DIR)
const validRoutes = new Set()
for (const file of allMd) {
  const rel = relative(CONTENT_DIR, file).replace(/\\/g, '/')
  validRoutes.add(fileToRoutePath(rel))
}

// ---- 复制 quiz.json 到 content-data/quiz/<subject>.json ----
const quizFiles = []
function walkJson(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walkJson(full)
    else if (entry.name === 'quiz.json') quizFiles.push(full)
  }
}
walkJson(CONTENT_DIR)
for (const qf of quizFiles) {
  const subjectRel = relative(CONTENT_DIR, dirname(qf)).replace(/\\/g, '/')
  const data = JSON.parse(readFileSync(qf, 'utf8'))
  // 文件名 = subjectId（目录段以 - 连接），与 lib/content.ts 的 getQuizQuestions 对应
  writeFileSync(join(OUT_DIR, 'quiz', `${subjectRel.split('/').join('-')}.json`), JSON.stringify(data))
}

// ---- 第二遍：解析每个 markdown 文件 ----
const pages = new Map() // routePath -> page meta
const deadLinkWarnings = []

for (const file of allMd) {
  const rel = relative(CONTENT_DIR, file).replace(/\\/g, '/')
  const routePath = fileToRoutePath(rel)
  const fromDir = posix.dirname(rel)
  const raw = readFileSync(file, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  const { data: fm, content } = matter(raw)

  const meta = { toc: [], h1: null, excerpt: null }
  let mdBody = content
  for (const [code, emoji] of Object.entries(EMOJI_SHORTCODES)) {
    mdBody = mdBody.split(code).join(emoji)
  }
  const preprocessed = preprocessContainers(mdBody)

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkMath)
    .use(remarkRehype, {
      allowDangerousHtml: true,
      handlers: { containerDirective: containerDirectiveHandler },
    })
    .use(rehypeKatex, { strict: 'ignore' })
    .use(rehypeSlug)
    .use(rehypeMermaid)
    .use(rehypeLinks, { fromDir, validRoutes })
    .use(rehypeExtract, { meta })
    .use(rehypeStringify, { allowDangerousHtml: true })

  const vfile = processor.processSync(preprocessed)
  const html = String(vfile)

  const base = basename(routePath) || 'index'
  let type = 'page'
  if (routePath === 'law') type = 'law-hub'
  else if (base === 'index') type = 'index'
  else if (base === 'quiz') type = 'quiz'
  else if (base === 'summary') type = 'summary'
  else if (/^ch\d+/.test(base)) type = 'chapter'

  const title = (fm.title || meta.h1 || base).trim()
  pages.set(routePath, {
    routePath,
    sitePath: `${SITE_BASE}/${routePath === '' ? '' : routePath + '/'}`,
    type,
    title,
    weight: fm.weight != null ? String(fm.weight) : null,
    isKey: Boolean(fm.is_key),
    excerpt: (fm.description || meta.excerpt || '').trim(),
    subjectId: rel.includes('/') ? rel.split('/').slice(0, -1).join('-') : null,
    wordCount: content.replace(/\s/g, '').length,
    toc: meta.toc,
    html,
  })
}

// ---- 组装科目清单（侧边栏顺序：概述 → 章节 → 总结 → 题库） ----
function pageOrder(base) {
  if (base === 'index') return 0
  if (base === 'quiz') return 900
  if (base === 'summary') return 800
  return 100
}

const subjects = []
const claimed = new Set(['law'])
for (const exam of EXAMS) {
  for (const sub of exam.subjects) {
    const subDir = join(CONTENT_DIR, sub.path)
    if (!existsSync(subDir)) {
      console.error(`✗ 缺少科目目录: ${sub.path}`)
      continue
    }
    const files = walkMd(subDir).map((f) => relative(subDir, f).replace(/\\/g, '/'))
    const subPages = files
      .map((f) => {
        const rp = fileToRoutePath(`${sub.path}/${f}`)
        const isIndex = f === 'index.md'
        return { rp, slug: isIndex ? '' : f.replace(/\.md$/, ''), order: pageOrder(basename(f)) }
      })
      .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug, 'zh-Hans-CN', { numeric: true }))
      .map(({ rp, slug }) => {
        claimed.add(rp)
        const p = pages.get(rp)
        if (!p) throw new Error(`页面未找到: ${rp}`)
        return {
          slug,
          routePath: rp,
          sitePath: `${SITE_BASE}/${rp}/`,
          type: p.type,
          title: p.title,
          weight: p.weight,
          isKey: p.isKey,
          excerpt: p.excerpt,
        }
      })

    // 上下篇导航
    subPages.forEach((p, i) => {
      const meta = pages.get(p.routePath)
      const prev = i > 0 ? subPages[i - 1] : null
      const next = i < subPages.length - 1 ? subPages[i + 1] : null
      meta.prev = prev ? { title: prev.title, href: `${SITE_BASE}/${prev.routePath}/` } : null
      meta.next = next ? { title: next.title, href: `${SITE_BASE}/${next.routePath}/` } : null
    })

    subjects.push({
      id: sub.path.split('/').join('-'),
      exam: exam.name,
      examSlug: exam.slug,
      volume: sub.volume || null,
      name: sub.name,
      path: `${SITE_BASE}/${sub.path}/`,
      contentPath: sub.path,
      pages: subPages,
    })
  }
}

// ---- 未被任何科目认领的页面（如 law hub）单独登记 ----
for (const [rp, p] of pages) {
  if (!claimed.has(rp)) {
    console.warn(`  ⚠ 未归类页面: /${rp} (type=${p.type})`)
  }
}

const manifest = {
  generatedAt: new Date().toISOString(),
  base: SITE_BASE,
  exams: EXAMS.map((e) => ({
    name: e.name,
    slug: e.slug,
    tagline: e.tagline,
    icon: e.icon,
    accent: e.accent,
    subjects: e.subjects.map((s) => ({
      id: s.path.split('/').join('-'),
      name: s.name,
      path: `${SITE_BASE}/${s.path}/`,
      contentPath: s.path,
      volume: s.volume || null,
    })),
  })),
  subjects,
  allPages: [...pages.values()].map((p) => ({
    routePath: p.routePath,
    sitePath: p.sitePath,
    title: p.title,
    type: p.type,
    excerpt: p.excerpt,
    subjectId: p.subjectId,
  })),
  stats: {
    pages: pages.size,
    questions: quizFiles.reduce((n, f) => n + JSON.parse(readFileSync(f, 'utf8')).length, 0),
    subjects: subjects.length,
  },
}

// ---- 写出 ----
for (const [rp, p] of pages) {
  writeFileSync(join(OUT_DIR, 'pages', `${rp.replace(/\//g, '__')}.json`), JSON.stringify(p))
}
writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))

console.log(`✓ 内容管线完成: ${pages.size} 页 / ${manifest.stats.questions} 题 / ${subjects.length} 科目，耗时 ${Date.now() - t0}ms`)
