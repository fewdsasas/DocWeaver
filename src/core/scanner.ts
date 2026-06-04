import fs from 'fs-extra';
import { Dirent } from 'fs';
import path from 'path';
import ignore from 'ignore';
import { isBlacklisted } from '../security/blacklist';
import { ScanFileItem } from '../types/context';
import { SCANNER } from '../config';

const { MAX_FILES_PER_DIR, MAX_FILE_LINES, HALF_LINES, MAX_FILE_SIZE, MAX_DEPTH } = SCANNER;

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
  preReadEntries?: Dirent[],
): { tree: string; snippets: ScanFileItem[] } {
  if (depth >= MAX_DEPTH) {
    return { tree: '', snippets: [] };
  }
  const entries = preReadEntries ?? (fs.readdirSync(dir, { withFileTypes: true }) as Dirent[]);
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

  const treeLines: string[] = [];
  const indent = '  '.repeat(depth);
  const snippets: ScanFileItem[] = [];

  // Process files: build tree lines + read content
  for (const file of fileEntries) {
    const fullPath = path.join(dir, file.name);
    const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

    treeLines.push(`${indent}${relativePath}`);

    try {
      const stat = fs.statSync(fullPath);
      if (stat.size > MAX_FILE_SIZE) {
        const sizeMB = (stat.size / (1024 * 1024)).toFixed(1);
        console.log(`⚠️ 已跳过大型文件 (${sizeMB}MB): ${relativePath}`);
        continue;
      }
      const content = fs.readFileSync(fullPath, 'utf-8');
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
    let subEntries: Dirent[] | undefined;
    try {
      subEntries = fs.readdirSync(subDir, { withFileTypes: true }) as Dirent[];
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
      treeLines.push(`${indent}${relativeDir}/... (${subFileCount} files)`);
      // Still recurse to read snippets, just collapse the tree display
      const result = traverse(subDir, ig, rootDir, depth + 1, subEntries);
      snippets.push(...result.snippets);
    } else {
      const result = traverse(subDir, ig, rootDir, depth + 1, subEntries);
      if (result.tree) treeLines.push(result.tree.trimEnd());
      snippets.push(...result.snippets);
    }
  }

  return { tree: treeLines.length > 0 ? treeLines.join('\n') + '\n' : '', snippets };
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
