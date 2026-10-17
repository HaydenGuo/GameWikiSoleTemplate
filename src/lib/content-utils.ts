/**
 * Pure content utilities — no `astro:content` import, so vitest can load
 * this module directly (the loaders in src/i18n/content.ts can't be unit
 * tested; these can). Re-exported through src/lib/content.ts for callers.
 */

import { isLocale, type Locale } from '~/i18n/routing';

/**
 * Parse an entry id like "en/bosses/emberfang" or "ja/bosses/sub/emberfang" into parts.
 * Returns null if the id doesn't match `<locale>/<category>/<...slug>`.
 */
export function parseEntryId(
  id: string,
): { locale: Locale; category: string; slug: string } | null {
  // Strip the .mdx extension that the glob loader includes in the id.
  const cleanId = id.replace(/\.mdx$/, '');
  const parts = cleanId.split('/');
  if (parts.length < 3) return null;
  const [locale, category, ...rest] = parts;
  if (!isLocale(locale)) return null;
  return { locale, category, slug: rest.join('/') };
}

/**
 * Pick the first local image declared in an article body.
 *
 * Article covers are intentionally derived from the first real article image
 * when no stronger asset exists. Keep this parser small and conservative: it
 * accepts only local public images or imported assets used by ArticleImage,
 * never remote URLs or arbitrary attributes. Code fences and HTML comments are
 * masked first so documentation examples cannot accidentally become the cover.
 */
export function extractFirstBodyImage(body: string): string | undefined {
  // Keep line breaks and character offsets intact while ignoring image-like
  // text that is not rendered as article content.
  const searchableBody = body.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~|<!--[\s\S]*?-->/g, (block) =>
    block.replace(/[^\r\n]/g, ' '),
  );
  const candidates: Array<{ index: number; src: string }> = [];
  const collect = (pattern: RegExp) => {
    for (const match of searchableBody.matchAll(pattern)) {
      const src = match[1];
      if (src) candidates.push({ index: match.index ?? Number.MAX_SAFE_INTEGER, src });
    }
  };

  collect(/!\[[^\]]*\]\(\s*(\/images\/[^)\s]+)(?:\s+[^)]*)?\)/g);
  collect(/<img\b[^>]*\bsrc\s*=\s*["'](\/images\/[^"']+)["'][^>]*>/gi);
  collect(/<Image\b[^>]*\bsrc\s*=\s*["'](\/images\/[^"']+)["'][^>]*>/g);

  // Astro assets are imported in MDX and rendered through ArticleImage. Keep
  // the import reference rather than trying to evaluate MDX here; the page
  // layer resolves it through Vite's asset manifest.
  const articleImports = new Map<string, string>();
  for (const match of searchableBody.matchAll(
    /import\s+([A-Za-z_$][\w$]*)\s+from\s+["']([^"']*\/assets\/articles\/[^"']+)["']/g,
  )) {
    if (match[1] && match[2]) articleImports.set(match[1], match[2].replace(/\\/g, '/'));
  }
  for (const match of searchableBody.matchAll(
    /<ArticleImage\b[^>]*\bsrc\s*=\s*\{\s*([A-Za-z_$][\w$]*)\s*\}[^>]*>/g,
  )) {
    const src = match[1] ? articleImports.get(match[1]) : undefined;
    if (src) candidates.push({ index: match.index ?? Number.MAX_SAFE_INTEGER, src });
  }

  candidates.sort((a, b) => a.index - b.index);
  return candidates[0]?.src;
}

/**
 * Categories whose content goes stale when the game updates (boss mechanics,
 * tier lists). Articles in these categories show a "possibly outdated" banner
 * when the last-modified date is older than STALE_AFTER_DAYS.
 */
export const STALE_CATEGORIES = ['bosses', 'tier-list'];
export const STALE_AFTER_DAYS = 90;

/**
 * True when the article is in a time-sensitive category and its
 * lastModified (or date) is older than STALE_AFTER_DAYS.
 * Pure function (testable without a build).
 */
export function isPossiblyOutdated(
  category: string,
  lastModified: Date | undefined,
  date: Date,
  now = new Date(),
): boolean {
  if (!STALE_CATEGORIES.includes(category)) return false;
  const ref = lastModified ?? date;
  const ageMs = now.getTime() - ref.getTime();
  return ageMs > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

/** Minimal shape selectRelatedEntries needs — WikiEntry satisfies it. */
export interface RelatedLike {
  id: string;
  data: { tags: readonly string[]; category: string; date: Date };
}

/**
 * Related-article selection with a three-tier fallback:
 *   1. shared tags (strongest signal, newest first);
 *   2. same category, filling up to `limit`;
 *   3. newest site-wide — ONLY when nothing matched at all (a "Related"
 *      section of unrelated articles is worse than none).
 * Excludes the current article and never returns duplicates. Pure function
 * (the astro:content-dependent pool loading stays in i18n/content.ts).
 */
export function selectRelatedEntries<T extends RelatedLike>(
  pool: readonly T[],
  current: RelatedLike,
  limit = 3,
): T[] {
  const chosen: T[] = [];
  const chosenIds = new Set<string>([current.id]);
  const newestFirst = (a: RelatedLike, b: RelatedLike) => b.data.date.getTime() - a.data.date.getTime();

  const take = (candidates: T[]) => {
    for (const entry of candidates) {
      if (chosen.length >= limit) return;
      if (chosenIds.has(entry.id)) continue;
      chosen.push(entry);
      chosenIds.add(entry.id);
    }
  };

  // Tier 1: shared tags.
  take(pool.filter((e) => e.data.tags.some((t) => current.data.tags.includes(t))).sort(newestFirst));
  // Tier 2: same category fills the remainder.
  if (chosen.length < limit) {
    take(pool.filter((e) => e.data.category === current.data.category).sort(newestFirst));
  }
  // Tier 3: site-wide newest, only when the article is an island.
  if (chosen.length === 0) {
    take([...pool].sort(newestFirst));
  }
  return chosen;
}
