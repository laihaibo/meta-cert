import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Meta Cert',
  description: '多元从业资格学习平台',
  lang: 'zh-CN',
  base: '/meta-cert/',
  head: [
    ['script', { src: 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js' }]
  ],
  // Ignore dead links until all chapter pages are created by other workers
  ignoreDeadLinks: true,
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: '首页', link: '/' },
      { text: '学习进度', link: '/progress' },
      {
        text: '证券从业',
        items: [
          { text: '证券市场基本法律法规', link: '/securities/laws/' },
          { text: '金融市场基础知识', link: '/securities/fundamentals/' },
        ]
      },
      {
        text: '基金从业',
        items: [
          { text: '基金法律法规', link: '/fund/laws/' },
          { text: '证券投资基金基础知识', link: '/fund/basics/' },
          { text: '私募股权投资基金', link: '/fund/pe/' },
        ]
      },
      {
        text: '法考',
        items: [
          {
            text: '卷一·公法',
            items: [
              { text: '法治思想', link: '/law/public/rule-of-law/' },
              { text: '法理学', link: '/law/public/jurisprudence/' },
              { text: '宪法', link: '/law/public/constitution/' },
              { text: '中国法律史', link: '/law/public/legal-history/' },
              { text: '国际法', link: '/law/public/international/' },
              { text: '司法制度和法律职业道德', link: '/law/public/judicial-ethics/' },
              { text: '刑法', link: '/law/public/criminal/' },
              { text: '刑事诉讼法', link: '/law/public/criminal-procedure/' },
              { text: '行政法与行政诉讼法', link: '/law/public/administrative/' },
            ]
          },
          {
            text: '卷二·私法',
            items: [
              { text: '民法', link: '/law/private/civil/' },
              { text: '知识产权法', link: '/law/private/ip/' },
              { text: '商法', link: '/law/private/commercial/' },
              { text: '经济法', link: '/law/private/economic/' },
              { text: '环境资源法', link: '/law/private/environment/' },
              { text: '劳动与社会保障法', link: '/law/private/labor/' },
              { text: '国际私法', link: '/law/private/private-international/' },
              { text: '国际经济法', link: '/law/private/economic-international/' },
              { text: '民事诉讼法', link: '/law/private/civil-procedure/' },
            ]
          },
        ]
      },
      {
        text: '软考',
        items: [
          { text: '软件设计师', link: '/softdesigner/' },
        ]
      },
      {
        text: '人工智能训练师',
        link: '/ai-trainer/',
      },
    ],
    sidebar: {
      '/securities/laws/': [
        {
          text: '证券市场基本法律法规',
          items: [
            { text: '概述', link: '/securities/laws/' },
            { text: '第一章 证券市场基本法律法规', link: '/securities/laws/ch01' },
            { text: '第二章 证券经营机构管理规范', link: '/securities/laws/ch02' },
            { text: '第三章 证券公司业务规范', link: '/securities/laws/ch03' },
            { text: '第四章 典型违法违规行为', link: '/securities/laws/ch04' },
            { text: '第五章 行业文化与职业道德', link: '/securities/laws/ch05' },
            { text: '第六章 投资者适当性管理', link: '/securities/laws/ch06' },
            { text: '总结与速查', link: '/securities/laws/summary' },
            { text: '题库练习', link: '/securities/laws/quiz' },
          ]
        }
      ],
      '/securities/fundamentals/': [
        {
          text: '金融市场基础知识',
          items: [
            { text: '概述', link: '/securities/fundamentals/' },
            { text: '第一章 金融市场体系', link: '/securities/fundamentals/ch01' },
            { text: '第二章 证券市场主体', link: '/securities/fundamentals/ch02' },
            { text: '第三章 股票市场', link: '/securities/fundamentals/ch03' },
            { text: '第四章 债券市场', link: '/securities/fundamentals/ch04' },
            { text: '第五章 基金与衍生工具', link: '/securities/fundamentals/ch05' },
            { text: '第六章 金融风险管理', link: '/securities/fundamentals/ch06' },
            { text: '第七章 金融创新与监管', link: '/securities/fundamentals/ch07' },
            { text: '总结与速查', link: '/securities/fundamentals/summary' },
            { text: '题库练习', link: '/securities/fundamentals/quiz' },
          ]
        }
      ],
      '/fund/laws/': [
        {
          text: '基金法律法规',
          items: [
            { text: '概述', link: '/fund/laws/' },
            { text: '第一章 金融、资产管理与投资基金', link: '/fund/laws/ch01' },
            { text: '第二章 证券投资基金概述', link: '/fund/laws/ch02' },
            { text: '第三章 证券投资基金的类型', link: '/fund/laws/ch03' },
            { text: '第四章 证券投资基金的监管', link: '/fund/laws/ch04' },
            { text: '第五章 基金职业道德', link: '/fund/laws/ch05' },
            { text: '第六章 基金的募集、交易与登记', link: '/fund/laws/ch06' },
            { text: '第七章 基金的信息披露', link: '/fund/laws/ch07' },
            { text: '第八章 基金客户和销售机构', link: '/fund/laws/ch08' },
            { text: '第九章 基金销售行为规范', link: '/fund/laws/ch09' },
            { text: '第十章 基金销售适用性', link: '/fund/laws/ch10' },
            { text: '第十一章 基金管理人的内部控制', link: '/fund/laws/ch11' },
            { text: '第十二章 基金管理人的合规管理', link: '/fund/laws/ch12' },
            { text: '总结与速查', link: '/fund/laws/summary' },
            { text: '题库练习', link: '/fund/laws/quiz' },
          ]
        }
      ],
      '/fund/basics/': [
        {
          text: '证券投资基金基础知识',
          items: [
            { text: '概述', link: '/fund/basics/' },
            { text: '第一章 投资管理基础', link: '/fund/basics/ch01' },
            { text: '第二章 权益投资', link: '/fund/basics/ch02' },
            { text: '第三章 固定收益投资', link: '/fund/basics/ch03' },
            { text: '第四章 另类投资', link: '/fund/basics/ch04' },
            { text: '第五章 投资者需求与资产配置', link: '/fund/basics/ch05' },
            { text: '第六章 投资组合管理', link: '/fund/basics/ch06' },
            { text: '第七章 投资交易管理', link: '/fund/basics/ch07' },
            { text: '第八章 投资风险管理', link: '/fund/basics/ch08' },
            { text: '第九章 基金业绩评价', link: '/fund/basics/ch09' },
            { text: '第十章 基金估值、费用与会计', link: '/fund/basics/ch10' },
            { text: '第十一章 基金利润分配与税收', link: '/fund/basics/ch11' },
            { text: '第十二章 基金国际化', link: '/fund/basics/ch12' },
            { text: '第十三章 基金托管', link: '/fund/basics/ch13' },
            { text: '第十四章 基金管理人', link: '/fund/basics/ch14' },
            { text: '第十五章 基金份额持有人', link: '/fund/basics/ch15' },
            { text: '第十六章 基金监管', link: '/fund/basics/ch16' },
            { text: '第十七章 基金职业道德', link: '/fund/basics/ch17' },
            { text: '总结与速查', link: '/fund/basics/summary' },
            { text: '题库练习', link: '/fund/basics/quiz' },
          ]
        }
      ],
      '/fund/pe/': [
        {
          text: '私募股权投资基金',
          items: [
            { text: '概述', link: '/fund/pe/' },
            { text: '第一章 股权投资基金概述', link: '/fund/pe/ch01' },
            { text: '第二章 参与主体', link: '/fund/pe/ch02' },
            { text: '第三章 募集与设立', link: '/fund/pe/ch03' },
            { text: '第四章 投资', link: '/fund/pe/ch04' },
            { text: '第五章 投后管理', link: '/fund/pe/ch05' },
            { text: '第六章 退出', link: '/fund/pe/ch06' },
            { text: '第七章 管理与内控', link: '/fund/pe/ch07' },
            { text: '第八章 行业自律与监管', link: '/fund/pe/ch08' },
            { text: '总结与速查', link: '/fund/pe/summary' },
            { text: '题库练习', link: '/fund/pe/quiz' },
          ]
        }
      ],
      '/softdesigner/': [
        {
          text: '软件设计师',
          items: [
            { text: '概述', link: '/softdesigner/' },
            { text: '第一章 计算机系统基础知识', link: '/softdesigner/ch01' },
            { text: '第二章 程序设计语言基础', link: '/softdesigner/ch02' },
            { text: '第三章 数据结构', link: '/softdesigner/ch03' },
            { text: '第四章 操作系统基础', link: '/softdesigner/ch04' },
            { text: '第五章 软件工程', link: '/softdesigner/ch05' },
            { text: '第六章 面向对象分析与设计', link: '/softdesigner/ch06' },
            { text: '第七章 数据库系统', link: '/softdesigner/ch07' },
            { text: '第八章 信息安全知识', link: '/softdesigner/ch08' },
            { text: '总结与速查', link: '/softdesigner/summary' },
            { text: '题库练习', link: '/softdesigner/quiz' },
          ]
        }
      ],
      '/ai-trainer/': [
        {
          text: '三级/高级工 · 人工智能训练师',
          items: [
            { text: '概述', link: '/ai-trainer/' },
            { text: '第一章 职业道德与法律法规', link: '/ai-trainer/ch01' },
            { text: '第二章 智能训练基础', link: '/ai-trainer/ch02' },
            { text: '第三章 模型训练与调优', link: '/ai-trainer/ch03' },
            { text: '总结与速查', link: '/ai-trainer/summary' },
            { text: '题库练习', link: '/ai-trainer/quiz' },
          ]
        }
      ],
      // 法考 - 卷一·公法
      '/law/public/rule-of-law/': [{ text: '法治思想', items: [{ text: '概述', link: '/law/public/rule-of-law/' }] }],
      '/law/public/jurisprudence/': [{ text: '法理学', items: [{ text: '概述', link: '/law/public/jurisprudence/' }] }],
      '/law/public/constitution/': [{ text: '宪法', items: [{ text: '概述', link: '/law/public/constitution/' }] }],
      '/law/public/legal-history/': [{ text: '中国法律史', items: [{ text: '概述', link: '/law/public/legal-history/' }] }],
      '/law/public/international/': [{ text: '国际法', items: [{ text: '概述', link: '/law/public/international/' }] }],
      '/law/public/judicial-ethics/': [{ text: '司法制度和法律职业道德', items: [{ text: '概述', link: '/law/public/judicial-ethics/' }] }],
      '/law/public/criminal/': [{ text: '刑法', items: [{ text: '概述', link: '/law/public/criminal/' }] }],
      '/law/public/criminal-procedure/': [{ text: '刑事诉讼法', items: [{ text: '概述', link: '/law/public/criminal-procedure/' }] }],
      '/law/public/administrative/': [{ text: '行政法与行政诉讼法', items: [{ text: '概述', link: '/law/public/administrative/' }] }],
      // 法考 - 卷二·私法
      '/law/private/civil/': [{ text: '民法', items: [{ text: '概述', link: '/law/private/civil/' }] }],
      '/law/private/ip/': [{ text: '知识产权法', items: [{ text: '概述', link: '/law/private/ip/' }] }],
      '/law/private/commercial/': [{ text: '商法', items: [{ text: '概述', link: '/law/private/commercial/' }] }],
      '/law/private/economic/': [{ text: '经济法', items: [{ text: '概述', link: '/law/private/economic/' }] }],
      '/law/private/environment/': [{ text: '环境资源法', items: [{ text: '概述', link: '/law/private/environment/' }] }],
      '/law/private/labor/': [{ text: '劳动与社会保障法', items: [{ text: '概述', link: '/law/private/labor/' }] }],
      '/law/private/private-international/': [{ text: '国际私法', items: [{ text: '概述', link: '/law/private/private-international/' }] }],
      '/law/private/economic-international/': [{ text: '国际经济法', items: [{ text: '概述', link: '/law/private/economic-international/' }] }],
      '/law/private/civil-procedure/': [{ text: '民事诉讼法', items: [{ text: '概述', link: '/law/private/civil-procedure/' }] }],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/laihaibo/meta-cert' }
    ],
    footer: {
      message: '多元从业资格学习平台',
      copyright: '© 2026 Meta Cert'
    },
    search: {
      provider: 'local'
    }
  },
  markdown: {
    math: true,
    config(md) {
      // Custom fence renderer for mermaid diagrams
      const defaultRender = md.renderer.rules.fence || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options)
      }
      md.renderer.rules.fence = function (tokens, idx, options, env, self) {
        const token = tokens[idx]
        if (token.info.trim() === 'mermaid') {
          const code = token.content.trim()
          const id = `mermaid-${idx}-${Date.now()}`
          return `<pre class="mermaid" id="${id}">${code}</pre>`
        }
        return defaultRender(tokens, idx, options, env, self)
      }
    }
  }
})
