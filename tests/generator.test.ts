import { ProjectContext } from '../src/types/context';

// 模拟 LLM 客户端，返回可控的原始内容
const mockGenerateDocs = jest.fn();

jest.mock('../src/llm/client', () => ({
  generateDocs: (...args: unknown[]) => mockGenerateDocs(...args),
}));

// 确保 prompt 和 templates 正常工作（不模拟）
import { generateReadme } from '../src/core/generator';

const baseContext: ProjectContext = {
  tree: 'src/\n  index.ts',
  metadata: { name: 'test-project', version: '1.0.0' },
  snippets: [{ path: 'src/index.ts', content: 'const x = 1;', language: 'typescript' }],
  totalTokens: 100,
};

describe('generator quality checks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. placeholder image', () => {
    it('should prepend placeholder image when LLM output lacks one', async () => {
      mockGenerateDocs.mockResolvedValue('# My Project\n\n## 简介\n\n一个好项目');
      const result = await generateReadme(baseContext);
      expect(result).toContain('via.placeholder.com');
      expect(result).toContain('替换为实际截图');
    });

    it('should NOT add placeholder when LLM output already has one', async () => {
      mockGenerateDocs.mockResolvedValue(
        '# My Project\n\n![Demo](https://via.placeholder.com/800x400?text=Demo)\n\n## 简介\n\n一个好项目',
      );
      const result = await generateReadme(baseContext);
      // 只应有一个 via.placeholder.com（LLM 输出的那个）
      const matches = result.match(/via\.placeholder\.com/g);
      expect(matches).toHaveLength(1);
    });
  });

  describe('2. logo centering', () => {
    it('should wrap H1 in centered div when not already centered', async () => {
      mockGenerateDocs.mockResolvedValue('# DocWeaver\n\n## 简介\n\n一个好项目');
      const result = await generateReadme(baseContext);
      expect(result).toContain('<div align="center">');
      expect(result).toContain('</div>');
      expect(result).toContain('# DocWeaver');
      // 标题应在 div 标签内
      const divStart = result.indexOf('<div align="center">');
      const h1Pos = result.indexOf('# DocWeaver');
      const divEnd = result.indexOf('</div>');
      expect(h1Pos).toBeGreaterThan(divStart);
      expect(h1Pos).toBeLessThan(divEnd);
    });

    it('should NOT wrap when content already has centered div', async () => {
      const content = '<div align="center">\n\n# DocWeaver\n\n</div>\n\n## 简介\n\n一个好项目';
      mockGenerateDocs.mockResolvedValue(content);
      const result = await generateReadme(baseContext);
      // 不应出现第二个 div
      const divMatches = result.match(/<div align="center">/g);
      expect(divMatches).toHaveLength(1);
    });

    it('should correctly position closing div after title even with duplicate title text', async () => {
      // Bug 回归：标题文本在内容中重复出现时，闭合 div 应在正确位置
      const content = '# MyTitle\n\n## 简介\n\nMyTitle 是一个工具\n\n## 使用\n\n运行 MyTitle';
      mockGenerateDocs.mockResolvedValue(content);
      const result = await generateReadme(baseContext);
      const divStart = result.indexOf('<div align="center">');
      const divEnd = result.indexOf('</div>');
      const h2Pos = result.indexOf('## 简介');
      // </div> 应在 ## 简介 之前
      expect(divEnd).toBeLessThan(h2Pos);
      expect(divStart).toBeLessThan(divEnd);
    });
  });

  describe('3. badge injection', () => {
    it('should inject default badges when LLM output has fewer than 3', async () => {
      mockGenerateDocs.mockResolvedValue(
        '<div align="center">\n\n# DocWeaver\n\n</div>\n\n## 简介\n\n一个好项目',
      );
      const result = await generateReadme(baseContext);
      expect(result).toContain('img.shields.io');
      expect(result).toContain('version-1.0.0-blue');
      expect(result).toContain('license-GPL%20v3-green');
    });

    it('should NOT inject badges when LLM output already has 3+', async () => {
      mockGenerateDocs.mockResolvedValue(
        '# DocWeaver\n\n![Version](https://img.shields.io/badge/version-1.0.0-blue)\n![License](https://img.shields.io/badge/license-GPL%20v3-green)\n![Node](https://img.shields.io/badge/node-18-brightgreen)\n\n## 简介\n\n好项目',
      );
      const result = await generateReadme(baseContext);
      // 不应注入额外的版本徽章
      const versionMatches = result.match(/version-1\.0\.0-blue/g);
      expect(versionMatches).toHaveLength(1);
    });

    it('should inject badges after </div> not inside code blocks', async () => {
      // Bug 回归：当 ## 出现在代码块内时，徽章不应插入到代码块内
      mockGenerateDocs.mockResolvedValue(
        '<div align="center">\n\n# DocWeaver\n\n</div>\n\n```markdown\n## 示例标题\n示例内容\n```\n\n## 简介\n\n一个好项目',
      );
      const result = await generateReadme(baseContext);
      const divEnd = result.indexOf('</div>');
      const badgePos = result.indexOf('img.shields.io');
      // 徽章应在 </div> 之后，而不是代码块内的 ## 之前
      expect(badgePos).toBeGreaterThan(divEnd);
    });

    it('should insert badges before first H2 when no centered div exists', async () => {
      mockGenerateDocs.mockResolvedValue('# DocWeaver\n\n## 简介\n\n一个好项目');
      const result = await generateReadme(baseContext);
      const badgePos = result.indexOf('img.shields.io');
      const h2Pos = result.indexOf('## 简介');
      expect(badgePos).toBeLessThan(h2Pos);
    });
  });

  describe('5. installation code block', () => {
    it('should inject install command when no bash code block and heading exists', async () => {
      mockGenerateDocs.mockResolvedValue(
        '# DocWeaver\n\n## 安装\n\n请安装本工具\n\n## 简介\n\n好项目',
      );
      const result = await generateReadme(baseContext);
      expect(result).toContain('```bash');
      expect(result).toContain('npm install');
    });

    it('should NOT inject when bash code block already exists', async () => {
      mockGenerateDocs.mockResolvedValue(
        '# DocWeaver\n\n## 安装\n\n```bash\nnpm install docweaver\n```\n\n## 简介\n\n好项目',
      );
      const result = await generateReadme(baseContext);
      // 只应有一个 npm install（原始的那个）
      const installMatches = result.match(/npm install/g);
      expect(installMatches).toHaveLength(1);
    });
  });

  describe('6. license section', () => {
    it('should append license section when missing', async () => {
      mockGenerateDocs.mockResolvedValue('# DocWeaver\n\n## 简介\n\n好项目');
      const result = await generateReadme(baseContext);
      expect(result).toContain('## 许可证');
    });

    it('should NOT append license section when already present', async () => {
      mockGenerateDocs.mockResolvedValue(
        '# DocWeaver\n\n## 简介\n\n好项目\n\n## License\n\nGPL-3.0',
      );
      const result = await generateReadme(baseContext);
      const licenseMatches = result.match(/## (?:许可证|License)/g);
      expect(licenseMatches).toHaveLength(1);
    });
  });

  describe('7. description length', () => {
    it('should trim description exceeding 40 characters', async () => {
      const longDesc =
        '这是一个非常非常非常非常非常非常非常非常非常非常长的项目描述应该被截断到40字以内处理';
      mockGenerateDocs.mockResolvedValue(
        `# DocWeaver\n\n## 项目简介\n\n${longDesc}\n\n## 功能\n\n特性一`,
      );
      const result = await generateReadme(baseContext);
      expect(result).toContain('...');
      expect(result).not.toContain(longDesc);
    });
  });

  describe('9. FAQ at beginning', () => {
    it('should warn when FAQ appears at the beginning of document', async () => {
      // FAQ 出现在文档前 20%
      const lines = ['# DocWeaver\n', ...Array(19).fill('filler line\n'), '## FAQ\n\nQ: 怎么用？'];
      mockGenerateDocs.mockResolvedValue(lines.join(''));
      const result = await generateReadme(baseContext);
      expect(result).toContain('FAQ');
      expect(result).toContain('文档生成提示');
    });
  });

  describe('10. disclaimer', () => {
    it('should always append disclaimer at the end', async () => {
      mockGenerateDocs.mockResolvedValue('# DocWeaver\n\n## 简介\n\n一个好项目');
      const result = await generateReadme(baseContext);
      expect(result).toContain('AI 辅助生成');
      expect(result).toContain('以实际代码为准');
    });
  });

  describe('warn prefix', () => {
    it('should append warnings when quality issues exist', async () => {
      // 提供缺少多个必要元素的内容以触发警告
      mockGenerateDocs.mockResolvedValue('# DocWeaver\n\n## 介绍\n\n项目');
      const result = await generateReadme(baseContext);
      // 应该有警告标记
      expect(result).toContain('文档生成提示');
    });
  });
});
