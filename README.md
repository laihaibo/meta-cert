# Meta Cert

[![Deploy to GitHub Pages](https://github.com/laihaibo/meta-cert/actions/workflows/deploy.yml/badge.svg)](https://github.com/laihaibo/meta-cert/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 多元从业资格学习平台 — 基于 VitePress 构建的系统化备考站点，覆盖证券从业、基金从业、法律职业资格考试。

## ✨ 功能特性

- 📖 **系统学习** — 按章节组织知识点，覆盖考试大纲全部内容
- 📝 **智能题库** — 按章节练习，高频考点标记，答题后即时解析
- 📊 **学习进度** — 可视化学习进度追踪，掌握薄弱环节
- 🧠 **思维导图** — 各科总结页提供思维导图和速查表

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

# 启动开发服务器（http://localhost:5173）
pnpm run dev

# 构建生产版本
pnpm run build

# 预览构建结果
pnpm run preview
```

## 📁 项目结构

```
docs/
├── index.md                    # 首页
├── progress.md                 # 学习进度页
├── .vitepress/
│   ├── config.ts               # VitePress 配置
│   └── theme/
│       ├── index.ts            # 主题入口
│       ├── custom.css          # 自定义样式
│       └── components/
│           └── Quiz.vue        # 题库组件
├── shared/
│   └── quiz-schema.json        # 题库 JSON Schema
├── securities/                 # 证券从业
│   ├── laws/                   # 证券市场基本法律法规
│   └── fundamentals/           # 金融市场基础知识
├── fund/                       # 基金从业
│   ├── laws/                   # 基金法律法规
│   ├── basics/                 # 证券投资基金基础知识
│   └── pe/                     # 私募股权投资基金
└── law/                        # 法律职业资格考试
    ├── public/                 # 卷一·公法（9 科）
    └── private/                # 卷二·私法（9 科）
```

## 🌐 部署

本项目通过 GitHub Actions 自动部署到 GitHub Pages。推送到 `main` 分支后会自动触发构建和部署。

**在线访问：** [https://laihaibo.github.io/meta-cert/](https://laihaibo.github.io/meta-cert/)

### 手动部署

```bash
pnpm run build
# 产出目录：docs/.vitepress/dist/
```

### 其他平台

| 平台 | 构建命令 | 输出目录 |
|------|----------|----------|
| Vercel | `pnpm run build` | `docs/.vitepress/dist` |
| Netlify | `pnpm run build` | `docs/.vitepress/dist` |

## 🤝 贡献

欢迎贡献！你可以通过以下方式参与：

1. **Fork** 本仓库
2. 创建你的特性分支：`git checkout -b feature/amazing-feature`
3. 提交你的更改：`git commit -m 'Add some amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 打开一个 **Pull Request**

### 添加新科目

1. 创建目录：`docs/{exam}/{subject}/`
2. 创建章节文件：`index.md`、`ch01.md` ~ `chNN.md`
3. 创建题库：`quiz.json`（遵循 `docs/shared/quiz-schema.json`）
4. 创建题库页面：`quiz.md`（使用 `<Quiz>` 组件）
5. 更新 `docs/.vitepress/config.ts`：添加 sidebar 和导航配置
6. 更新 `docs/index.md`：添加入口卡片
7. 运行 `pnpm run build` 验证

### 报告问题

如果你发现了 bug 或有功能建议，请 [开一个 Issue](https://github.com/laihaibo/meta-cert/issues)。

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源。

```
MIT License — Copyright (c) 2026 laihaibo
```
