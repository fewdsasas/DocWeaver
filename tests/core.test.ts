import { generateReadme } from '../src/core/generator';
import { mergeUpdate } from '../src/core/merger';
import { getDiff } from '../src/core/differ';
import { ProjectContext } from '../src/types/context';

const mockContext: ProjectContext = {
  tree: 'src/\n  index.ts',
  metadata: { name: 'test', version: '1.0.0' },
  snippets: [
    { path: 'src/index.ts', content: 'const x = 1;', language: 'typescript' },
  ],
  totalTokens: 100,
};

describe('generator', () => {
  const originalMock = process.env.DOCWEAVER_MOCK;

  beforeAll(() => {
    process.env.DOCWEAVER_MOCK = 'true';
  });

  afterAll(() => {
    if (originalMock !== undefined) {
      process.env.DOCWEAVER_MOCK = originalMock;
    } else {
      delete process.env.DOCWEAVER_MOCK;
    }
  });

  it('should generate readme with placeholder image', async () => {
    const result = await generateReadme(mockContext);
    expect(result).toContain('via.placeholder.com');
  });

  it('should contain license section', async () => {
    const result = await generateReadme(mockContext);
    expect(result).toContain('## 许可证');
  });
});

describe('merger', () => {
  it('should keep old content when no markers present (manual content)', () => {
    const oldContent = '## 手动编写的章节\n\n这是手动内容。';
    const newContent = '<!-- DOCWEAVER_BLOCK_START:intro -->\n## 新章节\n新内容\n<!-- DOCWEAVER-END -->';
    const result = mergeUpdate(oldContent, newContent);
    // The merger works line by line - old content has no blocks
    // Lines should be matched based on block boundaries
    expect(result).not.toBe(newContent);
  });

  it('should replace content when AUTO marker exists', () => {
    const oldContent = `<!-- DOCWEAVER_BLOCK_START:intro -->
<!-- DOCWEAVER-AUTO-GENERATED: 简介 -->
旧内容
<!-- DOCWEAVER-END -->`;

    const newContent = `<!-- DOCWEAVER_BLOCK_START:intro -->
<!-- DOCWEAVER-AUTO-GENERATED: 简介 -->
新内容
<!-- DOCWEAVER-END -->`;

    const result = mergeUpdate(oldContent, newContent);
    expect(result).toContain('新内容');
    expect(result).not.toContain('旧内容');
  });

  it('should handle content without any blocks', () => {
    const oldContent = '纯手动内容';
    const newContent = '纯手动内容';
    const result = mergeUpdate(oldContent, newContent);
    expect(result).toBe('纯手动内容');
  });

  it('should preserve old content when block has no marker and no fingerprint', () => {
    const oldContent = `<!-- DOCWEAVER_BLOCK_START:intro -->
旧内容
<!-- DOCWEAVER-END -->`;

    const newContent = `<!-- DOCWEAVER_BLOCK_START:intro -->
<!-- DOCWEAVER-AUTO-GENERATED: 简介 -->
新内容
<!-- DOCWEAVER-END -->`;

    const result = mergeUpdate(oldContent, newContent);
    // No AUTO marker and no fingerprint → keep old content (manual content protection)
    expect(result).toContain('旧内容');
  });

  it('should embed fingerprint when updating blocks with AUTO marker', () => {
    const oldContent = `<!-- DOCWEAVER_BLOCK_START:intro -->
<!-- DOCWEAVER-AUTO-GENERATED: 简介 -->
<!-- DOCWEAVER-FINGERPRINT:abcd12345678 -->
旧内容
<!-- DOCWEAVER-END -->`;

    const newContent = `<!-- DOCWEAVER_BLOCK_START:intro -->
<!-- DOCWEAVER-AUTO-GENERATED: 简介 -->
新内容
<!-- DOCWEAVER-END -->`;

    const result = mergeUpdate(oldContent, newContent);
    expect(result).toContain('DOCWEAVER-FINGERPRINT:');
    expect(result).toContain('新内容');
  });
});

describe('differ', () => {
  it('should produce diff output for different strings', () => {
    const result = getDiff('hello', 'world');
    expect(result).toContain('-');
    expect(result).toContain('+');
  });

  it('should show no diff for identical strings', () => {
    const result = getDiff('same', 'same');
    expect(result).not.toContain('+');
    expect(result).not.toContain('-');
  });
});
