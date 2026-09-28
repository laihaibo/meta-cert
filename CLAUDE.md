# Meta Cert — 项目开发指南

## 项目概述

Meta Cert 是一个基于 Next.js 的多元从业资格学习平台，包含证券从业、基金从业、法律职业资格考试的系统学习内容和智能题库。设计语言：Apple 风格 + Liquid Glass（玻璃拟态），支持明暗双主题。

## 技术栈

- **框架**: Next.js 15（App Router，`output: 'export'` 静态导出，React 19）
- **样式**: Tailwind CSS v4 + CSS 变量设计 tokens（`app/globals.css`）
- **语言**: TypeScript
- **内容管线**: unified / remark / rehype（构建期 markdown → JSON）
- **搜索**: Pagefind（构建后索引 `out/`）
- **图表**: mermaid（客户端动态加载）、KaTeX（构建期渲染）
- **包管理**: pnpm
- **部署**: GitHub Pages（`out/` + `.nojekyll`，basePath `/meta-cert`）

## 开发命令

```bash
pnpm install          # 安装依赖
pnpm run dev          # 内容管线 + 启动开发服务器（http://localhost:3000/meta-cert/）
pnpm run build        # 内容管线 + next build 静态导出 + pagefind 搜索索引
pnpm run content      # 仅运行内容管线（markdown → content-data/）
pnpm run search       # 仅重建搜索索引
```

## 目录结构

```
app/
├── layout.tsx              # 全局外壳：GlassNav、Footer、主题脚本、环境光斑
├── page.tsx                # 首页
├── progress/page.tsx       # 学习进度页（ProgressDashboard）
├── [[...slug]]/page.tsx    # 内容页：章节/题库/总结/概述，含面包屑与 JSON-LD
├── not-found.tsx           # 404
├── sitemap.ts / robots.ts  # 由 manifest 自动生成
└── globals.css             # 设计 tokens + Liquid Glass 组件层 + 正文排版(.mc-prose)

content/                    # markdown 内容源（唯一的编辑对象）
├── shared/quiz-schema.json
├── securities/{laws,fundamentals}/
├── fund/{laws,basics,pe}/
└── law/                    # index.md 为法考 hub；public/ 卷一·公法；private/ 卷二·私法

components/
├── GlassNav.tsx            # 玻璃导航（下拉菜单 / 移动端抽屉 / ⌘K）
├── Quiz.tsx                # 题库（章节筛选/收藏/错题本/键盘作答/深链）
├── ProgressDashboard.tsx   # 进度仪表盘（环形图/薄弱章节）
├── SearchDialog.tsx        # ⌘K 搜索（Pagefind）
├── SidebarNav.tsx / Toc.tsx（scrollspy）/ ReadingProgress.tsx
├── MermaidHydrator.tsx     # 图表水合（主题切换时重绘）
└── ThemeToggle.tsx / BackToTop.tsx / Footer.tsx

lib/
├── content.ts              # 构建期读取 manifest / 页面 JSON / 题库（仅服务端）
├── progress.ts             # 学习进度 store（useSyncExternalStore，localStorage schema v1）
├── site.ts                 # 站点常量（SITE_BASE='/meta-cert' 等）
└── url.ts                  # stripBase()（manifest 路径 → <Link> 路径）

scripts/build-content.mjs   # 内容管线（科目结构 EXAMS 是科目的唯一事实来源）
content-data/               # 管线产物（gitignore，构建时重新生成）
```

## 内容编写规范

### 知识点页面

每个章节使用 Markdown 编写，结构为：
- 章节标题（h1）
- 知识点分节（h2/h3）
- 高频考点用 `::: tip 标题` / `::: warning 标题` 容器标注（也可用 danger/note/guide）
- 分值信息写在 frontmatter：`weight: 5-8%`、`is_key: true`
- 思维导图用 ` ```mermaid ` 围栏；公式用 `$...$` / `$$...$$`

### 题库文件 (quiz.json)

- 遵循 `content/shared/quiz-schema.json` 定义的格式
- `answer` 字段为字符串类型，值为 "A"、"B"、"C"、"D"（不是数字）
- `id` 格式为 `{subject}-{number}`，如 `laws-001`
- 每条必须包含 `id, chapter, stem, options(4), answer, analysis`；可选 `isKey`、`isHot`
- 注意 analysis 的键名是 `analysis`，不要写成中文 `解析`

### 题库页面 (quiz.md)

一行即可（组件与数据由路由页自动装配）：

```markdown
# 题库练习 - 科目名称

## 使用说明

- 共 XX 题，覆盖全部章节……
```

管线识别 `quiz.md` 为题库页，构建时自动注入同目录 `quiz.json` 并渲染 `<Quiz>`。

## 添加新科目步骤

1. 在 `scripts/build-content.mjs` 的 `EXAMS` 数组登记科目（目录路径、名称、所属考试/卷别）
2. 创建目录：`content/{exam}/{subject}/`
3. 创建 `index.md`（概述）、`ch01.md` ~ `chNN.md`、`summary.md`（总结速查）、`quiz.md`（题库页）
4. 创建 `quiz.json`（遵循 quiz-schema.json）
5. `pnpm run dev` 验证 —— 导航、侧栏、首页卡片、sitemap、静态化参数全部由 manifest 自动生成

## 关键约定（改动前必读）

- **localStorage 兼容**：`meta-cert:progress`（schema v1）与 `quiz_progress_./quiz.json` 两个 key 是旧站遗留格式，Quiz/进度组件必须维持不变，否则用户数据丢失
- **subjectId 派生**：从 URL pathname 去掉文件名后用 `-` 连接（如 `/law/public/criminal/quiz/` → `law-public-criminal`），路由路径不可随意改动
- **basePath**：manifest 里的路径均带 `/meta-cert` 前缀；传给 `<Link>` 必须过 `stripBase()`（Link 会自动再加 basePath），纯 `<a>`/sitemap/JSON-LD 用完整路径
- **正文 HTML** 由管线构建期生成（`.mc-prose` 容器内 `dangerouslySetInnerHTML`），不要在客户端解析 markdown
- `content-data/` 是产物不要手改；改内容只改 `content/`，改结构只改 `scripts/build-content.mjs` 的 `EXAMS`
