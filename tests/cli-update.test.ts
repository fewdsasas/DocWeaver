// 模拟依赖模块
jest.mock('../src/core/pipeline', () => ({
  prepareContext: jest.fn(),
}));

jest.mock('../src/core/generator', () => ({
  generateReadme: jest.fn(),
}));

jest.mock('../src/core/merger', () => ({
  mergeUpdate: jest.fn(),
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

import { updateCommand } from '../src/cli/update';
import { prepareContext } from '../src/core/pipeline';
import { generateReadme } from '../src/core/generator';
import { mergeUpdate } from '../src/core/merger';
import fs from 'fs-extra';
import path from 'path';

const mockPrepareContext = jest.mocked(prepareContext);
const mockGenerateReadme = jest.mocked(generateReadme);
const mockMergeUpdate = jest.mocked(mergeUpdate);

const mockContext = {
  context: {
    tree: 'src/',
    metadata: { name: 'test', version: '1.0.0' },
    snippets: [],
    totalTokens: 50,
  },
  totalRedactions: 0,
};

const tmpDir = path.join(__dirname, 'fixtures', 'update-test');
const origCwd = process.cwd();

describe('updateCommand', () => {
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
    mockGenerateReadme.mockResolvedValue('# New README\n\n## 简介\n\n新内容');
    // 清理测试用的 README
    fs.removeSync(path.join(tmpDir, 'README.md'));
  });

  afterEach(() => {
    process.chdir(origCwd);
  });

  it('should generate README from scratch when no existing README', async () => {
    process.chdir(tmpDir);
    await updateCommand({});

    expect(mockGenerateReadme).toHaveBeenCalledTimes(1);
    expect(mockMergeUpdate).not.toHaveBeenCalled();
    const written = fs.readFileSync(path.join(tmpDir, 'README.md'), 'utf-8');
    expect(written).toContain('# New README');
  });

  it('should call mergeUpdate when README exists', async () => {
    fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Old README', 'utf-8');
    mockMergeUpdate.mockReturnValue('# Merged README');
    process.chdir(tmpDir);

    await updateCommand({});

    expect(mockMergeUpdate).toHaveBeenCalledTimes(1);
    const written = fs.readFileSync(path.join(tmpDir, 'README.md'), 'utf-8');
    expect(written).toBe('# Merged README');
  });

  it('should bypass merge with --force flag', async () => {
    fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Old README', 'utf-8');
    process.chdir(tmpDir);

    await updateCommand({ force: true });

    expect(mockMergeUpdate).not.toHaveBeenCalled();
    const written = fs.readFileSync(path.join(tmpDir, 'README.md'), 'utf-8');
    expect(written).toContain('# New README');
  });

  it('should not write file with --preview flag', async () => {
    fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Old README', 'utf-8');
    mockMergeUpdate.mockReturnValue('# Preview README');
    process.chdir(tmpDir);

    await updateCommand({ preview: true });

    // README 应保持旧内容（preview 不写入）
    const content = fs.readFileSync(path.join(tmpDir, 'README.md'), 'utf-8');
    expect(content).toBe('# Old README');
  });
});
