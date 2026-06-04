import { TOKEN } from '../config';

const { ENGLISH_CHAR_WEIGHT, CHINESE_CHAR_WEIGHT, OTHER_CHAR_WEIGHT } = TOKEN;

export function estimateTokens(text: string): number {
  let tokens = 0;

  for (const char of text) {
    const code = char.codePointAt(0)!;

    if (
      (code >= 0x4e00 && code <= 0x9fff) || // CJK 基本区
      (code >= 0x3400 && code <= 0x4dbf) || // CJK 扩展 A
      (code >= 0x20000 && code <= 0x2a6df) || // CJK 扩展 B
      (code >= 0xf900 && code <= 0xfad9) || // CJK 兼容汉字
      (code >= 0xff01 && code <= 0xff5e) // 全角字符
    ) {
      tokens += CHINESE_CHAR_WEIGHT;
    } else if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) {
      tokens += ENGLISH_CHAR_WEIGHT;
    } else {
      tokens += OTHER_CHAR_WEIGHT;
    }
  }

  return Math.round(tokens);
}
