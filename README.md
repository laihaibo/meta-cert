<div align="center">

<img src="public/logo.svg" width="80" alt="Meta Cert" />

# Meta Cert

**多元从业资格学习平台 · 开源备考站**

基于 Next.js 15 静态导出的系统化备考站点，覆盖证券从业、基金从业、法律职业资格考试。
Apple 设计语言 × Liquid Glass 视觉体验，让备考这件事也有点讲究。

[![Deploy to GitHub Pages](https://github.com/laihaibo/meta-cert/actions/workflows/deploy.yml/badge.svg)](https://github.com/laihaibo/meta-cert/actions/workflows/deploy.yml)
[![GitHub Stars](https://img.shields.io/github/stars/laihaibo/meta-cert?style=social)](https://github.com/laihaibo/meta-cert/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-1558d6?logo=open-source-initiative&logoColor=white)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ff69b4.svg)](https://github.com/laihaibo/meta-cert/pulls)

[🌐 在线访问](https://laihaibo.github.io/meta-cert/) · [🚀 快速开始](#-快速开始) · [📚 考试科目](#-已覆盖考试) · [🤝 参与贡献](#-参与贡献) · [📢 提 Issue](https://github.com/laihaibo/meta-cert/issues)

| 📖 **222+** 章节 | 📝 **1100+** 题目 | 🎯 **23** 门科目 | ⚡ **100%** 静态导出 |
|:---:|:---:|:---:|:---:|

<!-- 🖼️ 界面预览：截图放入 docs/ 目录后取消注释即可
<p>
  <img src="docs/preview-home.png" width="820" alt="首页" />
  <br/>
  <img src="docs/preview-quiz.png" width="400" alt="智能题库" />
  <img src="docs/preview-progress.png" width="400" alt="学习进度" />
</p>
-->

</div>

---

## 📖 目录

- [✨ 特性](#-特性)
- [📚 已覆盖考试](#-已覆盖考试)
- [🚀 快速开始](#-快速开始)
- [🧱 技术栈](#-技术栈)
- [📁 项目结构](#-项目结构)
- [⚙️ 内容管线](#️-内容管线)
- [🌐 部署](#-部署)
- [🗺️ Roadmap](#️-roadmap)
- [🤝 参与贡献](#-参与贡献)
- [⭐ 支持](#-支持)
- [📄 许可证](#-许可证)

## ✨ 特性

- 📖 **系统学习** — 按章节组织知识点，分值占比与重点标记，侧栏目录 + 页内 TOC 跟随高亮
- 📝 **智能题库** — 章节筛选、收藏、错题本回顾、键盘作答（A–D 选择 / ↵ 提交 / ←→ 切题）、答题即时解析
- 📊 **学习进度** — 答题记录自动汇总，各科正确率环形图、薄弱章节提示，数据全部保存在本机
- 🔍 **全文检索** — Pagefind 构建期索引，⌘K 唤起，支持中文检索全部页面
- 🌗 **明暗双主题** — 跟随系统并可手动切换，图表按主题重绘
- ⚡ **静态导出** — 构建期预渲染全部 HTML，正文零运行时解析；每页独立 meta/OG、sitemap、JSON-LD

## 📚 已覆盖考试

### 证券从业资格

| 科目 | 内容 |
|------|------|
| [证券市场基本法律法规](https://laihaibo.github.io/meta-cert/securities/laws/) | 法律法规、业务规范、违法违规行为 |
| [金融市场基础知识](https://laihaibo.github.io/meta-cert/securities/fundamentals/) | 金融市场体系、股票债券、风险管理 |

### 基金从业资格

| 科目 | 内容 |
|------|------|
| [基金法律法规](https://laihaibo.github.io/meta-cert/fund/laws/) | 基金监管、职业道德、销售规范 |
| [证券投资基金基础知识](https://laihaibo.github.io/meta-cert/fund/basics/) | 投资管理、资产配置、业绩评价 |
| [私募股权投资基金](https://laihaibo.github.io/meta-cert/fund/pe/) | 基金募集、投资、退出 |

### 法律职业资格考试（客观题）

- **卷一 · 公法**（9 科）：法治思想、法理学、宪法、中国法律史、国际法、司法制度和法律职业道德、刑法、刑事诉讼法、行政法与行政诉讼法
- **卷二 · 私法**（9 科）：民法、知识产权法、商法、经济法、环境资源法、劳动与社会保障法、国际私法、国际经济法、民事诉讼法

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/) >= 11.5.3

### 三步跑起来

```bash
# 1. 克隆仓库
git clone https://github.com/laihaibo/meta-cert.git
cd meta-cert

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器（自动先跑内容管线）
pnpm run dev
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm run dev` | 内容管线 + Next.js 开发服务器 |
| `pnpm run build` | 内容管线 + 静态导出 + Pagefind 搜索索引（产出 `out/`） |
| `pnpm run start` | 预览生产构建 |
| `pnpm run content` | 仅重建内容管线（markdown → JSON） |
| `pnpm run search` | 仅重建 Pagefind 搜索索引 |

## 🧱 技术栈

| 分层 | 技术 |
|------|------|
| 框架 | Next.js 15（App Router · `output: export`）· React 19 · TypeScript |
| 设计 | Tailwind CSS 4 · Apple 风格 Design Tokens · Liquid Glass 玻璃拟态 |
| 内容 | unified / remark / rehype 管线 · KaTeX 公式 · Mermaid 图表 · gray-matter |
| 检索 | Pagefind 构建期索引 |
| 部署 | GitHub Pages · GitHub Actions CI/CD |

## 📁 项目结构

```
app/                        # Next.js App Router
├── layout.tsx              # 全局外壳（导航/页脚/主题/环境光）
├── page.tsx                # 首页
├── progress/page.tsx       # 学习进度页
├── [[...slug]]/page.tsx    # 内容页路由（章节/题库/总结/概述）
├── not-found.tsx           # 404
├── sitemap.ts / robots.ts  # SEO
└── globals.css             # 设计系统（Apple 风格 tokens + Liquid Glass）

content/                    # markdown 内容源
├── shared/quiz-schema.json # 题库 JSON Schema
├── securities/             # 证券从业
├── fund/                   # 基金从业
└── law/                    # 法律职业资格考试（public 卷一 / private 卷二）

components/                 # Quiz、ProgressDashboard、GlassNav、SearchDialog、Toc 等
lib/                        # 内容加载、学习进度 store、站点常量
scripts/build-content.mjs   # 内容管线：markdown → JSON（HTML/TOC/元数据）+ manifest
content-data/               # 管线产物（构建时生成，已 gitignore）
```

## ⚙️ 内容管线

`scripts/build-content.mjs` 在构建期把全部 markdown 编译为 JSON，站点运行时零 markdown 解析：

- `::: tip / warning / danger` 容器 → 玻璃样式 callout
- ` ```mermaid ` 围栏 → 客户端水合占位（仅图表页动态加载 mermaid）
- LaTeX 公式 → KaTeX HTML
- 内链统一改写为带 `/meta-cert` 前缀的站点绝对路径
- 产出每页 HTML + TOC + 摘要 + 上下篇，及全站 manifest（导航 / sitemap / 静态化参数共用）

## 🌐 部署

推送到 `main` 分支即触发 [GitHub Actions](https://github.com/laihaibo/meta-cert/actions/workflows/deploy.yml) 自动构建并部署到 GitHub Pages。

**在线访问：** <https://laihaibo.github.io/meta-cert/>

### 手动部署

```bash
pnpm run build
# 产出目录：out/（含 pagefind 搜索索引，.nojekyll 已内置）
```

### 其他平台

| 平台 | 构建命令 | 输出目录 |
|------|----------|----------|
| Vercel | `pnpm run build` | `out`（注意按需调整 `next.config.ts` 中的 `basePath`） |
| Netlify | `pnpm run build` | `out` |

## 🗺️ Roadmap

- [ ] 🎯 模拟考试模式 — 限时组卷、成绩报告
- [ ] 🔄 学习数据导入导出 / 多设备同步
- [ ] 📱 PWA 离线访问
- [ ] 📦 更多考试科目（银行从业、证券投顾、经济师……）
- [ ] 🛠️ 题库贡献工具 — 在线校验 `quiz.json`
- [ ] 🌍 英文界面

> 有想加的功能？欢迎[提 Issue](https://github.com/laihaibo/meta-cert/issues) 或直接动手 PR。

## 🤝 参与贡献

欢迎一切形式的贡献：补充题库、勘误内容、修复 Bug、改进设计都算！提 PR 前可以先开 Issue 讨论一下。

1. **Fork** 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'feat: add some amazing feature'`（遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)）
4. 推送分支：`git push origin feature/amazing-feature`
5. 发起 **Pull Request**

### 添加新科目

1. 在 `scripts/build-content.mjs` 的 `EXAMS` 中登记科目（目录路径与名称）
2. 创建目录：`content/{exam}/{subject}/`，章节文件 `index.md`、`ch01.md` ~ `chNN.md`、`summary.md`、`quiz.md`
3. 创建题库：`quiz.json`（遵循 `content/shared/quiz-schema.json`）
4. 运行 `pnpm run dev` 验证 —— 导航、侧栏、首页卡片、sitemap 均由 manifest 自动生成
5. 可选 frontmatter：`title`（默认取首个 h1）、`weight`（分值占比）、`is_key`（重点章节）

### 报告问题

发现 Bug 或有功能建议，请 [开一个 Issue](https://github.com/laihaibo/meta-cert/issues)，附上复现步骤或截图会更高效。

## ⭐ 支持

如果这个项目帮到了你的备考，或者你觉得它做得不错 —— **给个 Star ⭐ 就是最大的鼓励**，也欢迎分享给正在备考的朋友。

<a href="https://api.star-history.com/svg?repos=laihaibo/meta-cert&type=Date">
 <img src="https://api.star-history.com/svg?repos=laihaibo/meta-cert&type=Date" alt="Star History Chart" width="600" />
</a>

## 🙏 致谢

本项目的体验离不开这些优秀的开源项目：[Next.js](https://nextjs.org/) · [React](https://react.dev/) · [Tailwind CSS](https://tailwindcss.com/) · [Pagefind](https://pagefind.app/) · [KaTeX](https://katex.org/) · [Mermaid](https://mermaid.js.org/)

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源。

```
MIT License — Copyright (c) 2026 laihaibo
```

---

<div align="center">

**Meta Cert** · 用工程的方式备考

</div>
