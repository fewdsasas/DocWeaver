import { TOKEN } from '../config';

const { ENGLISH_CHAR_WEIGHT, CHINESE_CHAR_WEIGHT, OTHER_CHAR_WEIGHT } = TOKEN;

export function estimateTokens(text: string): number {
  let tokens = 0;

  for (const char of text) {
    const code = char.codePointAt(0)!;

    if (code >= 0x4E00 && code <= 0x9FFF) {
      tokens += CHINESE_CHAR_WEIGHT;
    } else if ((code >= 0x41 && code <= 0x5A) || (code >= 0x61 && code <= 0x7A)) {
      tokens += ENGLISH_CHAR_WEIGHT;
    } else {
      tokens += OTHER_CHAR_WEIGHT;
    }
  }

  return Math.round(tokens);
}
