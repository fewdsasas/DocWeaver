const PATTERNS: RegExp[] = [
  /AKIA[0-9A-Z]{16}/g,
  /sk-[a-zA-Z0-9]{48}/g,
  /-----BEGIN\s+(?:RSA\s+|EC\s+|OPENSSH\s+)?PRIVATE\s+KEY-----/g,
];

const PATTERNS_KEYED: Array<{ pattern: RegExp; replacement: string }> = [
  {
    pattern: /((?:password|passwd|pwd)\s*[:=]\s*)\S+/gi,
    replacement: '$1[REDACTED_SECRET]',
  },
  {
    pattern: /bearer\s+([a-zA-Z0-9_\-.]+\.[a-zA-Z0-9_\-.]+\.[a-zA-Z0-9_\-]+)/gi,
    replacement: 'bearer [REDACTED_SECRET]',
  },
];

const REDACTED = '[REDACTED_SECRET]';

export function redactContent(content: string): { cleanContent: string; redactCount: number } {
  let cleanContent = content;
  let redactCount = 0;

  for (const pattern of PATTERNS) {
    const matches = cleanContent.match(pattern);
    if (matches) {
      redactCount += matches.length;
      cleanContent = cleanContent.replace(pattern, REDACTED);
    }
  }

  for (const { pattern, replacement } of PATTERNS_KEYED) {
    const matches = cleanContent.match(pattern);
    if (matches) {
      redactCount += matches.length;
      cleanContent = cleanContent.replace(pattern, replacement);
    }
  }

  return { cleanContent, redactCount };
}
