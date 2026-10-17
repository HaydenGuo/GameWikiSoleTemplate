import { describe, it, expect } from 'vitest';
import { extractFirstBodyImage, parseEntryId, isPossiblyOutdated, selectRelatedEntries, STALE_AFTER_DAYS } from '~/lib/content-utils';

describe('parseEntryId', () => {
  it('parses a simple id into locale/category/slug', () => {
    expect(parseEntryId('en/bosses/emberfang')).toEqual({
      locale: 'en',
      category: 'bosses',
      slug: 'emberfang',
    });
  });

  it('strips the .mdx extension the glob loader includes in the id', () => {
    expect(parseEntryId('en/bosses/emberfang.mdx')).toEqual({
      locale: 'en',
      category: 'bosses',
      slug: 'emberfang',
    });
  });

  it('keeps nested slug segments joined with /', () => {
    expect(parseEntryId('en/guides/sub/deep/page')).toEqual({
      locale: 'en',
      category: 'guides',
      slug: 'sub/deep/page',
    });
  });

  it('returns null when the locale segment is not a configured locale', () => {
    expect(parseEntryId('fr/bosses/emberfang')).toBeNull();
  });

  it('returns null when there are fewer than 3 segments', () => {
    expect(parseEntryId('en/bosses')).toBeNull();
    expect(parseEntryId('en')).toBeNull();
    expect(parseEntryId('')).toBeNull();
  });
});

describe('extractFirstBodyImage', () => {
  it('returns the first image by document order across HTML and markdown', () => {
    const body = `Intro\n<img src="/images/articles/first.jpg" alt="first" />\n![second](/images/articles/second.jpg)`;
    expect(extractFirstBodyImage(body)).toBe('/images/articles/first.jpg');
  });

  it('supports the native Image component and ignores remote images', () => {
    const body = `<img src="https://example.com/remote.jpg" />\n<Image src="/images/articles/native.webp" alt="native" />`;
    expect(extractFirstBodyImage(body)).toBe('/images/articles/native.webp');
  });

  it('ignores image paths inside code fences and HTML comments', () => {
    const body = [
      '```md',
      '![not rendered](/images/articles/example.png)',
      '```',
      '<!-- <img src="/images/articles/comment.png" /> -->',
      '![actual](/images/articles/actual.webp)',
    ].join('\n');
    expect(extractFirstBodyImage(body)).toBe('/images/articles/actual.webp');
  });

  it('returns undefined when the body has no public image', () => {
    expect(extractFirstBodyImage('## Text only\n\nNo image here.')).toBeUndefined();
  });

  it('finds the first imported ArticleImage asset', () => {
    const body = [
      "import hero from '~/assets/articles/hero.png';",
      "import ArticleImage from '~/components/mdx/ArticleImage.astro';",
      '<ArticleImage src={hero} alt="hero" />',
    ].join('\n');
    expect(extractFirstBodyImage(body)).toBe('~/assets/articles/hero.png');
  });
});

describe('isPossiblyOutdated', () => {
  const now = new Date('2026-08-16T00:00:00Z');
  const fresh = new Date('2026-08-01T00:00:00Z'); // 15 days before now
  const stale = new Date('2025-08-01T00:00:00Z'); // > 1 year before now

  it('is false for categories outside STALE_CATEGORIES regardless of age', () => {
    expect(isPossiblyOutdated('guides', undefined, stale, now)).toBe(false);
    expect(isPossiblyOutdated('codes', undefined, stale, now)).toBe(false);
  });

  it('is false for a fresh stale-category article', () => {
    expect(isPossiblyOutdated('bosses', undefined, fresh, now)).toBe(false);
  });

  it('is true once the article is older than STALE_AFTER_DAYS', () => {
    const justUnder = new Date(now.getTime() - (STALE_AFTER_DAYS - 1) * 86400000);
    const justOver = new Date(now.getTime() - (STALE_AFTER_DAYS + 1) * 86400000);
    expect(isPossiblyOutdated('bosses', undefined, justUnder, now)).toBe(false);
    expect(isPossiblyOutdated('bosses', undefined, justOver, now)).toBe(true);
  });

  it('prefers lastModified over the publish date', () => {
    // Published long ago but touched recently → not outdated.
    expect(isPossiblyOutdated('tier-list', fresh, stale, now)).toBe(false);
    // Published recently but lastModified is ancient → outdated (data bug,
    // but the function must honor the explicit field).
    expect(isPossiblyOutdated('tier-list', stale, fresh, now)).toBe(true);
  });
});

describe('selectRelatedEntries', () => {
  const d = (s: string) => new Date(s);
  const mk = (id: string, tags: string[], category: string, date: string) => ({
    id,
    data: { tags, category, date: d(date) },
  });
  const current = mk('en/bosses/a.mdx', ['fire'], 'bosses', '2026-01-01');

  it('tier 1: matches by shared tags, newest first', () => {
    const pool = [mk('en/bosses/old.mdx', ['fire'], 'bosses', '2025-01-01'), mk('en/guides/new.mdx', ['fire'], 'guides', '2026-06-01')];
    const rel = selectRelatedEntries(pool, current, 2);
    expect(rel.map((e) => e.id)).toEqual(['en/guides/new.mdx', 'en/bosses/old.mdx']);
  });

  it('tier 2: fills up to the limit from the same category when tags run out', () => {
    const pool = [mk('en/bosses/b.mdx', ['ice'], 'bosses', '2026-02-01'), mk('en/bosses/c.mdx', [], 'bosses', '2026-03-01')];
    const rel = selectRelatedEntries(pool, current, 3);
    expect(rel.map((e) => e.id)).toEqual(['en/bosses/c.mdx', 'en/bosses/b.mdx']);
  });

  it('tier 3: site-wide newest only when nothing matched at all', () => {
    const pool = [mk('en/guides/x.mdx', ['craft'], 'guides', '2026-05-01')];
    const rel = selectRelatedEntries(pool, current, 3);
    expect(rel.map((e) => e.id)).toEqual(['en/guides/x.mdx']);
  });

  it('never returns the current article or duplicates, and honors the limit', () => {
    const pool = [
      current,
      mk('en/bosses/same.mdx', ['fire'], 'bosses', '2026-04-01'),
      mk('en/bosses/also.mdx', ['fire'], 'bosses', '2026-03-01'),
      mk('en/bosses/third.mdx', ['fire'], 'bosses', '2026-02-01'),
    ];
    const rel = selectRelatedEntries(pool, current, 2);
    expect(rel).toHaveLength(2);
    expect(rel.some((e) => e.id === current.id)).toBe(false);
    expect(new Set(rel.map((e) => e.id)).size).toBe(2);
  });

  it('no tag overlap and no category siblings → falls through to newest', () => {
    const pool = [mk('ja/bosses/other.mdx', ['fire'], 'bosses', '2026-07-01'), mk('en/codes/z.mdx', [], 'codes', '2026-06-01')];
    // ja entry excluded by the caller's locale filter in real use; here the
    // pure function only proves category/tag tiers then newest fallback.
    const rel = selectRelatedEntries([pool[1]], current, 3);
    expect(rel.map((e) => e.id)).toEqual(['en/codes/z.mdx']);
  });
});
