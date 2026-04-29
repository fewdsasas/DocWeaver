import { generateDocs } from '../src/llm/client';
import { buildPrompt } from '../src/llm/prompt';
import { ProjectContext } from '../src/types/context';

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
