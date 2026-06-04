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

  it('should blacklist newly added sensitive files', () => {
    expect(isBlacklisted('.env.staging')).toBe(true);
    expect(isBlacklisted('.vault-token')).toBe(true);
    expect(isBlacklisted('secret.yml')).toBe(true);
    expect(isBlacklisted('secret.yaml')).toBe(true);
    expect(isBlacklisted('docker-compose.override.yml')).toBe(true);
  });

  it('should blacklist newly added sensitive extensions', () => {
    expect(isBlacklisted('state.tfstate')).toBe(true);
    expect(isBlacklisted('vars.tfvars')).toBe(true);
    expect(isBlacklisted('data.sqlite')).toBe(true);
    expect(isBlacklisted('app.db')).toBe(true);
    expect(isBlacklisted('cert.pfx')).toBe(true);
  });

  it('should blacklist SSH config path', () => {
    expect(isBlacklisted('project/.ssh/config')).toBe(true);
    expect(isBlacklisted('/home/user/.ssh/config')).toBe(true);
  });

  it('should blacklist SENSITIVE_PATHS at project root level', () => {
    // Bug fix: SENSITIVE_PATHS at root level should also be matched
    expect(isBlacklisted('.ssh/config')).toBe(true);
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
    const { cleanContent, redactCount } = redactContent(
      'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
    );
    expect(cleanContent).toContain('[REDACTED_SECRET]');
    expect(redactCount).toBe(1);
  });

  it('should redact GitHub tokens', () => {
    const { cleanContent, redactCount } = redactContent(
      'token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh',
    );
    expect(cleanContent).toContain('[REDACTED_SECRET]');
    expect(redactCount).toBe(1);
  });

  it('should redact Slack tokens', () => {
    const { cleanContent, redactCount } = redactContent('SLACK_TOKEN=xoxb-12345-67890-abcde');
    expect(cleanContent).toContain('[REDACTED_SECRET]');
    expect(redactCount).toBe(1);
  });

  it('should redact Stripe keys', () => {
    const { cleanContent, redactCount } = redactContent('sk_live_abcdefghijklmnopqrstuv');
    expect(cleanContent).toContain('[REDACTED_SECRET]');
    expect(redactCount).toBe(1);
  });

  it('should redact database connection strings', () => {
    const { cleanContent, redactCount } = redactContent(
      'DATABASE_URL=postgres://admin:s3cret@db.example.com:5432/mydb',
    );
    expect(cleanContent).toContain('[REDACTED_SECRET]');
    expect(cleanContent).not.toContain('s3cret');
    expect(redactCount).toBe(1);
  });

  it('should redact database URLs with URL-encoded characters in password', () => {
    const { cleanContent, redactCount } = redactContent(
      'mongodb://user:p%40ssword@host.example.com/db',
    );
    expect(cleanContent).toContain('[REDACTED_SECRET]');
    expect(cleanContent).not.toContain('p%40ssword');
    expect(redactCount).toBe(1);
  });

  it('should redact bare JWT tokens without Bearer prefix', () => {
    const { cleanContent, redactCount } = redactContent(
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
    );
    expect(cleanContent).toContain('[REDACTED_SECRET]');
    expect(redactCount).toBe(1);
  });

  it('should redact secret/token/apikey keyword assignments', () => {
    const { cleanContent: c1 } = redactContent('api_key=sk-abc123def456');
    expect(c1).toContain('[REDACTED_SECRET]');
    const { cleanContent: c2 } = redactContent('secret: my_secret_value');
    expect(c2).toContain('[REDACTED_SECRET]');
    const { cleanContent: c3 } = redactContent('access_key = AK_123456789');
    expect(c3).toContain('[REDACTED_SECRET]');
  });

  it('should redact GitLab tokens', () => {
    const { cleanContent, redactCount } = redactContent('GITLAB_TOKEN=glpat-ABCDEFGHijklmnopqrst');
    expect(cleanContent).toContain('[REDACTED_SECRET]');
    expect(redactCount).toBe(1);
  });

  it('should redact multi-word password values', () => {
    const { cleanContent } = redactContent('password = my secret pass word');
    expect(cleanContent).toContain('[REDACTED_SECRET]');
    expect(cleanContent).not.toContain('my secret pass word');
  });

  it('should redact env var style secrets (GITHUB_TOKEN)', () => {
    const { cleanContent, redactCount } = redactContent(
      'export GITHUB_TOKEN=ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh',
    );
    // GitHub token pattern + env var pattern 可能各匹配一次，但值至少被脱敏
    expect(cleanContent).toContain('[REDACTED_SECRET]');
    expect(cleanContent).not.toContain('ghp_ABCDEF');
  });

  it('should redact env var style AWS secret key', () => {
    const { cleanContent } = redactContent(
      'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    );
    expect(cleanContent).toContain('[REDACTED_SECRET]');
    expect(cleanContent).not.toContain('wJalrXUtnFEMI');
  });

  it('should not double-redact already redacted env vars', () => {
    // 第一次脱敏后不应产生额外的 redactCount
    const { cleanContent, redactCount } = redactContent('SLACK_TOKEN=xoxb-12345-67890-abcde');
    // Slack token 模式匹配 1 次，env var 模式因负向前瞻不匹配
    expect(cleanContent).toContain('[REDACTED_SECRET]');
    expect(redactCount).toBe(1);
  });
});
