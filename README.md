# Meta Cert

[![Deploy to GitHub Pages](https://github.com/laihaibo/meta-cert/actions/workflows/deploy.yml/badge.svg)](https://github.com/laihaibo/meta-cert/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 多元从业资格学习平台 — 基于 Next.js 的系统化备考站点，覆盖证券从业、基金从业、法律职业资格考试。Apple 风格设计 + Liquid Glass 视觉语言。

## ✨ 功能特性

- 📖 **系统学习** — 按章节组织知识点，分值占比与重点标记，侧栏目录 + 页内 TOC 跟随高亮
- 📝 **智能题库** — 章节筛选、收藏、错题本回顾、键盘作答（A–D 选择 / ↵ 提交 / ←→ 切题）、答题即时解析
- 📊 **学习进度** — 答题记录自动汇总，各科正确率环形图、薄弱章节提示，数据保存在本机
- 🔍 **全文检索** — Pagefind 构建期索引，⌘K 唤起，支持中文检索全部页面
- 🌗 **明暗双主题** — 跟随系统并可手动切换，图表按主题重绘
- ⚡ **静态导出** — 构建期预渲染全部 HTML，正文零运行时解析；每页独立 meta/OG、sitemap、JSON-LD

## 📚 考试科目

### 证券从业资格
| 科目 | 说明 |
|------|------|
| [证券市场基本法律法规](https://laihaibo.github.io/meta-cert/securities/laws/) | 法律法规、业务规范、违法违规行为 |
| [金融市场基础知识](https://laihaibo.github.io/meta-cert/securities/fundamentals/) | 金融市场体系、股票债券、风险管理 |

### 基金从业资格
| 科目 | 说明 |
|------|------|
| [基金法律法规](https://laihaibo.github.io/meta-cert/fund/laws/) | 基金监管、职业道德、销售规范 |
| [证券投资基金基础知识](https://laihaibo.github.io/meta-cert/fund/basics/) | 投资管理、资产配置、业绩评价 |
| [私募股权投资基金](https://laihaibo.github.io/meta-cert/fund/pe/) | 基金募集、投资、退出 |

### 法律职业资格考试（客观题）
- **卷一·公法**（9 科）：法治思想、法理学、宪法、中国法律史、国际法、司法制度和法律职业道德、刑法、刑事诉讼法、行政法与行政诉讼法
- **卷二·私法**（9 科）：民法、知识产权法、商法、经济法、环境资源法、劳动与社会保障法、国际私法、国际经济法、民事诉讼法

## 🚀 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/) >= 11.5.3

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/laihaibo/meta-cert.git
cd meta-cert

# 安装依赖
pnpm install

# 启动开发服务器（自动先跑内容管线）
pnpm run dev

# 构建生产版本（内容管线 + Next.js 静态导出 + Pagefind 搜索索引）
pnpm run build
```

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

### 内容管线

`scripts/build-content.mjs` 在构建期把全部 markdown 编译为 JSON：

- `::: tip / warning / danger` 容器 → 玻璃样式 callout
- ` ```mermaid ` 围栏 → 客户端水合占位（仅图表页动态加载 mermaid）
- LaTeX 公式 → KaTeX HTML
- 内链统一改写为带 `/meta-cert` 前缀的站点绝对路径
- 产出每页 HTML + TOC + 摘要 + 上下篇，及全站 manifest（导航/sitemap/静态化参数共用）

## 🌐 部署

本项目通过 GitHub Actions 自动部署到 GitHub Pages。推送到 `main` 分支后会自动触发构建和部署。

**在线访问：** [https://laihaibo.github.io/meta-cert/](https://laihaibo.github.io/meta-cert/)

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

## 🤝 贡献

欢迎贡献！你可以通过以下方式参与：

1. **Fork** 本仓库
2. 创建你的特性分支：`git checkout -b feature/amazing-feature`
3. 提交你的更改：`git commit -m 'Add some amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 打开一个 **Pull Request**

### 添加新科目

1. 在 `scripts/build-content.mjs` 的 `EXAMS` 中登记科目（目录路径与名称）
2. 创建目录：`content/{exam}/{subject}/`，章节文件 `index.md`、`ch01.md` ~ `chNN.md`、`summary.md`、`quiz.md`
3. 创建题库：`quiz.json`（遵循 `content/shared/quiz-schema.json`）
4. 运行 `pnpm run dev` 验证 —— 导航、侧栏、首页卡片、sitemap 均由 manifest 自动生成
5. 可选 frontmatter：`title`（默认取首个 h1）、`weight`（分值占比）、`is_key`（重点章节）

### 报告问题

如果你发现了 bug 或有功能建议，请 [开一个 Issue](https://github.com/laihaibo/meta-cert/issues)。

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源。

```
MIT License — Copyright (c) 2026 laihaibo
```
