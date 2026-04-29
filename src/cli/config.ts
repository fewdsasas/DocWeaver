import path from 'path';
import fs from 'fs-extra';

const CONFIG_FILE = '.docweaverrc';

interface DocWeaverConfig {
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

export async function configCommand(options: {
  setKey?: string;
  setModel?: string;
  setBaseUrl?: string;
}): Promise<void> {
  const config: DocWeaverConfig = {};

  if (options.setKey) config.apiKey = options.setKey;
  if (options.setModel) config.model = options.setModel;
  if (options.setBaseUrl) config.baseUrl = options.setBaseUrl;

  if (Object.keys(config).length > 0) {
    writeConfig(config);
    console.log('✅ 配置已保存到 .docweaverrc');
    console.log('⚠️  .docweaverrc 包含 API 密钥，请勿提交到版本控制系统。建议将 .docweaverrc 添加到 .gitignore。');
  } else {
    const current = readConfig();
    console.log(JSON.stringify(current, null, 2));
  }
}
