/** 内容数据类型 + 构建期读取器（仅服务端组件/SSG 使用） */
import fs from 'node:fs'
import path from 'node:path'

export interface ManifestPage {
  slug: string
  routePath: string
  sitePath: string
  type: 'index' | 'chapter' | 'summary' | 'quiz' | 'page'
  title: string
  weight: string | null
  isKey: boolean
  excerpt: string
}

export interface ManifestSubject {
  id: string
  exam: string
  examSlug: string
  volume: string | null
  name: string
  path: string
  contentPath: string
  pages: ManifestPage[]
}

export interface ManifestExam {
  name: string
  slug: string
  tagline: string
  icon: string
  accent: string
  subjects: Array<{ id: string; name: string; path: string; contentPath: string; volume: string | null }>
}

export interface Manifest {
  generatedAt: string
  base: string
  exams: ManifestExam[]
  subjects: ManifestSubject[]
  allPages: Array<{
    routePath: string
    sitePath: string
    title: string
    type: string
    excerpt: string
    subjectId: string | null
  }>
  stats: { pages: number; questions: number; subjects: number }
}

export interface PageData extends ManifestPage {
  routePath: string
  sitePath: string
  subjectId: string | null
  wordCount: number
  toc: Array<{ id: string; text: string; level: 2 | 3 }>
  html: string
  prev: { title: string; href: string } | null
  next: { title: string; href: string } | null
}

export interface QuizQuestion {
  id?: string
  chapter?: number | string
  stem: string
  options: string[]
  answer: string
  analysis: string
  isKey?: boolean
  isHot?: boolean
}

const DATA_DIR = path.join(process.cwd(), 'content-data')

let cachedManifest: Manifest | null = null

export function getManifest(): Manifest {
  if (cachedManifest === null) {
    cachedManifest = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'manifest.json'), 'utf8'))
  }
  return cachedManifest as Manifest
}

export function getPageData(routePath: string): PageData | null {
  const file = path.join(DATA_DIR, 'pages', `${routePath.replace(/\//g, '__')}.json`)
  if (!fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

export function getQuizQuestions(subjectId: string): QuizQuestion[] {
  const file = path.join(DATA_DIR, 'quiz', `${subjectId}.json`)
  if (!fs.existsSync(file)) return []
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}
