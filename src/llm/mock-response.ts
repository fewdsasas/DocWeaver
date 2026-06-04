export const MOCK_RESPONSE = `# 项目名称

<div align="center">

<img src="https://via.placeholder.com/100" alt="Logo" width="100">
<h1>DocWeaver</h1>
<p>AI 驱动的代码库文档自动生成与同步 CLI 工具</p>

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-GPL%20v3-green)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-%5E5.0-blue)

[文档](https://github.com/example/docweaver) | [NPM](https://www.npmjs.com/package/docweaver) | [问题反馈](https://github.com/example/docweaver/issues)

</div>

---

<!-- DOCWEAVER_BLOCK_START:project-intro -->
<!-- DOCWEAVER-AUTO-GENERATED: 项目简介 -->
## 项目简介

DocWeaver 是一款面向开发者的 AI-Native 代码库文档自动化工具。只需一条命令，即可将任意代码仓库生成专业的 README.md 文档，让文档与代码同步更新。
<!-- DOCWEAVER-END -->

<!-- DOCWEAVER_BLOCK_START:features -->
<!-- DOCWEAVER-AUTO-GENERATED: 功能特性 -->
## 功能特性

- **🤖 AI 驱动生成**：基于 LLM 自动分析代码库，生成结构化 README
- **🔒 隐私保护**：内置安全防火墙，自动脱敏 API Key、密码等敏感信息
- **🔄 增量更新**：支持 update 命令，保留人工修改内容不被覆盖
- **📝 多语言支持**：识别 Node.js / Go / Rust / Python / Java 等项目类型
- **🏷️ 智能标记**：区块指纹 + 双重锁死机制，确保文档同步安全
- **⚡ 轻量快速**：纯正则解析，无重型依赖，安装包 < 15MB
<!-- DOCWEAVER-END -->

<!-- DOCWEAVER_BLOCK_START:screenshot -->
<!-- DOCWEAVER-AUTO-GENERATED: 截图/GIF -->
## 截图

![Demo GIF](https://via.placeholder.com/800x400?text=DocWeaver+Demo+-+Replace+with+actual+recording)

> 📝 提示：请替换为实际截图或 GIF 演示
<!-- DOCWEAVER-END -->

<!-- DOCWEAVER_BLOCK_START:quick-start -->
<!-- DOCWEAVER-AUTO-GENERATED: 快速开始 -->
## 快速开始

### 前置条件

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### 安装

\`\`\`bash
# 全局安装
npm install -g docweaver

# 或本地使用
npx docweaver init
\`\`\`

### 使用

\`\`\`bash
# 首次生成文档
docweaver init

# 预览模式（不写入文件）
docweaver init --dry-run

# 增量更新（保留人工修改）
docweaver update

# 查看差异
docweaver diff

# 配置 API
docweaver config --set-key sk-xxx --set-model deepseek-chat
\`\`\`
<!-- DOCWEAVER-END -->

<!-- DOCWEAVER_BLOCK_START:tech-stack -->
<!-- DOCWEAVER-AUTO-GENERATED: 技术栈 -->
## 技术栈

| 技术 | 说明 |
|------|------|
| TypeScript | 类型安全，ESM 模式 |
| Commander.js | CLI 命令框架 |
| OpenAI SDK | LLM 调用抽象层 |
| tsup | 打包工具（ESM/CJS/DTS） |
| Jest | 单元测试（覆盖率 > 85%） |
| Ora | 终端加载动画 |
<!-- DOCWEAVER-END -->

<!-- DOCWEAVER_BLOCK_START:architecture -->
<!-- DOCWEAVER-AUTO-GENERATED: 架构设计 -->
## 架构设计

\`\`\`
src/
├── cli/          # CLI 命令层 (init/update/diff/config)
├── core/         # 核心引擎 (scanner/parser/generator/merger/differ)
├── llm/          # AI 抽象层 (client/prompt/templates)
├── security/     # 安全防火墙 (blacklist/redactor)
├── types/        # 核心数据契约 (context.ts)
└── utils/        # 工具函数 (token/truncate)
\`\`\`

**核心流程：**
\`\`\`
扫描目录 → 解析元数据 → 安全脱敏 → Token 管控 → LLM 生成 → 校验输出
\`\`\`
<!-- DOCWEAVER-END -->

<!-- DOCWEAVER_BLOCK_START:contributing -->
<!-- DOCWEAVER-AUTO-GENERATED: 贡献指南 -->
## 参与贡献

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (git checkout -b feature/amazing-feature)
3. 提交更改 (git commit -m 'feat: add amazing feature')
4. 推送到分支 (git push origin feature/amazing-feature)
5. 提交 Pull Request

运行测试：npm test
<!-- DOCWEAVER-END -->

<!-- DOCWEAVER_BLOCK_START:license -->
<!-- DOCWEAVER-AUTO-GENERATED: 许可证 -->
## 许可证

本项目采用 [GPL-3.0](LICENSE) 许可证。
<!-- DOCWEAVER-END -->
`;
