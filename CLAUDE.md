# Meta Cert — 项目开发指南

## 项目概述

Meta Cert 是一个基于 VitePress 的多元从业资格学习平台，包含证券从业、基金从业、法律职业资格考试的系统学习内容和智能题库。

## 技术栈

- **框架**: VitePress (Vue 3 + Vite)
- **语言**: TypeScript / Vue 3 SFC
- **包管理**: pnpm
- **部署**: 静态站点（GitHub Pages / Vercel / Netlify）

## 开发命令

```bash
pnpm install          # 安装依赖
pnpm run dev          # 启动开发服务器（http://localhost:5173）
pnpm run build        # 构建生产版本
pnpm run preview      # 预览构建结果
```

## 目录结构

```
docs/
├── index.md                    # 首页
├── progress.md                 # 学习进度页
├── .vitepress/
│   ├── config.ts               # 站点配置（导航、sidebar、描述）
│   └── theme/
│       ├── index.ts            # 主题入口，全局注册组件
│       ├── custom.css          # 自定义样式
│       └── components/
│           └── Quiz.vue        # 题库组件
├── shared/
│   └── quiz-schema.json        # 题库 JSON Schema 定义
├── securities/                 # 证券从业
│   ├── laws/                   # 证券市场基本法律法规
│   ├── fundamentals/           # 金融市场基础知识
│   └── basics/                 # 金融市场基础知识（备用路径）
├── fund/                       # 基金从业
│   ├── laws/                   # 基金法律法规
│   ├── basics/                 # 证券投资基金基础知识
│   └── pe/                     # 私募股权投资基金
└── law/                        # 法律职业资格考试
    ├── index.md                # 法考概述页
    ├── public/                 # 卷一·公法（9科）
    └── private/                # 卷二·私法（9科）
```

## 内容编写规范

### 知识点页面

每个章节页面使用 Markdown 编写，结构为：
- 章节标题（h2）
- 知识点分节（h3）
- 高频考点使用 `::: tip` 或 `::: warning` 标注

### 题库文件 (quiz.json)

- 遵循 `docs/shared/quiz-schema.json` 定义的格式
- `answer` 字段为字符串类型，值为 "A"、"B"、"C"、"D"
- `id` 格式为 `{subject}-{number}`，如 `laws-001`
- JSON 中的引号需要正确转义（使用 `\"`）
- 验证命令：`python3 -c "import json; json.load(open('path/to/quiz.json'))"`

### 题库页面 (quiz.md)

使用 Quiz 组件加载同目录下的 quiz.json：

```markdown
# 题库练习 - 科目名称

<Quiz dataUrl="./quiz.json" />
```

Quiz 组件已在 theme/index.ts 中全局注册，quiz.md 中无需 import。

## 添加新科目步骤

1. 创建目录：`docs/{exam}/{subject}/`
2. 创建 `index.md`（概述页）
3. 创建 `ch01.md` ~ `chNN.md`（各章节）
4. 创建 `quiz.json`（题库，遵循 quiz-schema.json）
5. 创建 `quiz.md`（题库页面，使用 `<Quiz>` 组件）
6. 创建 `summary.md`（总结与速查）
7. 更新 `docs/.vitepress/config.ts`：添加 sidebar 和导航配置
8. 更新 `docs/index.md`：添加入口卡片
9. 运行 `pnpm run build` 验证

## 注意事项

- `.vitepress/config.ts` 中 `ignoreDeadLinks: true` — 新增页面前确保链接正确
- Quiz.vue 的 `answer` 字段是字符串类型（"A"/"B"/"C"/"D"），不是数字
- sidebar 配置较长是正常的（VitePress 惯例），每科独立配置
