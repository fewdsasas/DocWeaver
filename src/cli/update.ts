import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import { prepareContext } from '../core/pipeline';
import { generateReadme } from '../core/generator';
import { mergeUpdate } from '../core/merger';
import { estimateTokens } from '../utils/token';

export async function updateCommand(options: { force?: boolean; preview?: boolean }): Promise<void> {
  const cwd = process.cwd();
  const readmePath = path.join(cwd, 'README.md');

  let oldContent = '';
  if (fs.existsSync(readmePath)) {
    oldContent = fs.readFileSync(readmePath, 'utf-8');
  }

  const { context } = prepareContext(cwd);

  const startTime = Date.now();
  console.log('🤖 生成中...');
  const spinner = ora('🧶 Weaving your docs...').start();
  const newContent = await generateReadme(context);
  spinner.succeed('文档生成完成');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  if (oldContent) {
    const merged = options.force ? newContent : mergeUpdate(oldContent, newContent);

    if (options.preview) {
      console.log('\n--- 预览变更 ---\n');
      console.log(merged);
      return;
    }

    fs.writeFileSync(readmePath, merged, 'utf-8');
    console.log('✨ README.md 已更新');
  } else {
    fs.writeFileSync(readmePath, newContent, 'utf-8');
    console.log('✨ README.md 已生成');
  }

  console.log(`📊 Token 消耗: Input ${context.totalTokens} / Output ~${estimateTokens(newContent)}`);
  console.log(`⏱️  耗时: ${elapsed}s`);
}
