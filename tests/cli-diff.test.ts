// 模拟依赖模块
jest.mock('../src/core/pipeline', () => ({
  prepareContext: jest.fn(),
}));

jest.mock('../src/core/generator', () => ({
  generateReadme: jest.fn(),
}));

jest.mock('../src/core/differ', () => ({
  getDiff: jest.fn(),
}));

jest.mock('ora', () => {
  const spinner = {
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
  };
  return jest.fn(() => spinner);
});

import { diffCommand } from '../src/cli/diff';
import { prepareContext } from '../src/core/pipeline';
import { generateReadme } from '../src/core/generator';
import { getDiff } from '../src/core/differ';
import fs from 'fs-extra';
import path from 'path';

const mockPrepareContext = jest.mocked(prepareContext);
const mockGenerateReadme = jest.mocked(generateReadme);
const mockGetDiff = jest.mocked(getDiff);

const mockContext = {
  context: {
    tree: 'src/',
    metadata: { name: 'test', version: '1.0.0' },
    snippets: [],
    totalTokens: 50,
  },
  totalRedactions: 0,
};

const tmpDir = path.join(__dirname, 'fixtures', 'diff-test');
const origCwd = process.cwd();

describe('diffCommand', () => {
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  beforeAll(() => {
    fs.ensureDirSync(tmpDir);
  });

  afterAll(() => {
    fs.removeSync(tmpDir);
    logSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrepareContext.mockReturnValue(mockContext);
    mockGenerateReadme.mockResolvedValue('# New README');
    fs.removeSync(path.join(tmpDir, 'README.md'));
  });

  afterEach(() => {
    process.chdir(origCwd);
  });

  it('should show diff when README exists', async () => {
    fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Old README', 'utf-8');
    mockGetDiff.mockReturnValue('- # Old README\n+ # New README');
    process.chdir(tmpDir);

    await diffCommand({});

    expect(mockGetDiff).toHaveBeenCalledWith('# Old README', '# New README');
    const allOutput = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n');
    expect(allOutput).toContain('变更差异');
  });

  it('should show preview when no README exists', async () => {
    process.chdir(tmpDir);

    await diffCommand({});

    expect(mockGetDiff).not.toHaveBeenCalled();
    const allOutput = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n');
    expect(allOutput).toContain('新生成内容预览');
    expect(allOutput).toContain('# New README');
  });

  it('should use custom source path', async () => {
    const customPath = path.join(tmpDir, 'docs', 'README.md');
    fs.ensureDirSync(path.dirname(customPath));
    fs.writeFileSync(customPath, '# Custom README', 'utf-8');
    mockGetDiff.mockReturnValue('diff output');
    process.chdir(tmpDir);

    await diffCommand({ source: 'docs/README.md' });

    expect(mockGetDiff).toHaveBeenCalledWith('# Custom README', '# New README');
  });
});
