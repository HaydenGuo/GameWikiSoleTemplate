import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const articlePagePath = join(repoRoot, 'src', 'components', 'article', 'ArticlePage.astro');

describe('article page optional modules', () => {
  test('does not render the retired Gallery module', () => {
    const source = readFileSync(articlePagePath, 'utf8');

    expect(source).not.toContain("import ArticleGallery from './ArticleGallery.astro'");
    expect(source).not.toContain('<ArticleGallery');
  });
});
