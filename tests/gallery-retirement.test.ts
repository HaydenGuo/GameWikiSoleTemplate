import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const searchableRoots = ['src', 'docs', 'scripts', '.github'];

function listTextFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listTextFiles(path);
    return /\.(astro|json|md|mdx|mjs|ts|tsx|yml|yaml)$/i.test(entry.name) ? [path] : [];
  });
}

describe('retired Gallery feature', () => {
  test('has no runtime component or gallery asset directory', () => {
    expect(existsSync(join(repoRoot, 'src/components/article/ArticleGallery.astro'))).toBe(false);
    expect(existsSync(join(repoRoot, 'src/assets/gallery'))).toBe(false);
  });

  test('has no Gallery configuration, content data, automation, or documentation references', () => {
    const files = searchableRoots.flatMap((root) => listTextFiles(join(repoRoot, root)));
    const references = files
      .filter((file) => file !== join(repoRoot, 'docs/template-baseline.json'))
      .map((file) => ({ file, source: readFileSync(file, 'utf8') }))
      .filter(({ source }) => /\bgallery\b/i.test(source))
      .map(({ file }) => file.replace(`${repoRoot}\\`, ''));

    expect(references).toEqual([]);
  });
});
