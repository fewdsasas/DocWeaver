import { readConfig, writeConfig, DocWeaverConfig } from '../utils/config';

function maskApiKey(key: string): string {
  if (key.length <= 8) return '****';
  return key.slice(0, 4) + '****' + key.slice(-4);
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
    console.log(
      '⚠️  .docweaverrc 包含 API 密钥，请勿提交到版本控制系统。建议将 .docweaverrc 添加到 .gitignore。',
    );
  } else {
    const current = readConfig();
    const display: Record<string, unknown> = { ...current };
    if (typeof display.apiKey === 'string') {
      display.apiKey = maskApiKey(display.apiKey);
    }
    console.log(JSON.stringify(display, null, 2));
  }
}
