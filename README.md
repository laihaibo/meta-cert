# Meta Cert

多元从业资格学习平台，基于 VitePress 构建的静态学习站点。

## 功能特性

- **系统学习** — 按章节组织知识点，覆盖考试大纲全部内容
- **智能题库** — 按章节练习，高频考点标记，答题后即时解析
- **学习进度** — 可视化学习进度追踪，掌握薄弱环节
- **思维导图** — 各科总结页提供思维导图和速查表

## 考试科目

### 证券从业资格
- 证券市场基本法律法规
- 金融市场基础知识

### 基金从业资格
- 基金法律法规
- 证券投资基金基础知识
- 私募股权投资基金

### 法律职业资格考试（客观题）
- **卷一·公法**：法治思想、法理学、宪法、中国法律史、国际法、司法制度和法律职业道德、刑法、刑事诉讼法、行政法与行政诉讼法
- **卷二·私法**：民法、知识产权法、商法、经济法、环境资源法、劳动与社会保障法、国际私法、国际经济法、民事诉讼法

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 构建生产版本
pnpm run build

# 预览构建结果
pnpm run preview
```

## 项目结构

```
docs/
├── index.md                    # 首页
├── .vitepress/
│   ├── config.ts               # VitePress 配置
│   └── theme/
│       ├── index.ts            # 主题入口
│       └── components/
│           └── Quiz.vue        # 题库组件
├── shared/
│   └── quiz-schema.json        # 题库 JSON Schema
├── securities/                 # 证券从业
│   ├── laws/                   # 证券市场基本法律法规
│   ├── fundamentals/           # 金融市场基础知识
│   └── basics/                 # 金融市场基础知识（别名）
├── fund/                       # 基金从业
│   ├── laws/                   # 基金法律法规
│   ├── basics/                 # 证券投资基金基础知识
│   └── pe/                     # 私募股权投资基金
└── law/                        # 法律职业资格考试
    ├── public/                 # 卷一·公法
    └── private/                # 卷二·私法
```

## 部署

本项目使用 VitePress 构建静态站点，支持部署到任何静态托管平台。

```bash
# 构建
pnpm run build

# 产出目录为 docs/.vitepress/dist/
```

### GitHub Pages

在仓库 Settings > Pages 中配置 Source 为 GitHub Actions，或使用以下 workflow：

```yaml
- name: Build
  run: pnpm run build

- name: Deploy
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: docs/.vitepress/dist
```

### Vercel / Netlify

- 构建命令：`pnpm run build`
- 输出目录：`docs/.vitepress/dist`

## 许可证

MIT
