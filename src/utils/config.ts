import path from 'path';
import fs from 'fs-extra';

const CONFIG_FILE = '.docweaverrc';

export interface DocWeaverConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export function readConfig(): DocWeaverConfig {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export function writeConfig(config: DocWeaverConfig): void {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  const existing = readConfig();
  const merged = { ...existing, ...config };
  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf-8');
}
