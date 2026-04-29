import { ScanFileItem } from '../types/context';
import { estimateTokens } from './token';

function classifyPriority(file: ScanFileItem): number {
  const p = file.path;
  const basename = p.split('/').pop() || '';

  // P1: Entry files
  if (/^(index|main|app|server|__init__)\.(ts|tsx|js|jsx|py|go|rs|java)$/.test(basename)) {
    return 1;
  }

  // P2: Route/API files
  if (/\b(routes?|router|api|controllers?|handlers?|endpoints?)\//.test(p)) {
    return 2;
  }

  // P3: Config files
  if (
    basename === '.env.example' ||
    basename === 'Dockerfile' ||
    basename === 'Makefile' ||
    basename === 'package.json' ||
    basename === 'tsconfig.json' ||
    basename === 'go.mod' ||
    basename === 'Cargo.toml' ||
    basename === 'pyproject.toml' ||
    basename === 'docker-compose.yml' ||
    basename === 'docker-compose.yaml' ||
    /\.config\./.test(basename)
  ) {
    return 3;
  }

  // P4: Model/Domain files
  if (/\b(models?|entities?|schemas?|types?|interfaces?|domain)\//.test(p)) {
    return 4;
  }

  // P5: Everything else
  return 5;
}

export function truncateSnippetsByPriority(
  snippets: ScanFileItem[],
  maxTokens: number
): { snippets: ScanFileItem[]; totalTokens: number } {
  const sorted = [...snippets].sort(
    (a, b) => classifyPriority(a) - classifyPriority(b)
  );

  let cumulative = 0;
  const kept: ScanFileItem[] = [];

  for (const snippet of sorted) {
    const tokens = estimateTokens(snippet.content);
    if (cumulative + tokens > maxTokens && kept.length > 0) {
      break;
    }
    kept.push(snippet);
    cumulative += tokens;
  }

  return { snippets: kept, totalTokens: cumulative };
}
