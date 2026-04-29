<div align="center">
  <h1>🧶 DocWeaver</h1>
  <p><strong>AI 驱动的代码库文档自动生成与同步 CLI 工具</strong></p>

  ![Version](https://img.shields.io/badge/version-1.0.0-blue)
  ![License](https://img.shields.io/badge/license-MIT-green)
  ![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
  ![TypeScript](https://img.shields.io/badge/typescript-ESM-blue)

  [安装](#安装) | [使用](#使用) | [架构](#架构设计) | [贡献](#参与贡献)
</div>

---

## 项目简介

DocWeaver 是一款面向开发者的 AI-Native 代码库文档自动化工具。只需一条命令，即可将任意代码仓库生成符合 GitHub 高 Star 项目标准的专业 README.md，并通过双重锁死机制自动保持文档与代码同步更新。

**核心价值**：补位 AI 编程工作流，消灭"代码与文档脱节"，实现真正的 Docs-as-Code。

---

<!-- DOCWEAVER_BLOCK_START:features -->
<!-- DOCWEAVER-AUTO-GENERATED: 功能特性 -->
## 功能特性

- **🤖 AI 驱动生成**：基于 LLM 自动分析代码库目录、元数据和代码片段，生成结构化 README
- **🔒 隐私安全防火墙**：自动跳过 `.env`、`*.pem`、`credentials.json` 等敏感文件，正则脱敏 API Key、密码、私钥
- **🔄 增量更新 + 双重锁死**：`update` 命令通过区块标记和 SHA-1 指纹保留人工修改内容
- **📦 多包管理器支持**：自动识别 Node.js / Go / Rust / Python / Java 等 7 种项目类型
- **📊 Token 智能管控**：字符级 Token 预估 + 优先级队列裁剪，超限自动降级
- **⚡ 轻量零依赖**：纯正则解析，无 AST 解析器，安装包 < 15MB
- **🧪 Mock 模式**：设置 `DOCWEAVER_MOCK=true` 即可在无 API Key 下测试全流程
<!-- DOCWEAVER-END -->

---

<!-- DOCWEAVER_BLOCK_START:quick-start -->
<!-- DOCWEAVER-AUTO-GENERATED: 快速开始 -->
## 快速开始

### 前置条件

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### 安装

```bash
git clone https://github.com/example/docweaver.git
cd docweaver
npm install
npm run build
```

### 配置 API

```bash
# 通过命令行配置
docweaver config --set-key sk-your-api-key --set-model deepseek-chat

# 或通过环境变量
export DOCWEAVER_API_KEY=sk-your-api-key
export DOCWEAVER_BASE_URL=https://api.deepseek.com/v1
export DOCWEAVER_MODEL=deepseek-chat
```

### 使用

```bash
# Mock 模式测试（不消耗 API 额度）
DOCWEAVER_MOCK=true node dist/index.js init --dry-run

# 首次生成文档
node dist/index.js init

# 预览模式（不写入文件）
node dist/index.js init --dry-run

# 增量更新（保留人工修改）
node dist/index.js update

# 查看新旧差异
node dist/index.js diff

# 查看当前配置
node dist/index.js config
```
<!-- DOCWEAVER-END -->

---

<!-- DOCWEAVER_BLOCK_START:tech-stack -->
<!-- DOCWEAVER-AUTO-GENERATED: 技术栈 -->
## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| TypeScript | 5.x | 类型安全，ESM 严格模式 |
| Commander.js | 14.x | CLI 命令框架 |
| OpenAI SDK | 6.x | LLM 调用抽象层 |
| Ora | 9.x | 终端加载动画 |
| ignore | 7.x | .gitignore 规则解析 |
| diff | 9.x | 文本差异计算 |
| fs-extra | 11.x | 增强文件操作 |
| tsup | 8.x | 打包工具 (ESM/CJS/DTS) |
| Jest | 30.x | 单元测试 + 覆盖率 |
<!-- DOCWEAVER-END -->

---

<!-- DOCWEAVER_BLOCK_START:architecture -->
<!-- DOCWEAVER-AUTO-GENERATED: 架构设计 -->
## 架构设计

```
src/
├── cli/              # CLI 命令层
│   ├── init.ts       # init 命令：首次生成
│   ├── update.ts     # update 命令：增量更新
│   ├── diff.ts       # diff 命令：差异对比
│   └── config.ts     # config 命令：配置管理
├── core/             # 核心引擎
│   ├── scanner.ts    # 目录扫描 + 文件采样 + 目录树构建
│   ├── parser.ts     # 多包管理器元数据提取
│   ├── generator.ts  # README 生成 + 10 项校验清单
│   ├── merger.ts     # 双重锁死增量更新
│   └── differ.ts     # 文本差异计算
├── llm/              # AI 抽象层
│   ├── client.ts     # OpenAI SDK 封装 + Mock 模式
│   ├── prompt.ts     # System Prompt 构建 (readme-writer)
│   └── templates.ts  # 6 种项目类型模板
├── security/         # 安全防火墙
│   ├── blacklist.ts  # 文件黑名单 (14 种敏感文件)
│   └── redactor.ts   # 内容脱敏 (5 种正则模式)
├── types/            # 核心数据契约
│   └── context.ts    # ScanFileItem / ProjectContext / MergerBlock / CliResult
├── utils/            # 工具函数
│   ├── token.ts      # Token 预估 (英文0.3/中文1.5/混合0.8)
│   └── truncate.ts   # 优先级 Token 裁剪 (P1~P5)
└── index.ts          # 入口文件 (commander + dotenv)
```

**核心流程：**

```
扫描目录 ──→ 解析元数据 ──→ 安全脱敏 ──→ Token 管控 ──→ LLM 生成 ──→ 校验输出
    │              │             │              │               │              │
    │  .gitignore  │  pkg.json   │  正则替换    │  >6000 触发   │  System      │  10项检查
    │  黑名单过滤  │  go.mod... │  REDACTED    │  按优先级裁剪  │  Prompt      │  后置修正
    │  折叠截断    │  7种格式   │  5种模式     │               │              │
```
<!-- DOCWEAVER-END -->

---

## 命令参考

| 命令 | 功能 | 参数 |
|------|------|------|
| `init` | 首次生成文档 | `--output <path>` `--dry-run` `--template <name>` `--language zh/en` |
| `update` | 增量更新文档 | `--force` `--preview` |
| `diff` | 对比差异 | `--source <path>` |
| `config` | 配置管理 | `--set-key <key>` `--set-model <model>` `--set-base-url <url>` |

---

## 开发

```bash
# 安装依赖
npm install

# 类型检查
npm run typecheck

# 运行测试
npm test

# 覆盖率报告
npx jest --coverage

# 构建
npm run build
```

---

## 参与贡献

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

---

## 许可证

本项目采用 [MIT](LICENSE) 许可证。

---

> 🤖 本文档由 DocWeaver 自动生成，内容仅供参考，请以实际代码为准。
> 如发现文档与代码不符，欢迎提交 Issue 或 PR 帮助我们改进。
