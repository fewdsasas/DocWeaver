import { generateDocs } from '../src/llm/client';
import { buildPrompt } from '../src/llm/prompt';
import { ProjectContext } from '../src/types/context';

// mock readConfig 以控制 .docweaverrc 的返回值
jest.mock('../src/utils/config', () => ({
  readConfig: jest.fn().mockReturnValue({}),
}));

// mock openai 模块避免真实网络调用
const mockCreate = jest
  .fn()
  .mockRejectedValue(Object.assign(new Error('mock API error'), { code: 'ENOTFOUND' }));
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}));

import { readConfig } from '../src/utils/config';
const mockReadConfig = readConfig as jest.MockedFunction<typeof readConfig>;

const mockContext: ProjectContext = {
  tree: 'src/\n  index.ts\n  utils/\n    helper.ts',
  metadata: {
    name: 'test-project',
    version: '1.0.0',
    scripts: { start: 'node index.js' },
    dependencies: ['express'],
  },
  snippets: [
    {
      path: 'src/index.ts',
      content: 'export function hello() { return "world"; }',
      language: 'typescript',
    },
  ],
  totalTokens: 500,
};

describe('prompt', () => {
  it('should build prompt with context data', () => {
    const { systemPrompt, userPrompt } = buildPrompt(mockContext);

    expect(systemPrompt).toContain('待补充');
    expect(systemPrompt).toContain('绝对禁止捏造');
    expect(userPrompt).toContain('src/index.ts');
    expect(userPrompt).toContain('test-project');
  });

  it('should include tree in user prompt', () => {
    const { userPrompt } = buildPrompt(mockContext);
    expect(userPrompt).toContain('src/');
    expect(userPrompt).toContain('index.ts');
  });
});

describe('client (mock mode)', () => {
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

  it('should return mock response when DOCWEAVER_MOCK=true', async () => {
    const result = await generateDocs('system', 'user');

    expect(result).toContain('via.placeholder.com');
    expect(result).toContain('## 许可证');
    expect(result).toContain('<!-- DOCWEAVER_BLOCK_START:');
  });

  it('mock response should contain auto-generated marker', async () => {
    const result = await generateDocs('system', 'user');
    expect(result).toContain('DOCWEAVER-AUTO-GENERATED');
  });
});

describe('client retry logic', () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...origEnv };
    delete process.env.DOCWEAVER_MOCK;
    process.env.DOCWEAVER_API_KEY = 'test-key';
    mockReadConfig.mockReturnValue({});
    mockCreate.mockReset();
  });

  afterEach(() => {
    process.env = { ...origEnv };
  });

  it('should retry on 429 rate limit errors', async () => {
    const rateLimitError = Object.assign(new Error('Rate limited'), { status: 429 });
    mockCreate
      .mockRejectedValueOnce(rateLimitError)
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'success after retry' } }],
      });

    const result = await generateDocs('system', 'user');
    expect(result).toBe('success after retry');
    expect(mockCreate).toHaveBeenCalledTimes(3);
  });

  it('should retry on 500 server errors', async () => {
    const serverError = Object.assign(new Error('Server error'), { status: 500 });
    mockCreate.mockRejectedValueOnce(serverError).mockResolvedValueOnce({
      choices: [{ message: { content: 'recovered' } }],
    });

    const result = await generateDocs('system', 'user');
    expect(result).toBe('recovered');
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('should not retry on 401 unauthorized errors', async () => {
    const authError = Object.assign(new Error('Unauthorized'), { status: 401 });
    mockCreate.mockRejectedValue(authError);

    await expect(generateDocs('system', 'user')).rejects.toThrow(/API Key 无效/);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('should throw after max retries exhausted', async () => {
    const rateLimitError = Object.assign(new Error('Rate limited'), { status: 429 });
    mockCreate.mockRejectedValue(rateLimitError);

    await expect(generateDocs('system', 'user')).rejects.toThrow(/速率限制/);
    expect(mockCreate).toHaveBeenCalledTimes(3);
  });
});

describe('client config resolution', () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    mockCreate.mockReset();
    // 恢复默认的 ENOTFOUND 错误（测试网络连接失败路径）
    mockCreate.mockRejectedValue(Object.assign(new Error('mock API error'), { code: 'ENOTFOUND' }));
  });

  afterEach(() => {
    process.env = { ...origEnv };
    mockReadConfig.mockReturnValue({});
  });

  it('should read apiKey from .docweaverrc when env var is not set', async () => {
    delete process.env.DOCWEAVER_API_KEY;
    delete process.env.DOCWEAVER_MOCK;
    mockReadConfig.mockReturnValue({ apiKey: 'test-key-from-file' });

    // 有 apiKey 所以不会抛 "未配置 API Key"，而是因 mock API 失败
    await expect(generateDocs('system', 'user')).rejects.toThrow(/无法连接到 API 服务/);
  });

  it('should prefer env var over .docweaverrc', async () => {
    process.env.DOCWEAVER_API_KEY = 'env-key';
    delete process.env.DOCWEAVER_MOCK;
    mockReadConfig.mockReturnValue({ apiKey: 'file-key' });

    // env key 被使用，不会报 "未配置 API Key"
    await expect(generateDocs('system', 'user')).rejects.toThrow(/无法连接到 API 服务/);
  });

  it('should throw when no API key anywhere', async () => {
    delete process.env.DOCWEAVER_API_KEY;
    delete process.env.DOCWEAVER_MOCK;
    mockReadConfig.mockReturnValue({});

    await expect(generateDocs('system', 'user')).rejects.toThrow(/未配置 API Key/);
  });
});
