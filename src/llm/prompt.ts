import { ProjectContext } from '../types/context';
import { PROJECT_TYPE_TEMPLATES, README_WRITER_RULES, COMMON_TEMPLATE } from './templates';

function detectProjectType(context: ProjectContext): string {
  const paths = context.snippets.map((s) => s.path).join(' ');
  const name = (context.metadata.name || '').toLowerCase();

  if (/components?\//.test(paths) || /\.vue\b/.test(paths) || /\.tsx\b/.test(paths)) {
    return 'UI 组件库';
  }
  if (/cli|tool|bin\//.test(name + paths)) {
    return '工具类';
  }
  if (/admin\//.test(paths) || /dashboard\b/.test(paths) || /router\b/.test(paths)) {
    return 'CMS/后台系统';
  }
  if (/core\//.test(paths) || /packages\//.test(paths)) {
    return '框架/引擎';
  }
  if (/model\//.test(paths) || /api\//.test(paths) || /llm\b/.test(paths)) {
    return 'AI/数据产品';
  }
  if (/docs?\//.test(paths)) {
    return '学习资源';
  }
  return '通用项目';
}

export function buildPrompt(context: ProjectContext): { systemPrompt: string; userPrompt: string } {
  const projectType = detectProjectType(context);
  const tmpl = PROJECT_TYPE_TEMPLATES[projectType];
  const rules = README_WRITER_RULES;
  const language = context.metadata.language || 'zh';

  const sysLang = language === 'en' ? ' in English' : '（使用中文输出）';

  const systemPrompt = `你是一个专业的技术文档撰写专家${sysLang}。你的目标是让访客 5 秒内知道这是什么项目、有什么用，并让用户能快速上手。

## 核心原则
${rules.corePrinciples.map((p) => `- ${p}`).join('\n')}

## 项目类型分析
- 当前项目类型：**${projectType}**
- 输出侧重：${tmpl ? tmpl.focus : '全面覆盖标准 README 结构'}
${tmpl ? `- 额外要求：\n${tmpl.requiredSections.map((s) => `  - ${s}`).join('\n')}\n- 视觉指引：${tmpl.visualNotes}` : ''}

## 必须包含的章节（按顺序）
${rules.requiredSections.map((s) => `- ${s}`).join('\n')}

## 可选章节（按条件添加）
${rules.optionalSections.map((s) => `- ${s}`).join('\n')}

## 视觉设计规则

### Logo 居中
项目名称和 Logo 必须居中，使用 <div align="center"> 包裹。

### 徽章标准
使用 shields.io 徽章，精选 3-8 个：
- 必加：${rules.badgeGuide.required}
- 建议加：${rules.badgeGuide.recommended}
- 按需加：${rules.badgeGuide.optional}

### 截图与 GIF
- 截图上方加一句引导语（如"数据可视化大屏效果"），而非直接贴图
- UI 组件库：至少 4 张核心界面截图
- 工具类：强烈建议使用 GIF 展示核心交互流程
- 截图使用占位符：![描述](https://via.placeholder.com/800x400?text=截图描述)

### 代码块
安装和使用步骤必须提供可复制运行的代码块，标注语言类型（bash/javascript/python等）。

## 写作风格

### 一句话描述（项目简介）
${rules.writingStyle.oneLiner}
好的示例：${rules.writingStyle.goodExample}
差的示例：${rules.writingStyle.badExample}

### 功能特性
${rules.writingStyle.features}

## 常见错误（必须避免）
${rules.commonMistakes.map((m) => `❌ ${m}`).join('\n')}

## 技术约束
1. 不知道的信息请写'待补充'，绝对禁止捏造不存在的 API 接口、依赖库或运行命令。
2. 使用 Markdown 格式输出。
3. 在 AI 生成的内容块前后添加标记：
   <!-- DOCWEAVER_BLOCK_START:xxx -->
   <!-- DOCWEAVER-AUTO-GENERATED:xxx -->
   内容...
   <!-- DOCWEAVER-END -->
4. 每个主要章节独立作为一个 DOCWEAVER 区块，使用有意义的区块名称（如 project-intro、features、quick-start 等）。`;

  const templateHint = tmpl
    ? `\n\n## 参考模板（${projectType}）\n以下是该类型项目的参考写法，请参照风格但使用实际项目信息：\n\n\`\`\`markdown\n${tmpl.header}\n\n${tmpl.features}\n\`\`\``
    : `\n\n## 通用模板参考\n\`\`\`markdown\n${COMMON_TEMPLATE}\n\`\`\``;

  const userPrompt = `请为以下项目生成 README.md：

## 项目目录树
${context.tree}

## 项目元数据
\`\`\`json
${JSON.stringify(context.metadata, null, 2)}
\`\`\`
${templateHint}

## 代码片段
${context.snippets
  .map((s) => `### ${s.path} (${s.language})\n\`\`\`${s.language}\n${s.content}\n\`\`\``)
  .join('\n\n')}
`;

  return { systemPrompt, userPrompt };
}
