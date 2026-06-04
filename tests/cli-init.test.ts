// 模拟依赖模块
jest.mock('../src/core/pipeline', () => ({
  prepareContext: jest.fn(),
}));

jest.mock('../src/core/generator', () => ({
  generateReadme: jest.fn(),
}));

jest.mock('../src/utils/token', () => ({
  estimateTokens: jest.fn().mockReturnValue(100),
}));

jest.mock('ora', () => {
  const spinner = {
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
  };
  return jest.fn(() => spinner);
});

import { initCommand } from '../src/cli/init';
import { prepareContext } from '../src/core/pipeline';
import { generateReadme } from '../src/core/generator';
import fs from 'fs-extra';
import path from 'path';

const mockPrepareContext = jest.mocked(prepareContext);
const mockGenerateReadme = jest.mocked(generateReadme);

const mockContext = {
  context: {
    tree: 'src/',
    metadata: { name: 'test', version: '1.0.0', packageManager: 'npm' },
    snippets: [],
    totalTokens: 50,
  },
  totalRedactions: 0,
};

const tmpDir = path.join(__dirname, 'fixtures', 'init-test');
const origCwd = process.cwd();

describe('initCommand', () => {
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  beforeAll(() => {
    fs.ensureDirSync(tmpDir);
  });

  afterAll(() => {
    process.chdir(origCwd);
    fs.removeSync(tmpDir);
    logSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrepareContext.mockReturnValue(mockContext);
    mockGenerateReadme.mockResolvedValue('# New README\n\n## 简介\n\n测试项目');
    // 清理 README 文件
    fs.removeSync(path.join(tmpDir, 'README.md'));
    fs.removeSync(path.join(tmpDir, 'README.docweaver.md'));
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(origCwd);
  });

  it('should write README.md when no existing README', async () => {
    await initCommand({});

    const written = fs.readFileSync(path.join(tmpDir, 'README.md'), 'utf-8');
    expect(written).toContain('# New README');
    expect(mockGenerateReadme).toHaveBeenCalledTimes(1);
  });

  it('should write README.docweaver.md when README.md exists', async () => {
    fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Existing README', 'utf-8');

    await initCommand({});

    const written = fs.readFileSync(path.join(tmpDir, 'README.docweaver.md'), 'utf-8');
    expect(written).toContain('# New README');
    // 原有 README 不应被覆盖
    const existing = fs.readFileSync(path.join(tmpDir, 'README.md'), 'utf-8');
    expect(existing).toBe('# Existing README');
  });

  it('should NOT write file in dry-run mode', async () => {
    await initCommand({ dryRun: true });

    expect(fs.existsSync(path.join(tmpDir, 'README.md'))).toBe(false);
    const allOutput = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n');
    expect(allOutput).toContain('预览');
  });

  it('should write to custom output path', async () => {
    await initCommand({ output: 'DOCS.md' });

    const written = fs.readFileSync(path.join(tmpDir, 'DOCS.md'), 'utf-8');
    expect(written).toContain('# New README');
    fs.removeSync(path.join(tmpDir, 'DOCS.md'));
  });

  it('should pass language option to prepareContext', async () => {
    await initCommand({ language: 'en' });

    expect(mockPrepareContext).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        extraMeta: expect.objectContaining({ language: 'en' }),
      }),
    );
  });
});
