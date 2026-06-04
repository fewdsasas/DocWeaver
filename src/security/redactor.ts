const REDACTED = '[REDACTED_SECRET]';

const PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // AWS Access Key
  { pattern: /AKIA[0-9A-Z]{16}/g, replacement: REDACTED },
  // OpenAI / sk- prefixed keys
  { pattern: /sk-[a-zA-Z0-9]{20,}/g, replacement: REDACTED },
  // Private keys (完整块优先，仅有头部也匹配)
  {
    pattern:
      /-----BEGIN\s+(?:RSA\s+|EC\s+|OPENSSH\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA\s+|EC\s+|OPENSSH\s+)?PRIVATE\s+KEY-----/g,
    replacement: REDACTED,
  },
  {
    pattern: /-----BEGIN\s+(?:RSA\s+|EC\s+|OPENSSH\s+)?PRIVATE\s+KEY-----/g,
    replacement: REDACTED,
  },
  // GitHub Token (ghp_, github_pat_, gho_, ghs_, ghr_)
  { pattern: /gh[pousr]_[a-zA-Z0-9]{36,}/g, replacement: REDACTED },
  { pattern: /github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59,}/g, replacement: REDACTED },
  // GitLab Token
  { pattern: /glpat-[a-zA-Z0-9\-_]{20,}/g, replacement: REDACTED },
  // Slack Token
  { pattern: /xox[bpars]-[a-zA-Z0-9\-]{10,}/g, replacement: REDACTED },
  // Google API Key
  { pattern: /AIzaSy[a-zA-Z0-9_\-]{33}/g, replacement: REDACTED },
  // Stripe Key
  { pattern: /(?:sk|pk)_(?:live|test)_[a-zA-Z0-9]{20,}/g, replacement: REDACTED },
  // Database connection strings (支持 URL 编码字符如 %40)
  {
    pattern:
      /(?:mysql|postgres(?:ql)?|mongodb(?:\+srv)?|redis):\/\/(?:%[0-9a-fA-F]{2}|[^\s"'@])+@(?:%[0-9a-fA-F]{2}|[^\s"'])+/gi,
    replacement: REDACTED,
  },
  // Bearer JWT Token (3段式，允许 = padding)
  {
    pattern: /bearer\s+[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-=]+/gi,
    replacement: 'bearer ' + REDACTED,
  },
  // 裸 JWT Token (无 Bearer 前缀)
  { pattern: /eyJ[a-zA-Z0-9_\-]+\.eyJ[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-=]+/g, replacement: REDACTED },
  // 密码/密钥赋值（支持多词值，匹配到行尾）
  {
    pattern:
      /(?<![a-zA-Z_])((?:password|passwd|pwd|secret|token|apikey|api_key|access_key|private_key|auth_token)\s*[:=]\s*)\S.*/gi,
    replacement: '$1' + REDACTED,
  },
  // 环境变量风格的密钥赋值（如 export GITHUB_TOKEN=xxx，排除已脱敏值）
  {
    pattern:
      /(?<=^|\s)(?:export\s+)?[A-Z][A-Z0-9_]*(?:SECRET|TOKEN|KEY|PASSWORD|PASSWD|CREDENTIAL)[A-Z0-9_]*\s*=\s*(?!\[REDACTED)\S.*/gm,
    replacement: REDACTED,
  },
];

export function redactContent(content: string): { cleanContent: string; redactCount: number } {
  let cleanContent = content;
  let redactCount = 0;

  for (const { pattern, replacement } of PATTERNS) {
    const matches = cleanContent.match(pattern);
    if (matches) {
      redactCount += matches.length;
      cleanContent = cleanContent.replace(pattern, replacement);
    }
  }

  return { cleanContent, redactCount };
}
