import { estimateTokens } from '../src/utils/token';

describe('estimateTokens', () => {
  it('should return > 0 for pure English string', () => {
    const result = estimateTokens('Hello World');
    expect(result).toBeGreaterThan(0);
  });

  it('should return > 0 for pure Chinese string', () => {
    const result = estimateTokens('你好世界');
    expect(result).toBeGreaterThan(0);
  });

  it('should return > 0 for mixed code string', () => {
    const result = estimateTokens('const x = "hello"; // 注释');
    expect(result).toBeGreaterThan(0);
  });

  it('Chinese tokens should be ~3x English tokens per character', () => {
    const english = estimateTokens('abcdef'); // 6 * 0.55 = 3.3 → 3
    const chinese = estimateTokens('你好你好你好'); // 6 * 1.5 = 9
    const ratio = chinese / Math.max(english, 1);
    expect(ratio).toBeGreaterThan(2);
  });

  it('should handle empty string', () => {
    const result = estimateTokens('');
    expect(result).toBe(0);
  });

  it('should count CJK Extension A characters with Chinese weight', () => {
    // U+3400 是 CJK 扩展 A 的起始字符
    const extA = String.fromCodePoint(0x3400);
    const ascii = '!';
    const result = estimateTokens(extA);
    const enResult = estimateTokens(ascii);
    // CJK 权重 1.5 > 其他权重 0.8
    expect(result).toBeGreaterThan(enResult);
  });

  it('should count fullwidth characters with Chinese weight', () => {
    // Ａ (U+FF21) 是全角大写 A
    const fullwidth = 'Ａ';
    const english = 'A';
    const fwResult = estimateTokens(fullwidth);
    const enResult = estimateTokens(english);
    expect(fwResult).toBeGreaterThan(enResult);
  });

  it('should count CJK Extension B characters with Chinese weight', () => {
    // U+20000 是 CJK 扩展 B 的起始字符
    const extB = String.fromCodePoint(0x20000);
    const result = estimateTokens(extB);
    expect(result).toBe(2); // CHINESE_CHAR_WEIGHT = 1.5, rounded = 2
  });

  it('should count uppercase English letters with English weight', () => {
    const upper = estimateTokens('ABC');
    const lower = estimateTokens('abc');
    expect(upper).toBe(lower); // same weight for upper and lower
  });
});
