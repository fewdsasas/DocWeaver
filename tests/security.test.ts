import { isBlacklisted } from '../src/security/blacklist';
import { redactContent } from '../src/security/redactor';

describe('isBlacklisted', () => {
  it('should blacklist .env files', () => {
    expect(isBlacklisted('.env')).toBe(true);
    expect(isBlacklisted('src/.env')).toBe(true);
    expect(isBlacklisted('/project/.env.local')).toBe(true);
    expect(isBlacklisted('.env.production')).toBe(true);
  });

  it('should blacklist .pem files', () => {
    expect(isBlacklisted('key.pem')).toBe(true);
    expect(isBlacklisted('ssl/private.pem')).toBe(true);
  });

  it('should blacklist credentials.json', () => {
    expect(isBlacklisted('credentials.json')).toBe(true);
    expect(isBlacklisted('config/credentials.json')).toBe(true);
  });

  it('should NOT blacklist normal files', () => {
    expect(isBlacklisted('app.ts')).toBe(false);
    expect(isBlacklisted('src/index.ts')).toBe(false);
    expect(isBlacklisted('package.json')).toBe(false);
    expect(isBlacklisted('README.md')).toBe(false);
  });

  it('should blacklist id_rsa', () => {
    expect(isBlacklisted('id_rsa')).toBe(true);
    expect(isBlacklisted('.ssh/id_rsa')).toBe(true);
  });
});

describe('redactContent', () => {
  it('should redact password assignments and report count', () => {
    const { cleanContent, redactCount } = redactContent('password=123');
    expect(cleanContent).toContain('[REDACTED_SECRET]');
    expect(redactCount).toBe(1);
  });

  it('should redact AWS keys', () => {
    const { cleanContent, redactCount } = redactContent('AKIAIOSFODNN7EXAMPLE');
    expect(cleanContent).toContain('[REDACTED_SECRET]');
    expect(redactCount).toBe(1);
  });

  it('should not modify clean content', () => {
    const { cleanContent, redactCount } = redactContent('const name = "hello world";');
    expect(cleanContent).toBe('const name = "hello world";');
    expect(redactCount).toBe(0);
  });

  it('should redact private key headers', () => {
    const { cleanContent, redactCount } = redactContent('-----BEGIN RSA PRIVATE KEY-----');
    expect(cleanContent).toContain('[REDACTED_SECRET]');
    expect(redactCount).toBe(1);
  });

  it('should redact Bearer tokens', () => {
    const { cleanContent, redactCount } = redactContent('Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U');
    expect(cleanContent).toContain('[REDACTED_SECRET]');
    expect(redactCount).toBe(1);
  });
});
