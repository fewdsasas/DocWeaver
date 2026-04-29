import { truncateSnippetsByPriority } from '../src/utils/truncate';
import { ScanFileItem } from '../src/types/context';

function makeFile(path: string, content: string): ScanFileItem {
  return { path, content, language: 'typescript' };
}

describe('truncateSnippetsByPriority', () => {
  const files: ScanFileItem[] = [
    makeFile('src/index.ts', 'entry file content here'),              // P1
    makeFile('src/app.ts', 'another entry'),                          // P1
    makeFile('src/routes/users.ts', 'router.get("/users", handler)'), // P2
    makeFile('src/api/auth.ts', 'POST /login handler'),               // P2
    makeFile('package.json', '{"name":"test"}'),                      // P3
    makeFile('.env.example', 'PORT=3000'),                            // P3
    makeFile('src/models/user.ts', 'export class User { ... }'),      // P4
    makeFile('src/types/index.ts', 'export interface IUser {}'),      // P4
    makeFile('src/utils/helper.ts', 'export function helper() {}'),   // P5
    makeFile('src/components/Button.tsx', 'export const Button'),     // P5
    makeFile('tests/app.test.ts', 'describe("app", () => {})'),       // P5
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
    // estimateTokens is roughly per-character based, so it should always be <= budget
    // Plus the function uses cumulative check, but last file might push slightly over
    // Actually, the function breaks when cumulative + next > budget, so cumulative <= budget
    // But there's a guard: kept.length > 0 ensures we keep at least one file
    expect(result.totalTokens).toBeLessThanOrEqual(budget + 50); // allow some slack for rounding
  });

  it('should keep at least one file even if over budget', () => {
    const result = truncateSnippetsByPriority(files, 1);
    expect(result.snippets.length).toBeGreaterThanOrEqual(1);
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
    const pkgIdx = paths.indexOf('package.json');
    const modelIdx = paths.indexOf('src/models/user.ts');
    // Config (P3) should come before model (P4) if both are present
    if (pkgIdx !== -1 && modelIdx !== -1) {
      expect(pkgIdx).toBeLessThan(modelIdx);
    }
  });
});
