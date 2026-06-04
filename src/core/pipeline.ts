import { scanProject } from './scanner';
import { parseAllMetadata } from './parser';
import { redactContent } from '../security/redactor';
import { estimateTokens } from '../utils/token';
import { truncateSnippetsByPriority } from '../utils/truncate';
import { ProjectContext, ProjectMetadata, ScanFileItem } from '../types/context';
import { TOKEN } from '../config';

export interface PrepareContextOptions {
  maxTokens?: number;
  extraMeta?: Partial<ProjectMetadata>;
}

export function prepareContext(
  cwd: string,
  options: PrepareContextOptions = {},
): { context: ProjectContext; totalRedactions: number } {
  const maxTokens = options.maxTokens ?? TOKEN.BUDGET;

  const { snippets: files, tree } = scanProject(cwd);

  let totalTokens = 0;
  let totalRedactions = 0;

  const redacted: ScanFileItem[] = files.map((f) => {
    const { cleanContent, redactCount } = redactContent(f.content);
    totalRedactions += redactCount;
    if (redactCount > 0) {
      console.log(`⚠️ 已脱敏 ${redactCount} 处敏感信息: ${f.path}`);
    }
    const tokens = estimateTokens(cleanContent);
    totalTokens += tokens;
    return { ...f, content: cleanContent };
  });

  if (totalRedactions === 0) {
    console.log('✅ 未发现敏感信息');
  }

  // 先从完整文件列表解析元数据，再按 token 预算截断（截断只影响送入 LLM 的内容）
  const metadata = parseAllMetadata(redacted);

  let finalSnippets = redacted;
  let finalTokens = totalTokens;

  if (totalTokens > maxTokens) {
    const result = truncateSnippetsByPriority(redacted, maxTokens);
    finalSnippets = result.snippets;
    finalTokens = result.totalTokens;
    console.log(`⚠️ Token 预估超限，已启用精简模式 (保留 ${finalSnippets.length} 个文件)`);
  }

  if (options.extraMeta) {
    Object.assign(metadata, options.extraMeta);
  }

  const context: ProjectContext = {
    tree,
    metadata,
    snippets: finalSnippets,
    totalTokens: finalTokens,
  };

  return { context, totalRedactions };
}
