import { ProjectContext } from '../types/context';
import { generateDocs } from '../llm/client';
import { buildPrompt } from '../llm/prompt';
import { README_WRITER_RULES } from '../llm/templates';
import { GENERATOR } from '../config';

const {
  MIN_BADGES,
  MAX_BADGES,
  MAX_LINES,
  SMALL_PROJECT_LINES,
  MAX_DESC_LENGTH,
  MIN_DESC_LENGTH,
  FAQ_FIRST_QUARTER_RATIO,
} = GENERATOR;

const WARN_PREFIX = '\n\n> ⚠️ 文档生成提示：';

function getInstallCommand(packageManager: string): string {
  const cmdMap: Record<string, string> = {
    npm: '# 安装依赖\nnpm install',
    yarn: '# 安装依赖\nyarn install',
    pnpm: '# 安装依赖\npnpm install',
    go: '# 安装依赖\ngo mod download',
    cargo: '# 安装依赖\ncargo build',
    'poetry/pip': '# 安装依赖\npoetry install\n# 或\npip install -r requirements.txt',
    pip: '# 安装依赖\npip install -r requirements.txt',
    maven: '# 安装依赖\nmvn install',
    gradle: '# 安装依赖\ngradle build',
  };
  return cmdMap[packageManager] || `# 安装依赖\nnpm install`;
}

function countLines(content: string): number {
  return content.split('\n').length;
}

function hasFaqAtBeginning(content: string): boolean {
  const firstQuarter = countLines(content) * FAQ_FIRST_QUARTER_RATIO;
  const earlyLines = content.split('\n').slice(0, Math.floor(firstQuarter)).join('\n');
  return /^\s*#+\s*(常见问题|FAQ|Q&A|问答)/im.test(earlyLines);
}

function hasJargonWithoutExplanation(content: string): boolean {
  const technicalTerms =
    /\b(?:Webpack|Babel|ESLint|TypeScript|Docker|Kubernetes|GraphQL|Redux|Vuex)\b/g;
  const matches = content.match(technicalTerms);
  if (!matches) return false;
  return matches.length >= 3;
}

export async function generateReadme(context: ProjectContext): Promise<string> {
  const { systemPrompt, userPrompt } = buildPrompt(context);
  const raw = await generateDocs(systemPrompt, userPrompt);

  let content = raw;
  const warnings: string[] = [];

  const isToolProject =
    /\bcli\b|\btool\b/.test((context.metadata.name || '').toLowerCase()) ||
    context.snippets.some((s) => s.path.includes('bin/') || s.path.includes('cli/'));

  const placeholderUrl = isToolProject
    ? 'https://via.placeholder.com/800x400?text=Demo+GIF+-+Replace+with+actual+recording'
    : 'https://via.placeholder.com/800x400?text=Project+Demo+-+Replace+with+actual+screenshot';

  const placeholderImg = isToolProject
    ? `![Demo GIF](${placeholderUrl})`
    : `![Project Demo](${placeholderUrl})`;

  // 1. Placeholder image check
  if (!content.includes('via.placeholder.com')) {
    content = `${placeholderImg}\n> 📝 提示：请替换为实际截图或 GIF 演示\n\n` + content;
  }

  // 2. Logo centering check
  if (!content.includes('<div align="center">') && !content.includes('<p align="center">')) {
    const h1Match = content.match(/^#\s+.+$/m);
    if (h1Match) {
      const title = h1Match[0];
      const titleIdx = content.indexOf(title);
      const titleLen = title.length;
      const openTag = '<div align="center">\n\n';
      const closeTag = '\n</div>\n';
      // 在插入开标签前保存标题后换行符的位置
      const newlineAfterTitle = content.indexOf('\n', titleIdx + titleLen);
      content =
        content.substring(0, titleIdx) + openTag + title + content.substring(titleIdx + titleLen);
      if (newlineAfterTitle !== -1) {
        // 开标签导致后续内容偏移了 openTag.length 个字符
        const insertAt = newlineAfterTitle + openTag.length;
        content = content.substring(0, insertAt) + closeTag + content.substring(insertAt);
      }
    }
  }

  // 3. Badge count check (3-8 shields.io badges)
  const badgeMatches = content.match(/!\[.*?\]\(https:\/\/img\.shields\.io\/[^)]+\)/g);
  const badgeCount = badgeMatches ? badgeMatches.length : 0;
  if (badgeCount < MIN_BADGES) {
    const defaultBadges = `\n![Version](https://img.shields.io/badge/version-${context.metadata.version || '0.1.0'}-blue)\n![License](https://img.shields.io/badge/license-GPL%20v3-green)\n![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)\n`;
    // 优先在 </div> 或 </p> 后插入（标题居中块之后），避免误插入代码块内
    const divEnd = content.indexOf('</div>');
    if (divEnd !== -1) {
      const afterDiv = divEnd + '</div>'.length;
      content = content.substring(0, afterDiv) + defaultBadges + content.substring(afterDiv);
    } else {
      const pEnd = content.indexOf('</p>');
      if (pEnd !== -1) {
        const afterP = pEnd + '</p>'.length;
        content = content.substring(0, afterP) + defaultBadges + content.substring(afterP);
      } else {
        const firstH2 = content.indexOf('\n## ');
        if (firstH2 !== -1) {
          content = content.substring(0, firstH2) + defaultBadges + content.substring(firstH2);
        } else {
          const lastNewline = content.lastIndexOf('\n');
          const insertAt = lastNewline !== -1 ? lastNewline : content.length;
          content = content.substring(0, insertAt) + defaultBadges + content.substring(insertAt);
        }
      }
    }
  }
  if (badgeCount > MAX_BADGES) {
    warnings.push(`徽章过多（${badgeCount} 个），建议精选 3-8 个最重要的`);
  }

  // 4. Feature list check (bolded or tabled)
  const featureBoldCount = (content.match(/^- \*\*[^*]+\*\*/gm) || []).length;
  const featureTableCount = (content.match(/\|.*\|.*\|/g) || []).length;
  if (featureBoldCount < 1 && featureTableCount < 1) {
    warnings.push('功能特性：建议使用加粗列表（`- **特性名**：说明`）或表格格式');
  }

  // 5. Installation code block check
  if (!content.includes('```bash') && !content.includes('```sh') && !content.includes('```shell')) {
    const installMatch = content.match(/##\s*安装/i) || content.match(/##\s*快速开始/i);
    if (installMatch) {
      const pm = (context.metadata.packageManager || 'npm').toLowerCase();
      const installCmd = getInstallCommand(pm);
      const pos = content.indexOf(installMatch[0]) + installMatch[0].length;
      content =
        content.substring(0, pos) +
        `\n\n\`\`\`bash\n${installCmd}\n\`\`\`\n` +
        content.substring(pos);
    } else {
      warnings.push('安装步骤：缺少可复制运行的命令代码块');
    }
  }

  // 6. License check
  if (!content.includes('## 许可证') && !content.includes('## License')) {
    content += '\n\n## 许可证\n\n待补充\n';
  }

  // 7. Description length check (15-40 chars)
  const descMatch = content.match(
    /##?\s*(?:项目简介|简介|Description|About|Overview|Introduction)\s*\n+(.{10,100})/i,
  );
  if (descMatch) {
    const desc = descMatch[1].trim();
    if (desc.length > MAX_DESC_LENGTH) {
      const trimmed = desc.substring(0, MAX_DESC_LENGTH) + '...';
      const matchIdx = descMatch.index! + descMatch[0].length - desc.length;
      content =
        content.substring(0, matchIdx) + trimmed + content.substring(matchIdx + desc.length);
    }
    if (desc.length < MIN_DESC_LENGTH) {
      warnings.push(`项目简介过短（${desc.length} 字），建议 15-40 字`);
    }
  } else {
    warnings.push('项目简介：建议添加一句 15-40 字的简介');
  }

  // 8. Total length check
  const lines = countLines(content);
  if (lines > MAX_LINES) {
    warnings.push(`文档过长（${lines} 行），建议精简到 ${MAX_LINES} 行以内`);
  } else if (lines > SMALL_PROJECT_LINES && context.snippets.length <= 10) {
    warnings.push(`文档偏长（${lines} 行），简单项目建议控制在 ${SMALL_PROJECT_LINES} 行以内`);
  }

  // 9. FAQ at beginning check (NEW from readme-writer)
  if (hasFaqAtBeginning(content)) {
    warnings.push('常见问题（FAQ）不应放在文档开头，建议移至文档后半部分');
  }

  // 10. Technical jargon check (NEW from readme-writer)
  if (hasJargonWithoutExplanation(content)) {
    warnings.push('检测到较多技术名词，建议增加通俗解释帮助新用户理解');
  }

  if (warnings.length > 0) {
    content += WARN_PREFIX + '\n' + warnings.map((w) => `- ${w}`).join('\n');
  }

  content += '\n\n---\n';
  content += '\n' + README_WRITER_RULES.disclaimer + '\n';

  return content;
}
