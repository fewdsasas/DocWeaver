import 'dotenv/config';
import { Command } from 'commander';
import { initCommand } from './cli/init';
import { updateCommand } from './cli/update';
import { diffCommand } from './cli/diff';
import { configCommand } from './cli/config';

const program = new Command();

program
  .name('docweaver')
  .description('AI-powered README generator for your codebase')
  .version('1.0.0');

function handleError(err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error('❌ Error:', message);
  process.exit(1);
}

program
  .command('init')
  .description('Generate README from scratch')
  .option('--output <path>', 'Output file path')
  .option('--template <name>', 'Select README template style (e.g. minimal, detailed)')
  .option('--language <lang>', 'Output language (zh/en)', 'zh')
  .option('--dry-run', 'Preview without writing')
  .action(async (options) => {
    try {
      await initCommand(options);
    } catch (err) {
      handleError(err);
    }
  });

program
  .command('update')
  .description('Incrementally update existing README')
  .option('--force', 'Force overwrite all content')
  .option('--preview', 'Preview changes without writing')
  .action(async (options) => {
    try {
      await updateCommand(options);
    } catch (err) {
      handleError(err);
    }
  });

program
  .command('diff')
  .description('Show diff between existing and new README')
  .option('--source <path>', 'Source README path')
  .action(async (options) => {
    try {
      await diffCommand(options);
    } catch (err) {
      handleError(err);
    }
  });

program
  .command('config')
  .description('Manage configuration')
  .option('--set-key <key>', 'Set API Key')
  .option('--set-model <model>', 'Set default model')
  .option('--set-base-url <url>', 'Set API base URL')
  .action(async (options) => {
    try {
      await configCommand(options);
    } catch (err) {
      handleError(err);
    }
  });

program.parse();
