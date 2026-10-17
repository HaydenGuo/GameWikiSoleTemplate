import { describe, expect, it } from 'vitest';
import { isAllowedArticleSlug, parsePopularQuery } from '~/lib/popular-api';

describe('Popular API helpers', () => {
  const published = new Set(['/guides/beginner-guide/', '/codes/all-codes/']);

  it('accepts only a canonical path for a published article', () => {
    expect(isAllowedArticleSlug('/guides/beginner-guide/', published)).toBe(true);
    expect(isAllowedArticleSlug('/guides/', published)).toBe(false);
    expect(isAllowedArticleSlug('/guides/not-published/', published)).toBe(false);
    expect(isAllowedArticleSlug('https://example.com/guides/beginner-guide/', published)).toBe(false);
  });

  it('uses safe defaults when popular query parameters are absent or malformed', () => {
    expect(parsePopularQuery(new URLSearchParams())).toEqual({ days: 7, limit: 3 });
    expect(parsePopularQuery(new URLSearchParams('days=abc&limit=0'))).toEqual({ days: 7, limit: 1 });
  });

  it('clamps popular query parameters to the documented ranges', () => {
    expect(parsePopularQuery(new URLSearchParams('days=-5&limit=99'))).toEqual({ days: 1, limit: 10 });
    expect(parsePopularQuery(new URLSearchParams('days=31&limit=1'))).toEqual({ days: 30, limit: 1 });
  });
});
