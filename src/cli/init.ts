import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import { prepareContext } from '../core/pipeline';
import { generateReadme } from '../core/generator';
import { estimateTokens } from '../utils/token';

export async function initCommand(options: { output?: string; dryRun?: boolean; template?: string; language?: string }): Promise<void> {
  const cwd = process.cwd();

  const extraMeta: Record<string, string> = {};
  if (options.template) extraMeta.template = options.template;
  if (options.language) extraMeta.language = options.language;

  const { context } = prepareContext(cwd, { extraMeta });

  const startTime = Date.now();
  console.log('🤖 生成中...');
  const spinner = ora('🧶 Weaving your docs...').start();
  const result = await generateReadme(context);
  spinner.succeed('文档生成完成');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  if (options.dryRun) {
    console.log('\n--- 预览 ---\n');
    console.log(result);
    return;
  }

  const outputPath = options.output || 'README.md';
  const existing = path.join(cwd, outputPath);

  let finalPath = existing;
  if (fs.existsSync(existing)) {
    const altPath = path.join(cwd, 'README.docweaver.md');
    fs.writeFileSync(altPath, result, 'utf-8');
    finalPath = altPath;
    console.log('⚠️ 检测到旧 README，已输出为 README.docweaver.md');
  } else {
    fs.writeFileSync(existing, result, 'utf-8');
  }

  console.log(`✨ README 已生成: ${finalPath}`);
  console.log(`📊 Token 消耗: Input ${context.totalTokens} / Output ~${estimateTokens(result)}`);
  console.log(`⏱️  耗时: ${elapsed}s`);
}
