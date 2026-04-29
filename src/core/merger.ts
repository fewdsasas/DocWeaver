import crypto from 'crypto';

const BLOCK_START = /<!--\s*DOCWEAVER_BLOCK_START:([^>]+)\s*-->/;
const AUTO_GENERATED = /<!--\s*DOCWEAVER-AUTO-GENERATED:([^>]+)\s*-->/;
const FINGERPRINT = /<!--\s*DOCWEAVER-FINGERPRINT:([a-f0-9]+)\s*-->/;
const BLOCK_END = /<!--\s*DOCWEAVER-END\s*-->/;

const MANUAL_CHAPTER_PATTERN = /^##\s+(致谢|贡献者|更新日志|赞助|鸣谢|Changelog|Acknowledgments?|Contributors?|Sponsors?)\s*$/m;

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
    ''
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

export function mergeUpdate(oldContent: string, newContent: string): string {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  const manualChapters = extractManualChapters(oldContent);

  const result: string[] = [];
  let i = 0;
  let j = 0;

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

  while (i < oldLines.length || j < newLines.length) {
    if (i >= oldLines.length) {
      for (; j < newLines.length; j++) result.push(newLines[j]);
      break;
    }
    if (j >= newLines.length) {
      for (; i < oldLines.length; i++) result.push(oldLines[i]);
      break;
    }

    const oldLine = oldLines[i];
    const newLine = newLines[j];

    if (newLine.match(BLOCK_START)) {
      const newBlock = extractBlock(newLines, j);
      j = newBlock.endIdx;

      const blockContentStart = newBlock.content.indexOf('\n') + 1;
      const blockContentEnd = newBlock.content.lastIndexOf('\n<!--');
      const blockBody = blockContentEnd > blockContentStart
        ? newBlock.content.substring(blockContentStart, blockContentEnd)
        : newBlock.content;
      const fingerprint = computeFingerprint(blockBody);

      if (oldLine.match(BLOCK_START)) {
        const oldBlock = extractBlock(oldLines, i);
        i = oldBlock.endIdx;
        const info = extractBlockInfo(oldBlock.content);

        if (info.hasAutoMarker) {
          const fixed = newBlock.content.replace(
            BLOCK_START,
            (match, name) => `<!-- DOCWEAVER_BLOCK_START:${name} -->\n<!-- DOCWEAVER-AUTO-GENERATED:${name} -->\n<!-- DOCWEAVER-FINGERPRINT:${fingerprint} -->`
          );
          result.push(fixed);
        } else if (info.fingerprint && info.fingerprint === fingerprint) {
          const fixed = newBlock.content.replace(
            BLOCK_START,
            (match, name) => `<!-- DOCWEAVER_BLOCK_START:${name} -->\n<!-- DOCWEAVER-AUTO-GENERATED:${name} -->\n<!-- DOCWEAVER-FINGERPRINT:${fingerprint} -->`
          );
          result.push(fixed);
        } else {
          result.push(oldBlock.content);
        }
      } else {
        result.push(newBlock.content);
      }

      continue;
    }

    result.push(oldLine);
    i++;
    j++;
  }

  let merged = result.join('\n');

  for (const chapter of manualChapters) {
    const headerMatch = chapter.match(/^##\s+(.+)/m);
    if (headerMatch) {
      const headingRegex = new RegExp(`^##\\s+${headerMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm');
      if (!headingRegex.test(merged)) {
        merged += '\n\n' + chapter;
      }
    }
  }

  return merged;
}
