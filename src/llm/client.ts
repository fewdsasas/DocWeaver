import { MOCK_RESPONSE } from './mock-response';
import { LLM } from '../config';
import { readConfig } from '../utils/config';

let _openaiModule: typeof import('openai') | null = null;

async function getOpenAI(): Promise<typeof import('openai')> {
  if (!_openaiModule) {
    _openaiModule = await import('openai');
  }
  return _openaiModule;
}

interface ApiError {
  status?: number;
  code?: string;
  message?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 60000;

export async function generateDocs(systemPrompt: string, userPrompt: string): Promise<string> {
  if (process.env.DOCWEAVER_MOCK === 'true') {
    return MOCK_RESPONSE;
  }

  // 优先级：环境变量 > .docweaverrc > 默认值
  const fileConfig = readConfig();
  const apiKey = process.env.DOCWEAVER_API_KEY || fileConfig.apiKey || '';
  if (!apiKey) {
    throw new Error(
      '未配置 API Key。请通过以下方式配置：\n' +
        '  docweaver config --set-key YOUR_API_KEY\n' +
        '  或设置环境变量 DOCWEAVER_API_KEY',
    );
  }

  const baseURL = process.env.DOCWEAVER_BASE_URL || fileConfig.baseUrl || LLM.DEFAULT_BASE_URL;
  const model = process.env.DOCWEAVER_MODEL || fileConfig.model || LLM.DEFAULT_MODEL;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { OpenAI } = await getOpenAI();
      const client = new OpenAI({ baseURL, apiKey });

      const response = await client.chat.completions.create(
        {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: LLM.TEMPERATURE,
        },
        { timeout: REQUEST_TIMEOUT_MS },
      );

      return response.choices?.[0]?.message?.content || '';
    } catch (err: unknown) {
      const error: ApiError =
        err !== null && typeof err === 'object' ? (err as ApiError) : { message: String(err) };

      // 仅在可重试错误时继续
      const isRetryable =
        error.status === 429 || (typeof error.status === 'number' && error.status >= 500);
      if (isRetryable && attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        continue;
      }

      // 所有尝试完毕后抛出具体错误
      if (error.status === 401 || error.status === 403) {
        throw new Error('API Key 无效或权限不足，请检查配置');
      }
      if (error.status === 429) {
        throw new Error('API 速率限制，请稍后重试');
      }
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error(`无法连接到 API 服务: ${baseURL}`);
      }
      if (
        (typeof error.message === 'string' && error.message.includes('context_length')) ||
        error.status === 400
      ) {
        throw new Error('请求内容过长，请尝试减少分析的文件数量');
      }
      const errMsg = typeof error.message === 'string' ? error.message : '未知错误';
      throw new Error(`LLM 调用失败: ${errMsg}`);
    }
  }

  throw new Error('LLM 调用失败: 超过最大重试次数');
}
