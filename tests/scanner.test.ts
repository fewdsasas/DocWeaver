import path from 'path';
import fs from 'fs-extra';
import { scanDir, buildTree } from '../src/core/scanner';
import { parseAllMetadata } from '../src/core/parser';
import { SCANNER } from '../src/config';

const FIXTURES = path.resolve(process.cwd(), 'tests/fixtures/mock-project');

describe('scanner', () => {
  it('should scan directory and return file items', () => {
    const files = scanDir(FIXTURES);
    const paths = files.map((f) => f.path);

    expect(paths.length).toBeGreaterThan(0);
    expect(paths).toContain('package.json');
    expect(paths).toContain('src/index.ts');
    expect(paths).toContain('src/large-file.ts');
  });

  it('should filter blacklisted files', () => {
    const files = scanDir(FIXTURES);
    const paths = files.map((f) => f.path);

    // .env and key.pem should be filtered
    expect(paths.some((p) => p.includes('.env'))).toBe(false);
    expect(paths.some((p) => p.includes('key.pem'))).toBe(false);
  });

  it('should truncate files > 100 lines', () => {
    const files = scanDir(FIXTURES);
    const largeFile = files.find((f) => f.path === 'src/large-file.ts');

    expect(largeFile).toBeDefined();
    // The truncated content should be less than the original but > 0
    expect(largeFile!.content).toContain('truncated');
    // First 50 lines should contain imports
    expect(largeFile!.content).toContain('import');
    // Last 50 lines should contain exports
    expect(largeFile!.content).toContain('export function finalExport');
  });

  it('should include component files (collapsed dir)', () => {
    const files = scanDir(FIXTURES);
    const components = files.filter((f) => f.path.startsWith('src/components/'));
    expect(components.length).toBe(25);
  });
});

describe('buildTree', () => {
  it('should return a tree string', () => {
    const tree = buildTree(FIXTURES);
    expect(tree).toContain('package.json');
    expect(tree).toContain('src/');
  });

  it('should collapse directories with > 20 files', () => {
    const tree = buildTree(FIXTURES);
    // The components directory has 25 files (>20), so it should be collapsed
    expect(tree).toContain('components/...');
    expect(tree).toContain('files');
  });
});

describe('parser', () => {
  it('should extract metadata from package.json', () => {
    const files = scanDir(FIXTURES);
    const meta = parseAllMetadata(files);

    expect(meta.name).toBe('mock-project');
    expect(meta.version).toBe('1.0.0');
    expect(meta.scripts).toHaveProperty('start');
    expect(meta.scripts).toHaveProperty('build');
    expect(meta.scripts).toHaveProperty('test');
  });

  it('should extract dependency names without versions', () => {
    const files = scanDir(FIXTURES);
    const meta = parseAllMetadata(files);

    expect(meta.dependencies).toContain('express');
    expect(meta.dependencies).toContain('lodash');
    expect(meta.dependencies!.every((d: string) => !d.includes('^'))).toBe(true);
  });

  it('should use fallback when no package files found', () => {
    const meta = parseAllMetadata([]);
    expect(meta.name).toBe('待补充');
    expect(meta.version).toBe('0.1.0');
  });

  it('should handle invalid JSON content gracefully', () => {
    const meta = parseAllMetadata([
      {
        path: 'package.json',
        content: 'not valid json {{}',
        language: 'json',
      },
    ]);
    expect(meta.name).toBe('待补充');
  });

  it('should handle package.json without dependencies', () => {
    const meta = parseAllMetadata([
      {
        path: 'package.json',
        content: JSON.stringify({ name: 'bare', version: '0.0.1' }),
        language: 'json',
      },
    ]);
    expect(meta.name).toBe('bare');
    expect(meta.dependencies).toEqual([]);
    expect(meta.devDependencies).toEqual([]);
  });
});

describe('scanner protections', () => {
  it('should have MAX_DEPTH configured', () => {
    expect(SCANNER.MAX_DEPTH).toBe(20);
  });

  it('should skip files larger than MAX_FILE_SIZE', () => {
    const tmpDir = path.resolve(process.cwd(), 'tests/fixtures/large-file-test');
    fs.mkdirSync(tmpDir, { recursive: true });
    // 创建一个超过 1MB 的文件
    const bigPath = path.join(tmpDir, 'big.txt');
    fs.writeFileSync(bigPath, 'x'.repeat(SCANNER.MAX_FILE_SIZE + 100));
    fs.writeFileSync(path.join(tmpDir, 'small.txt'), 'hello');

    const files = scanDir(tmpDir);
    const paths = files.map((f) => f.path);

    expect(paths).toContain('small.txt');
    expect(paths).not.toContain('big.txt');

    // 清理
    fs.removeSync(tmpDir);
  });
});

describe('parseAllMetadata', () => {
  it('should parse go.mod', () => {
    const meta = parseAllMetadata([
      {
        path: 'go.mod',
        content:
          'module github.com/example/app\n\ngo 1.21\n\nrequire (\n\tgithub.com/gorilla/mux v1.8.0\n)',
        language: 'text',
      },
    ]);
    expect(meta.name).toBe('github.com/example/app');
    expect(meta.goVersion).toBe('1.21');
    expect(meta.packageManager).toBe('go');
    expect(meta.dependencies).toContain('github.com/gorilla/mux');
  });

  it('should parse Cargo.toml', () => {
    const meta = parseAllMetadata([
      {
        path: 'Cargo.toml',
        content: '[package]\nname = "my-app"\nversion = "0.2.0"',
        language: 'toml',
      },
    ]);
    expect(meta.name).toBe('my-app');
    expect(meta.version).toBe('0.2.0');
    expect(meta.packageManager).toBe('cargo');
  });

  it('should parse requirements.txt', () => {
    const meta = parseAllMetadata([
      {
        path: 'requirements.txt',
        content: 'flask>=2.0\nrequests==2.28.0\n# comment\nnumpy',
        language: 'text',
      },
    ]);
    expect(meta.packageManager).toBe('pip');
    expect(meta.dependencies).toContain('flask');
    expect(meta.dependencies).toContain('requests');
    expect(meta.dependencies).toContain('numpy');
  });

  it('should fallback when no package files found', () => {
    const meta = parseAllMetadata([]);
    expect(meta.name).toBe('待补充');
    expect(meta.version).toBe('0.1.0');
  });

  it('should prefer package.json name over go.mod when both exist', () => {
    const meta = parseAllMetadata([
      { path: 'package.json', content: '{"name":"node-app","version":"1.0.0"}', language: 'json' },
      { path: 'go.mod', content: 'module github.com/example/app\n\ngo 1.21', language: 'text' },
    ]);
    expect(meta.name).toBe('node-app');
    expect(meta.packageManager).toBe('npm');
  });
});
