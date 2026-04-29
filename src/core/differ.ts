import { diffLines } from 'diff';

export function getDiff(oldText: string, newText: string): string {
  const changes = diffLines(oldText, newText);
  const result: string[] = [];

  for (const change of changes) {
    const lines = change.value.split('\n');
    const nonEmptyLast = lines[lines.length - 1] === '' ? lines.slice(0, -1) : lines;

    if (change.added) {
      for (const line of nonEmptyLast) {
        result.push(`+ ${line}`);
      }
    } else if (change.removed) {
      for (const line of nonEmptyLast) {
        result.push(`- ${line}`);
      }
    } else {
      for (const line of nonEmptyLast) {
        if (line.trim()) result.push(`  ${line}`);
      }
    }
  }

  return result.join('\n');
}
