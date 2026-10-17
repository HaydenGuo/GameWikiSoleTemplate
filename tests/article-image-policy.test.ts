import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('article image policy', () => {
  it('keeps the legacy public article-image path as a hard content gate', () => {
    const checkContent = readFileSync(join(repoRoot, 'scripts/check-content.ts'), 'utf8');
    expect(checkContent).toContain('LEGACY_ARTICLE_IMAGE_RE');
    expect(checkContent).toContain('legacy article image must move to src/assets/articles/');
  });

  it('documents the processed ArticleImage path', () => {
    const format = readFileSync(join(repoRoot, 'docs/content-format.md'), 'utf8');
    expect(format).toContain('src/assets/articles/');
    expect(format).toContain('pnpm check-content');
  });
});
