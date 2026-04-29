const SENSITIVE_NAMES = [
  '.env', '.env.local', '.env.production', '.env.development',
  '.npmrc', '.yarnrc', '.pnpmfile.cjs',
  'credentials.json', 'secrets.json', 'serviceAccount.json',
  'id_rsa', 'id_ed25519',
  '.docweaverrc',
];

const SENSITIVE_EXTENSIONS = [
  '.pem', '.key', '.crt', '.p12',
];

const SENSITIVE_PATHS = [
  '.ssh/config',
];

const BASENAME_BLACKLIST = new Set(SENSITIVE_NAMES);
const EXT_BLACKLIST = new Set(SENSITIVE_EXTENSIONS);
const PATH_BLACKLIST = new Set(SENSITIVE_PATHS);

export function isBlacklisted(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  const basename = normalized.split('/').pop() || '';

  if (BASENAME_BLACKLIST.has(basename)) return true;

  for (const p of PATH_BLACKLIST) {
    if (normalized.endsWith('/' + p)) return true;
  }

  for (const ext of EXT_BLACKLIST) {
    if (basename.endsWith(ext)) return true;
  }

  return false;
}
