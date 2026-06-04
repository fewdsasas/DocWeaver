import { configCommand } from '../src/cli/config';
import { readConfig, writeConfig } from '../src/utils/config';
import fs from 'fs-extra';
import path from 'path';

const tmpDir = path.join(__dirname, 'fixtures', 'config-test');
const origCwd = process.cwd();

describe('cli/config', () => {
  let logSpy: jest.SpyInstance;

  beforeAll(() => {
    fs.ensureDirSync(tmpDir);
  });

  afterAll(() => {
    process.chdir(origCwd);
    fs.removeSync(tmpDir);
  });

  beforeEach(() => {
    // 清理 .docweaverrc 确保测试隔离
    fs.removeSync(path.join(tmpDir, '.docweaverrc'));
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    process.chdir(origCwd);
  });

  // --- readConfig ---

  it('readConfig: should return empty object when no .docweaverrc', () => {
    process.chdir(tmpDir);
    expect(readConfig()).toEqual({});
  });

  it('readConfig: should read valid .docweaverrc', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.docweaverrc'),
      JSON.stringify({ apiKey: 'sk-test1234', model: 'gpt-4o' }),
      'utf-8',
    );
    process.chdir(tmpDir);
    const result = readConfig();
    expect(result.apiKey).toBe('sk-test1234');
    expect(result.model).toBe('gpt-4o');
  });

  it('readConfig: should return empty object for malformed JSON', () => {
    fs.writeFileSync(path.join(tmpDir, '.docweaverrc'), '{invalid json!!!', 'utf-8');
    process.chdir(tmpDir);
    expect(readConfig()).toEqual({});
  });

  // --- writeConfig ---

  it('writeConfig: should write new config file', () => {
    process.chdir(tmpDir);
    writeConfig({ apiKey: 'sk-new' });
    const parsed = JSON.parse(fs.readFileSync(path.join(tmpDir, '.docweaverrc'), 'utf-8'));
    expect(parsed.apiKey).toBe('sk-new');
  });

  it('writeConfig: should merge with existing config', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.docweaverrc'),
      JSON.stringify({ model: 'gpt-4o' }),
      'utf-8',
    );
    process.chdir(tmpDir);
    writeConfig({ apiKey: 'sk-merge' });
    const parsed = JSON.parse(fs.readFileSync(path.join(tmpDir, '.docweaverrc'), 'utf-8'));
    expect(parsed.apiKey).toBe('sk-merge');
    expect(parsed.model).toBe('gpt-4o');
  });

  // --- configCommand ---

  it('configCommand: should mask API key in output', async () => {
    fs.writeFileSync(
      path.join(tmpDir, '.docweaverrc'),
      JSON.stringify({ apiKey: 'sk-abcdefgh12345678' }),
      'utf-8',
    );
    process.chdir(tmpDir);
    await configCommand({});
    const output = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n');
    expect(output).toContain('sk-a****5678');
    expect(output).not.toContain('abcdefgh12345678');
  });

  it('configCommand: should mask short API key completely', async () => {
    fs.writeFileSync(
      path.join(tmpDir, '.docweaverrc'),
      JSON.stringify({ apiKey: 'short' }),
      'utf-8',
    );
    process.chdir(tmpDir);
    await configCommand({});
    const output = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n');
    expect(output).toContain('****');
    expect(output).not.toContain('"short"');
  });
});
