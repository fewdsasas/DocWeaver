import { ProjectContext, ScanFileItem } from '../src/types/context';

// 模拟所有依赖模块
jest.mock('../src/core/scanner', () => ({
  scanProject: jest.fn(),
}));

jest.mock('../src/core/parser', () => ({
  parseAllMetadata: jest.fn(),
}));

jest.mock('../src/security/redactor', () => ({
  redactContent: jest.fn(),
}));

jest.mock('../src/utils/token', () => ({
  estimateTokens: jest.fn(),
}));

jest.mock('../src/utils/truncate', () => ({
  truncateSnippetsByPriority: jest.fn(),
}));

import { prepareContext } from '../src/core/pipeline';
import { scanProject } from '../src/core/scanner';
import { parseAllMetadata } from '../src/core/parser';
import { redactContent } from '../src/security/redactor';
import { estimateTokens } from '../src/utils/token';
import { truncateSnippetsByPriority } from '../src/utils/truncate';

const mockScanProject = jest.mocked(scanProject);
const mockParseAllMetadata = jest.mocked(parseAllMetadata);
const mockRedactContent = jest.mocked(redactContent);
const mockEstimateTokens = jest.mocked(estimateTokens);
const mockTruncateSnippetsByPriority = jest.mocked(truncateSnippetsByPriority);

// 抑制控制台输出
const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

const sampleFiles: ScanFileItem[] = [
  { path: 'src/index.ts', content: 'const x = 1;', language: 'typescript' },
  { path: 'src/app.ts', content: 'export const app = {};', language: 'typescript' },
];

describe('prepareContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockScanProject.mockReturnValue({ snippets: sampleFiles, tree: 'src/\n  index.ts\n  app.ts' });
    mockRedactContent.mockImplementation((content: string) => ({
      cleanContent: content,
      redactCount: 0,
    }));
    mockEstimateTokens.mockReturnValue(50);
    mockParseAllMetadata.mockReturnValue({
      name: 'test-project',
      version: '1.0.0',
      packageManager: 'npm',
      dependencies: [],
    });
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it('should return context with tree, metadata, snippets and totalTokens', () => {
    const { context, totalRedactions } = prepareContext('/test');

    expect(context.tree).toBe('src/\n  index.ts\n  app.ts');
    expect(context.metadata.name).toBe('test-project');
    expect(context.metadata.version).toBe('1.0.0');
    expect(context.snippets).toHaveLength(2);
    expect(context.totalTokens).toBe(100); // 50 * 2
    expect(totalRedactions).toBe(0);
  });

  it('should call scanProject with the given cwd', () => {
    prepareContext('/my/project');
    expect(mockScanProject).toHaveBeenCalledWith('/my/project');
  });

  it('should redact content for each file', () => {
    prepareContext('/test');

    expect(mockRedactContent).toHaveBeenCalledTimes(2);
    expect(mockRedactContent).toHaveBeenCalledWith('const x = 1;');
    expect(mockRedactContent).toHaveBeenCalledWith('export const app = {};');
  });

  it('should parse metadata from redacted files', () => {
    prepareContext('/test');

    expect(mockParseAllMetadata).toHaveBeenCalledTimes(1);
    const passedFiles = mockParseAllMetadata.mock.calls[0][0];
    expect(passedFiles).toHaveLength(2);
    expect(passedFiles[0].content).toBe('const x = 1;');
  });

  it('should estimate tokens for each file', () => {
    prepareContext('/test');

    expect(mockEstimateTokens).toHaveBeenCalledTimes(2);
    expect(mockEstimateTokens).toHaveBeenCalledWith('const x = 1;');
    expect(mockEstimateTokens).toHaveBeenCalledWith('export const app = {};');
  });

  it('should truncate when totalTokens exceeds budget', () => {
    mockEstimateTokens.mockReturnValue(4000);
    const truncatedSnippets: ScanFileItem[] = [
      { path: 'src/index.ts', content: 'const x = 1;', language: 'typescript' },
    ];
    mockTruncateSnippetsByPriority.mockReturnValue({
      snippets: truncatedSnippets,
      totalTokens: 3000,
    });

    const { context } = prepareContext('/test');

    expect(mockTruncateSnippetsByPriority).toHaveBeenCalledTimes(1);
    expect(context.snippets).toHaveLength(1);
    expect(context.totalTokens).toBe(3000);
  });

  it('should not truncate when totalTokens is within budget', () => {
    mockEstimateTokens.mockReturnValue(50);

    const { context } = prepareContext('/test');

    expect(mockTruncateSnippetsByPriority).not.toHaveBeenCalled();
    expect(context.snippets).toHaveLength(2);
    expect(context.totalTokens).toBe(100);
  });

  it('should count and report redactions', () => {
    let callCount = 0;
    mockRedactContent.mockImplementation((content: string) => {
      callCount++;
      return { cleanContent: content, redactCount: callCount === 1 ? 3 : 0 };
    });

    const { totalRedactions } = prepareContext('/test');

    expect(totalRedactions).toBe(3);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('已脱敏 3 处'));
  });

  it('should use custom maxTokens when provided', () => {
    mockEstimateTokens.mockReturnValue(800);
    mockTruncateSnippetsByPriority.mockReturnValue({
      snippets: [sampleFiles[0]],
      totalTokens: 800,
    });

    prepareContext('/test', { maxTokens: 1000 });

    expect(mockTruncateSnippetsByPriority).toHaveBeenCalledWith(expect.any(Array), 1000);
  });

  it('should apply extraMeta to metadata', () => {
    const { context } = prepareContext('/test', {
      extraMeta: { language: 'en', template: 'cli' },
    });

    expect(context.metadata.language).toBe('en');
    expect(context.metadata.template).toBe('cli');
    // 原有元数据保留
    expect(context.metadata.name).toBe('test-project');
  });

  it('should use default TOKEN.BUDGET when maxTokens is not specified', () => {
    mockEstimateTokens.mockReturnValue(7000);
    mockTruncateSnippetsByPriority.mockReturnValue({
      snippets: sampleFiles,
      totalTokens: 6000,
    });

    prepareContext('/test');

    // 默认预算为 6000（来自 config.ts）
    expect(mockTruncateSnippetsByPriority).toHaveBeenCalledWith(expect.any(Array), 6000);
  });
});
