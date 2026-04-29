import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';

const TEST_DIR = path.resolve(process.cwd(), 'tests/fixtures/integration-test');

beforeEach(() => {
  fs.ensureDirSync(TEST_DIR);
  fs.writeFileSync(
    path.join(TEST_DIR, 'package.json'),
    JSON.stringify({ name: 'int-test', version: '1.0.0', scripts: { start: 'node .' } }, null, 2)
  );
  fs.writeFileSync(path.join(TEST_DIR, 'index.ts'), 'export function main() { return 1; }');
  fs.writeFileSync(
    path.join(TEST_DIR, '.gitignore'),
    'node_modules/\ndist/\n'
  );
});

afterEach(() => {
  fs.removeSync(TEST_DIR);
});

describe('integration: docweaver init', () => {
  it('should generate README.md with MOCK mode', () => {
    const result = execSync(
      'node ../../../dist/index.js init',
      {
        cwd: TEST_DIR,
        env: { ...process.env, DOCWEAVER_MOCK: 'true' },
        encoding: 'utf-8',
      }
    );

    expect(result).toMatch(/生成|generated|README/i);

    const readmeExists =
      fs.existsSync(path.join(TEST_DIR, 'README.md')) ||
      fs.existsSync(path.join(TEST_DIR, 'README.docweaver.md'));
    expect(readmeExists).toBe(true);
  }, 30000);
});
