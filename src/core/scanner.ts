import fs from 'fs-extra';
import path from 'path';
import ignore from 'ignore';
import { isBlacklisted } from '../security/blacklist';
import { ScanFileItem } from '../types/context';
import { SCANNER } from '../config';

const { MAX_FILES_PER_DIR, MAX_FILE_LINES, HALF_LINES, MAX_FILE_SIZE } = SCANNER;

function loadGitignore(dir: string): ReturnType<typeof ignore> {
  const ig = ignore();
  const gitignorePath = path.join(dir, '.gitignore');
  try {
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    ig.add(content);
  } catch {
    // no .gitignore found
  }
  ig.add(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '__pycache__']);
  return ig;
}

function getLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const langMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.json': 'json',
    '.md': 'markdown',
    '.py': 'python',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.vue': 'vue',
    '.css': 'css',
    '.html': 'html',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.xml': 'xml',
    '.sh': 'shell',
    '.dockerfile': 'dockerfile',
  };
  const basename = path.basename(filePath).toLowerCase();
  if (basename === 'dockerfile') return 'dockerfile';
  return langMap[ext] || 'text';
}

function truncateContent(content: string): string {
  const lines = content.split('\n');
  if (lines.length <= MAX_FILE_LINES) return content;
  const first = lines.slice(0, HALF_LINES).join('\n');
  const last = lines.slice(-HALF_LINES).join('\n');
  return first + '\n\n// ... truncated ...\n\n' + last;
}

function shouldSkip(relativePath: string, ig: ReturnType<typeof ignore>): boolean {
  if (ig.ignores(relativePath)) return true;
  if (isBlacklisted(relativePath)) {
    console.log(`⚠️ 已跳过敏感文件: ${relativePath}`);
    return true;
  }
  return false;
}

function traverse(
  dir: string,
  ig: ReturnType<typeof ignore>,
  rootDir: string,
  depth: number,
): { tree: string; snippets: ScanFileItem[] } {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const fileEntries: Dirent[] = [];
  const dirEntries: Dirent[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

    if (shouldSkip(relativePath, ig)) continue;

    if (entry.isDirectory()) {
      dirEntries.push(entry);
    } else if (entry.isFile()) {
      fileEntries.push(entry);
    }
  }

  let tree = '';
  const indent = '  '.repeat(depth);
  const snippets: ScanFileItem[] = [];

  // Process files: build tree lines + read content
  for (const file of fileEntries) {
    const fullPath = path.join(dir, file.name);
    const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

    tree += `${indent}${relativePath}\n`;

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.length > MAX_FILE_SIZE) {
        console.log(`⚠️ 已跳过大型文件 (${(content.length / MAX_FILE_SIZE).toFixed(1)}MB): ${relativePath}`);
        continue;
      }
      snippets.push({
        path: relativePath,
        content: truncateContent(content),
        language: getLanguage(relativePath),
      });
    } catch {
      // skip binary / unreadable files
    }
  }

  // Process directories
  for (const dirEnt of dirEntries) {
    const subDir = path.join(dir, dirEnt.name);
    const relativeDir = path.relative(rootDir, subDir).replace(/\\/g, '/');

    // Count visible files in subdirectory for collapse decision
    let subFileCount = 0;
    try {
      const subEntries = fs.readdirSync(subDir, { withFileTypes: true });
      for (const subEntry of subEntries) {
        const subRelative = path.join(relativeDir, subEntry.name).replace(/\\/g, '/');
        if (subEntry.isFile() && !shouldSkip(subRelative, ig)) {
          subFileCount++;
        }
      }
    } catch {
      // skip inaccessible dirs
    }

    if (subFileCount > MAX_FILES_PER_DIR) {
      tree += `${indent}${relativeDir}/... (${subFileCount} files)\n`;
      // Still recurse to read snippets, just collapse the tree display
      const result = traverse(subDir, ig, rootDir, 1);
      snippets.push(...result.snippets);
    } else {
      const result = traverse(subDir, ig, rootDir, depth + 1);
      tree += result.tree;
      snippets.push(...result.snippets);
    }
  }

  return { tree, snippets };
}

export function scanProject(dir: string): { snippets: ScanFileItem[]; tree: string } {
  const ig = loadGitignore(dir);
  return traverse(dir, ig, dir, 0);
}

export function scanDir(dir: string): ScanFileItem[] {
  return scanProject(dir).snippets;
}

export function buildTree(dir: string): string {
  return scanProject(dir).tree;
}

// Re-export types used elsewhere
import { Dirent } from 'fs';
export type { Dirent };
