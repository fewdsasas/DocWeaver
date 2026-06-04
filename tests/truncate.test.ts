import { truncateSnippetsByPriority } from '../src/utils/truncate';
import { ScanFileItem } from '../src/types/context';

function makeFile(path: string, content: string): ScanFileItem {
  return { path, content, language: 'typescript' };
}

describe('truncateSnippetsByPriority', () => {
  const files: ScanFileItem[] = [
    makeFile('src/index.ts', 'entry file content here'), // P1
    makeFile('src/app.ts', 'another entry'), // P1
    makeFile('src/routes/users.ts', 'router.get("/users", handler)'), // P2
    makeFile('src/api/auth.ts', 'POST /login handler'), // P2
    makeFile('package.json', '{"name":"test"}'), // P3
    makeFile('.env.example', 'PORT=3000'), // P3
    makeFile('src/models/user.ts', 'export class User { ... }'), // P4
    makeFile('src/types/index.ts', 'export interface IUser {}'), // P4
    makeFile('src/utils/helper.ts', 'export function helper() {}'), // P5
    makeFile('src/components/Button.tsx', 'export const Button'), // P5
    makeFile('tests/app.test.ts', 'describe("app", () => {})'), // P5
  ];

  it('should keep high priority files when budget is tight', () => {
    // Budget is very low, only a few files should be kept
    const result = truncateSnippetsByPriority(files, 50);

    const keptPaths = result.snippets.map((f) => f.path);
    expect(keptPaths).toContain('src/index.ts');
    expect(keptPaths).toContain('src/app.ts');
    // P5 files should be dropped
    expect(keptPaths).not.toContain('src/utils/helper.ts');
    expect(keptPaths).not.toContain('tests/app.test.ts');
  });

  it('should stay within budget', () => {
    const budget = 30;
    const result = truncateSnippetsByPriority(files, budget);
    expect(result.totalTokens).toBeLessThanOrEqual(budget);
  });

  it('should keep at least one file even if over budget', () => {
    const result = truncateSnippetsByPriority(files, 1);
    expect(result.snippets.length).toBeGreaterThanOrEqual(1);
  });

  it('should truncate first file content when it alone exceeds budget', () => {
    const bigContent = Array.from({ length: 50 }, () => 'word '.repeat(20)).join('\n');
    const bigFile = makeFile('src/index.ts', bigContent);
    const result = truncateSnippetsByPriority([bigFile], 10);
    expect(result.snippets.length).toBe(1);
    // 截断后内容应短于原始内容
    expect(result.snippets[0].content.length).toBeLessThan(bigContent.length);
  });

  it('should sort by priority (P1 first)', () => {
    const result = truncateSnippetsByPriority(files, 500);
    const firstPath = result.snippets[0].path;
    // First file should be a P1 entry file
    expect(['src/index.ts', 'src/app.ts']).toContain(firstPath);
  });

  it('should include config files before models', () => {
    const result = truncateSnippetsByPriority(files, 500);
    const paths = result.snippets.map((f) => f.path);
    expect(paths).toContain('package.json');
    expect(paths).toContain('src/models/user.ts');
    const pkgIdx = paths.indexOf('package.json');
    const modelIdx = paths.indexOf('src/models/user.ts');
    expect(pkgIdx).toBeLessThan(modelIdx);
  });
});
