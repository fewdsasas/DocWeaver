export const PROJECT_TYPE_TEMPLATES: Record<
  string,
  {
    focus: string;
    header: string;
    features: string;
    requiredSections: string[];
    visualNotes: string;
  }
> = {
  'UI 组件库': {
    focus: '组件列表、在线预览、主题定制、浏览器兼容',
    header: `<div align="center">
  <img width="200" src="logo.png" alt="Logo">
  <h1>{{NAME}}</h1>
  <p>基于 [框架] 的 [定位] 组件库，提供 [数量]+ 高质量组件</p>
  
  [![npm version](https://img.shields.io/npm/v/xxx.svg)](链接)
  [![license](https://img.shields.io/badge/license-GPL%20v3-blue.svg)](链接)
  [![downloads](https://img.shields.io/npm/dm/xxx.svg)](链接)
  
  [文档](链接) | [在线预览](链接) | [更新日志](链接)
</div>`,
    features: `| 分类 | 组件 |
|------|------|
| 基础 | Button、Input、Select、Checkbox、Radio |
| 导航 | Menu、Tabs、Breadcrumb、Dropdown |
| 反馈 | Dialog、Toast、Loading、Message |
| 数据展示 | Table、Tree、Pagination、Tag |
| 高级 | Transfer、Virtual List、Draggable |`,
    requiredSections: [
      '浏览器兼容 - 明确支持哪些浏览器和版本',
      '主题定制 - 展示如何修改主题色和样式变量',
      '按需引入 - 说明如何减小打包体积',
      '在线预览 - 必须提供可交互的 Demo 地址',
    ],
    visualNotes:
      '组件截图至少 4 张，覆盖不同分类。如有暗黑模式，展示明暗对比图。可用 GIF 展示交互动画。',
  },

  '框架/引擎': {
    focus: '设计理念、架构图、快速上手、性能对比',
    header: `<div align="center">
  <img src="logo.png" alt="Logo" width="120">
  <h1>{{NAME}}</h1>
  <p>一句话定位，点明核心设计理念和目标场景</p>
</div>

> 设计哲学引用，如："Write Once, Run Anywhere"

**[English](README.en.md) | 简体中文**`,
    features: `- **跨平台**：一套代码，运行在 Web / 小程序 / App / 鸿蒙
- **渐进式**：可以只引入核心，按需扩展功能模块
- **高性能**：编译时优化，运行时零依赖，体积仅 [X]KB
- **生态丰富**：官方维护 [数量]+ 插件，社区活跃`,
    requiredSections: [
      '架构设计 - 架构图（ASCII art或图片）+ 核心模块说明',
      '与其他方案的对比 - 简明对比表格',
      '快速开始 - 从安装到 Hello World 控制在 5 步以内',
      '升级指南 - 主版本迁移说明',
    ],
    visualNotes:
      '需要架构图或模块关系图（ASCII art 或 Mermaid）。性能对比图表。生态图（插件/适配器全景图）。',
  },

  'CMS/后台系统': {
    focus: '功能截图、技术栈、部署指南、系统要求',
    header: `<div align="center">
  <img width="100" src="logo.png" alt="Logo">
  <h1>{{NAME}}</h1>
  <p>一款 [定位] 的 [类型] 系统，支持 [核心卖点]</p>
  
  [![版本](https://img.shields.io/badge/version-{{VERSION}}-blue)](链接)
  [![许可证](https://img.shields.io/badge/license-GPL%20v3-green)](链接)
  
  [在线演示](链接) | [文档](链接) | Demo 账号: admin/admin123
</div>`,
    features: `### 内容管理
- 文章发布 / 编辑 / 审核，支持 Markdown 和富文本
- 分类管理、标签系统、SEO 优化
- 多站点支持，独立域名绑定

### 用户与权限
- RBAC 权限模型，支持部门 / 角色自定义
- 第三方登录（微信 / GitHub / LDAP）
- 操作日志与审计追踪

### 扩展能力
- 插件系统，支持热插拔功能模块
- 主题模板，支持自定义前端界面
- RESTful API，方便二次开发`,
    requiredSections: [
      '系统要求 - 环境版本、硬件最低要求',
      '部署指南 - Docker / 手动部署两种方式',
      'Demo 账号 - 提供测试账号和密码',
      '截图 - 后台管理界面的实际截图，至少 3 张',
    ],
    visualNotes: '大尺寸后台截图（展示实际使用界面）。系统架构图。前后端分离则展示双端截图。',
  },

  工具类: {
    focus: 'GIF 演示、使用场景、对比优势、轻量化',
    header: `<div align="center">
  <img alt="{{NAME}}" width="100" src="logo.png">
  <h1>{{NAME}}</h1>
  <p>[核心卖点] 的 [工具定位]，[一句话说明优势]</p>
</div>`,
    features: `### 场景一：[使用场景描述]
- 功能点描述
- 功能点描述

### 场景二：[使用场景描述]
- 功能点描述
- 功能点描述

### 通用能力
- 功能点描述
- 功能点描述`,
    requiredSections: [
      '使用场景 - 具体说明在什么情况下需要这个工具',
      '与其他工具的对比 - 简明对比表格',
      '下载/安装 - 多种安装方式（包管理器/直接下载/Docker）',
      'GIF 演示 - 展示核心操作流程',
    ],
    visualNotes:
      'GIF 是刚需 - 工具类项目 GIF 的说服力远超文字。对比截图（使用前 vs 使用后）。界面截图。',
  },

  'AI/数据产品': {
    focus: '效果截图、模型说明、应用场景、数据隐私',
    header: `<p align="center">
  <a href="官网" target="_blank">
    <img src="cover.png" alt="{{NAME}}" />
  </a>
</p>
<p align="center">
  <strong>{{NAME}}</strong> - AI 驱动的 [定位描述]
</p>`,
    features: `- **AI 智能 [能力]**：基于 [模型] 实现 [效果]，准确率达 [X]%
- **[能力二]**：[具体说明]
- **[能力三]**：[具体说明]
- **隐私安全**：[数据是否本地处理等说明]`,
    requiredSections: [
      '支持的数据源/模型 - 列出支持的数据库、AI 模型等',
      '效果展示 - 实际使用效果的截图或录屏',
      '模型配置 - 如何切换或配置 AI 模型',
      '数据隐私 - 说明数据是否上云、如何保护隐私',
    ],
    visualNotes: '产品封面大图（居中）。AI 交互效果截图或录屏。支持能力表格。',
  },

  学习资源: {
    focus: '目录结构、学习路径、社区链接、持续更新',
    header: `[![Banner](banner.png)](主页链接)

# {{NAME}}

> 一句引用或项目愿景，如：
> "What I cannot create, I do not understand" - Richard Feynman

[简要说明：这个项目包含什么，适合谁，如何使用]`,
    features: `### [分类一]
- [子项目链接](链接) - 简要说明
- [子项目链接](链接) - 简要说明

### [分类二]
- [子项目链接](链接) - 简要说明`,
    requiredSections: [
      '目录/TOC - 资源类项目必须有完整的目录导航',
      '如何使用 - 说明学习路径或推荐顺序',
      '贡献指南 - 资源类项目高度依赖社区贡献',
      '许可证 - 标注每个子资源的许可情况',
    ],
    visualNotes:
      'Banner 图（展示项目氛围）。统计徽章（Star、贡献者、子项目数）。最小化 HTML，以纯 Markdown 列表为主。',
  },
};

export const COMMON_TEMPLATE = `<div align="center">
  <img src="{{LOGO_URL}}" alt="Logo" width="100">
  <h1>{{PROJECT_NAME}}</h1>
  <p>{{ONE_LINE_DESCRIPTION}}</p>
  
  [![版本]({{BADGE_VERSION}})]({{LINK_VERSION}})
  [![许可证]({{BADGE_LICENSE}})]({{LINK_LICENSE}})
  [![构建]({{BADGE_BUILD}})]({{LINK_BUILD}})
  
  [文档]({{LINK_DOCS}}) | [在线演示]({{LINK_DEMO}}) | [常见问题]({{LINK_FAQ}})
</div>

---

## 功能特性

- **{{FEATURE_1_TITLE}}**：{{FEATURE_1_DESC}}
- **{{FEATURE_2_TITLE}}**：{{FEATURE_2_DESC}}
- **{{FEATURE_3_TITLE}}**：{{FEATURE_3_DESC}}

## 截图

{{SCREENSHOT_OR_GIF}}

## 快速开始

### 前置条件

{{PREREQUISITES}}

### 安装

\`\`\`bash
{{INSTALL_COMMANDS}}
\`\`\`

### 使用

{{USAGE_EXAMPLE}}

## 技术栈

{{TECH_STACK}}

## 参与贡献

欢迎贡献！请阅读 [贡献指南](CONTRIBUTING.md)。

## 许可证

[{{LICENSE_TYPE}}]({{LICENSE_FILE}})
`;

export const README_WRITER_RULES = {
  corePrinciples: [
    '快速理解：让访客 5 秒内知道这是什么、有什么用',
    '降低门槛：清晰的安装步骤和在线 Demo，让用户快速上手',
    '建立信任：徽章、截图、许可证、活跃社区，传递项目质量信号',
  ],
  requiredSections: [
    '1. Logo/Banner（居中）',
    '2. 项目名称 + 一句话描述（15-40字）',
    '3. 徽章行（3-8个 shields.io）',
    '4. 导航链接（官网 | 文档 | Demo | 常见问题）',
    '5. 功能特性（加粗关键词 + 简短说明，功能>10个时用表格）',
    '6. 截图/GIF（UI类≥4张，工具类必须有GIF）',
    '7. 快速开始（前置条件 + 安装 + 使用示例）',
    '8. 贡献指南',
    '9. 致谢/赞助商',
    '10. 许可证',
  ],
  optionalSections: [
    '目录 (TOC) - 文档超过 150 行时添加',
    '技术栈 - 非显而易见的技术选型',
    '架构设计 - 复杂系统或多模块项目',
    '配置说明 - 有较多配置项时',
    '部署指南 - 需要生产环境部署时',
    '常见问题 (FAQ) - 有高频问题需提前解答时（注意放在文档后半部，不要放开头）',
    '更新日志 - 用户提供时加入',
  ],
  badgeGuide: {
    required: '版本号、许可证、语言',
    recommended: '构建状态、Star 数',
    optional: '测试覆盖率、下载量、Discord 在线',
  },
  writingStyle: {
    oneLiner: '15-40字，必须回答：它是什么（技术定位）、解决什么问题（核心价值）',
    goodExample: '"开源、精美、便捷的数据可视化低代码开发平台"',
    badExample: '"使用 Rust 编写的跨平台工具"（没说做什么）',
    features: '使用加粗关键词 + 简短说明的列表格式，每个特性不超过一行',
  },
  commonMistakes: [
    '不要在开头写 FAQ 或常见问题（用户还没了解项目就被劝退）',
    '不要堆砌纯技术名词而缺少通俗解释',
    '不要没有截图就发布（至少 1 张，UI类至少2张）',
    '安装步骤不要遗漏前置条件（列出环境和版本要求）',
    '工具类项目不要缺少 Demo 链接（用户需克隆才能体验）',
    '徽章不要超过 10 个（视觉杂乱，精选最重要的 3-8 个）',
  ],
  disclaimer: `> 🤖 本文档由 AI 辅助生成，内容仅供参考，请以实际代码为准。
> 如发现文档与代码不符，欢迎提交 Issue 或 PR 帮助我们改进。`,
};
