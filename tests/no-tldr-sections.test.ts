import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const wikiContentRoot = join(repoRoot, 'src', 'content', 'wiki');

function findMdxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? findMdxFiles(path) : entry.name.endsWith('.mdx') ? [path] : [];
  });
}

describe('wiki article body format', () => {
  test('does not include standalone TL;DR sections', () => {
    const files = findMdxFiles(wikiContentRoot);
    const offenders = files.filter((file) =>
      /^##\s+TL;DR\s*$/im.test(readFileSync(file, 'utf8')),
    );

    expect(offenders).toEqual([]);
  });
});
