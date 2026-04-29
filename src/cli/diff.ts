import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import { prepareContext } from '../core/pipeline';
import { generateReadme } from '../core/generator';
import { getDiff } from '../core/differ';

export async function diffCommand(options: { source?: string }): Promise<void> {
  const cwd = process.cwd();
  const sourcePath = options.source || 'README.md';
  const fullSourcePath = path.join(cwd, sourcePath);

  let oldContent = '';
  if (fs.existsSync(fullSourcePath)) {
    oldContent = fs.readFileSync(fullSourcePath, 'utf-8');
  }

  const { context } = prepareContext(cwd);

  const startTime = Date.now();
  console.log('🤖 生成中...');
  const spinner = ora('🧶 Weaving your docs...').start();
  const newContent = await generateReadme(context);
  spinner.succeed('文档生成完成');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  if (oldContent) {
    const diffResult = getDiff(oldContent, newContent);
    console.log('\n--- 变更差异 ---\n');
    console.log(diffResult);
    console.log(`\n⏱️  耗时: ${elapsed}s`);
  } else {
    console.log('(无现有 README，以下为新生成内容预览)\n');
    console.log(newContent);
  }
}
