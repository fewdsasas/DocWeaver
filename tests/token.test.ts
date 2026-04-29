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

  it('Chinese tokens should be ~5x English tokens per character', () => {
    const english = estimateTokens('abc');   // 3 * 0.3 = 0.9 ~ 1
    const chinese = estimateTokens('你好你好你好'); // 6 * 1.5 = 9
    const ratio = chinese / Math.max(english, 1);
    expect(ratio).toBeGreaterThan(3);
  });

  it('should handle empty string', () => {
    const result = estimateTokens('');
    expect(result).toBe(0);
  });
});
