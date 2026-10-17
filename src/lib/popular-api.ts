/** Shared validation rules for the optional database-backed Popular endpoints. */

const DEFAULT_DAYS = 7;
const DEFAULT_LIMIT = 3;
const MIN_DAYS = 1;
const MAX_DAYS = 30;
const MIN_LIMIT = 1;
const MAX_LIMIT = 10;

function boundedInteger(value: string | null, fallback: number, min: number, max: number): number {
  if (!value || !/^-?\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

/** Parse and clamp public GET /api/popular parameters. */
export function parsePopularQuery(search: URLSearchParams): { days: number; limit: number } {
  return {
    days: boundedInteger(search.get('days'), DEFAULT_DAYS, MIN_DAYS, MAX_DAYS),
    limit: boundedInteger(search.get('limit'), DEFAULT_LIMIT, MIN_LIMIT, MAX_LIMIT),
  };
}

/** Trust only generated, canonical paths for published article pages. */
export function isAllowedArticleSlug(slug: unknown, allowedSlugs: ReadonlySet<string>): slug is string {
  return typeof slug === 'string' && slug.startsWith('/') && slug.endsWith('/') && allowedSlugs.has(slug);
}
