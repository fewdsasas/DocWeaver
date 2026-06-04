import crypto from 'crypto';

const BLOCK_START = /<!--\s*DOCWEAVER_BLOCK_START:([^>]+)\s*-->/;
const AUTO_GENERATED = /<!--\s*DOCWEAVER-AUTO-GENERATED:([^>]+)\s*-->/;
const FINGERPRINT = /<!--\s*DOCWEAVER-FINGERPRINT:([a-f0-9]+)\s*-->/;
const BLOCK_END = /<!--\s*DOCWEAVER-END\s*-->/;

const MANUAL_CHAPTER_PATTERN =
  /^##\s+(致谢|贡献者|更新日志|赞助|鸣谢|Changelog|Acknowledgments?|Contributors?|Sponsors?)\s*$/m;

function computeFingerprint(content: string): string {
  return crypto.createHash('sha1').update(content).digest('hex').substring(0, 12);
}

function extractBlockInfo(content: string): {
  hasAutoMarker: boolean;
  fingerprint: string | null;
} {
  const hasAuto = AUTO_GENERATED.test(content);
  const fpMatch = content.match(FINGERPRINT);
  return {
    hasAutoMarker: hasAuto,
    fingerprint: fpMatch ? fpMatch[1] : null,
  };
}

function extractManualChapters(content: string): string[] {
  const chapters: string[] = [];
  const cleaned = content.replace(
    /<!--\s*DOCWEAVER_BLOCK_START:[\s\S]*?<!--\s*DOCWEAVER-END\s*-->/g,
    '',
  );

  const lines = cleaned.split('\n');
  let collecting = false;
  let currentChapter: string[] = [];

  for (const line of lines) {
    if (MANUAL_CHAPTER_PATTERN.test(line)) {
      if (currentChapter.length > 0 && currentChapter.some((l) => l.trim())) {
        chapters.push(currentChapter.join('\n'));
      }
      currentChapter = [line];
      collecting = true;
    } else if (collecting) {
      if (/^##\s+/.test(line) || /^#\s+/.test(line)) {
        if (currentChapter.some((l) => l.trim())) {
          chapters.push(currentChapter.join('\n'));
        }
        currentChapter = [];
        collecting = MANUAL_CHAPTER_PATTERN.test(line);
        if (collecting) currentChapter = [line];
      } else {
        currentChapter.push(line);
      }
    }
  }

  if (currentChapter.length > 0 && currentChapter.some((l) => l.trim())) {
    chapters.push(currentChapter.join('\n'));
  }

  return chapters;
}

function extractBlock(lines: string[], startIdx: number): { content: string; endIdx: number } {
  let idx = startIdx;
  const block: string[] = [];

  if (lines[idx].match(BLOCK_START)) block.push(lines[idx++]);

  while (idx < lines.length) {
    if (lines[idx].match(BLOCK_END)) {
      block.push(lines[idx]);
      idx++;
      break;
    }
    block.push(lines[idx]);
    idx++;
  }

  return { content: block.join('\n'), endIdx: idx };
}

export function mergeUpdate(oldContent: string, newContent: string): string {
  const manualChapters = extractManualChapters(oldContent);

  // 索引旧内容中的所有块，按名称索引
  const oldBlocks = new Map<string, string>();
  const oldLines = oldContent.split('\n');
  let i = 0;
  while (i < oldLines.length) {
    const startMatch = oldLines[i].match(BLOCK_START);
    if (startMatch) {
      const name = startMatch[1].trim();
      const blockStart = i;
      i++;
      while (i < oldLines.length && !BLOCK_END.test(oldLines[i])) i++;
      if (i < oldLines.length) i++; // 跳过 BLOCK_END
      oldBlocks.set(name, oldLines.slice(blockStart, i).join('\n'));
    } else {
      i++;
    }
  }

  // 以新内容为骨架构建结果，选择性保留旧块
  const result: string[] = [];
  const newLines = newContent.split('\n');
  let j = 0;

  while (j < newLines.length) {
    const blockMatch = newLines[j].match(BLOCK_START);
    if (blockMatch) {
      const name = blockMatch[1].trim();
      const newBlock = extractBlock(newLines, j);
      j = newBlock.endIdx;

      const blockContentStart = newBlock.content.indexOf('\n') + 1;
      const blockContentEnd = newBlock.content.lastIndexOf('\n<!--');
      const blockBody =
        blockContentEnd > blockContentStart
          ? newBlock.content.substring(blockContentStart, blockContentEnd)
          : newBlock.content;
      const fingerprint = computeFingerprint(blockBody);

      const oldBlock = oldBlocks.get(name);
      let content: string;

      if (oldBlock) {
        const info = extractBlockInfo(oldBlock);
        // 自动块用新内容；手动块始终保留旧内容（指纹匹配说明未修改，不匹配说明用户编辑过，都应保留）
        if (info.hasAutoMarker) {
          content = newBlock.content;
        } else {
          content = oldBlock;
        }
      } else {
        content = newBlock.content;
      }

      // 注入标记（仅自动块添加 AUTO-GENERATED 和 FINGERPRINT，手动块保留原标记）
      let fixed: string;
      if (oldBlock && !extractBlockInfo(oldBlock).hasAutoMarker) {
        // 手动块：仅添加指纹，不添加 AUTO-GENERATED 标记
        fixed = content.replace(
          BLOCK_START,
          (_match, blockName) =>
            `<!-- DOCWEAVER_BLOCK_START:${blockName} -->\n<!-- DOCWEAVER-FINGERPRINT:${fingerprint} -->`,
        );
      } else {
        // 自动块或新块：添加完整标记
        fixed = content.replace(
          BLOCK_START,
          (_match, blockName) =>
            `<!-- DOCWEAVER_BLOCK_START:${blockName} -->\n<!-- DOCWEAVER-AUTO-GENERATED:${blockName} -->\n<!-- DOCWEAVER-FINGERPRINT:${fingerprint} -->`,
        );
      }
      result.push(fixed);
    } else {
      result.push(newLines[j]);
      j++;
    }
  }

  let merged = result.join('\n');

  for (const chapter of manualChapters) {
    const headerMatch = chapter.match(/^##\s+(.+)/m);
    if (headerMatch) {
      const headingRegex = new RegExp(
        `^##\\s+${headerMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
        'm',
      );
      if (!headingRegex.test(merged)) {
        merged += '\n\n' + chapter;
      }
    }
  }

  return merged;
}
