import { CONTENT_TYPES } from '../../src/config/navigation.ts';

export interface ContentSourceFile {
  relativePath: string;
  source: string;
}

function frontmatter(source: string): string | null {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  return match?.[1] ?? null;
}

function frontmatterValue(frontmatterText: string, key: string): string | null {
  const match = frontmatterText.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'mi'));
  return match?.[1]?.replace(/^['"]|['"]$/g, '').trim() ?? null;
}

/** Return canonical paths for English articles that are published at `now`. */
export function collectPublishedArticleSlugs(files: readonly ContentSourceFile[], now = new Date()): string[] {
  const categories = new Set(CONTENT_TYPES);
  const slugs = files.flatMap(({ relativePath, source }) => {
    const match = relativePath.replace(/\\/g, '/').match(/^en\/([^/]+)\/(.+)\.mdx$/);
    if (!match) return [];
    const [, category, articleSlug] = match;
    if (!categories.has(category)) return [];

    const fm = frontmatter(source);
    if (!fm || /^draft:\s*true\s*$/mi.test(fm)) return [];
    const dateText = frontmatterValue(fm, 'date');
    const date = dateText ? new Date(dateText) : null;
    if (!date || Number.isNaN(date.getTime()) || date.getTime() > now.getTime()) return [];

    return [`/${category}/${articleSlug}/`];
  });

  return Array.from(new Set(slugs)).sort();
}
