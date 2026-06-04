# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

DocWeaver 是一个 AI 驱动的 CLI 工具，用于自动生成和增量同步代码库的 README 文档。通过扫描项目文件、提取元数据、调用 LLM 生成文档，并支持基于块标记和 SHA-1 指纹的增量更新。

## 常用命令

```bash
npm run build          # tsup 构建，输出到 dist/
npm test               # 先 build 再跑 jest（DOCWEAVER_MOCK=true 模式，无需 API）
npm run test:coverage  # jest 带覆盖率
npm run typecheck      # tsc --noEmit 类型检查
npm run lint           # eslint src/ tests/
npm run format         # prettier --write src/ tests/
```

运行单个测试文件：
```bash
npx jest tests/scanner.test.ts --no-coverage
```

测试环境需设置 `DOCWEAVER_MOCK=true` 以跳过真实 LLM 调用。

## 技术栈

- TypeScript 6.x（ESM，`"type": "module"`），目标 ES2022
- 打包：tsup（输出 ESM + CJS + .d.ts）
- 测试：Jest 30.x + ts-jest
- CLI 框架：Commander.js
- LLM：OpenAI SDK（兼容 DeepSeek 等 OpenAI 兼容 API）
- Node.js >= 18

## 架构

### 数据流（Pipeline）

```
扫描目录 → 脱敏敏感信息 → 估算 Token → 按优先级截断 → 解析元数据 → 构建 ProjectContext → 调用 LLM 生成 README
```

核心入口：`src/core/pipeline.ts` 的 `prepareContext(cwd)`

### CLI 命令（src/cli/）

每个命令都是异步函数，遵循模式：`prepareContext(cwd)` → `generateReadme(context)` → 处理输出。

- **init**：首次生成 README
- **update**：基于双锁标记的增量更新
- **diff**：显示新旧 README 的文本差异
- **config**：读写 `.docweaverrc` 配置文件

### 增量更新机制（src/core/merger.ts）

使用 HTML 注释标记实现双锁更新：
- `<!-- DOCWEAVER_BLOCK_START:name -->` / `<!-- DOCWEAVER-END -->` 定义块边界
- `<!-- DOCWEAVER-FINGERPRINT:xxx -->` SHA-1 指纹检测内容变化
- 手动章节（Acknowledgments, Changelog 等）始终保留不覆盖

### Token 管理

总预算 6000 token，超限时按优先级截断文件内容：P1（入口文件）> P2（路由/API）> P3（配置）> P4（模型/类型）> P5（其他）。截断逻辑在 `src/utils/truncate.ts`。

### 安全层（src/security/）

- **blacklist.ts**：文件黑名单（14 种敏感文件名/扩展名/路径）
- **redactor.ts**：内容脱敏（AWS key、sk-* key、私钥、密码、Bearer token）

### 项目类型检测（src/llm/prompt.ts）

自动检测 7 种项目类型（UI 组件库、CLI 工具、CMS、框架、AI 产品、学习资源、通用项目），据此选择对应的 README 模板和提示词。

## 代码风格

- ESLint flat config，`@typescript-eslint/no-explicit-any` 为 warn
- 未使用变量以 `_` 前缀命名可免警告
- Prettier：单引号、分号、尾逗号、100 字符行宽、2 空格缩进
- 代码注释使用中文

## 环境变量

| 变量 | 用途 |
|------|------|
| `DOCWEAVER_MOCK` | 设为 `"true"` 启用 Mock 模式（不调用 API） |
| `DOCWEAVER_API_KEY` | LLM API 密钥 |
| `DOCWEAVER_BASE_URL` | LLM API 地址（默认 OpenAI） |
| `DOCWEAVER_MODEL` | 模型名称（默认 `gpt-4o-mini`） |

配置也可通过 `.docweaverrc`（JSON 格式，已 gitignore）文件设置。
