import { describe, it, expect } from 'vitest';
import {
  localizePath,
  listPath,
  detailPath,
  homeUrl,
  slugifyTag,
  absoluteUrl,
  languageAlternates,
} from '~/lib/url';
import { defaultLocale, locales } from '~/i18n/routing';

const nonDefaultLocale = locales.find((locale) => locale !== defaultLocale);

describe('url helpers', () => {
  describe('localizePath', () => {
    it('returns the path unchanged for the default locale (en)', () => {
      expect(localizePath('/bosses', defaultLocale)).toBe('/bosses/');
      expect(localizePath('/bosses/emberfang', defaultLocale)).toBe('/bosses/emberfang/');
    });

    it('prepends the locale prefix for non-default locales', () => {
      if (!nonDefaultLocale) return;
      expect(localizePath('/bosses', nonDefaultLocale)).toBe(`/${nonDefaultLocale}/bosses/`);
      expect(localizePath('/bosses/emberfang', nonDefaultLocale)).toBe(`/${nonDefaultLocale}/bosses/`);
    });

    it('ensures leading slash on input without one', () => {
      expect(localizePath('about', defaultLocale)).toBe('/about/');
      expect(nonDefaultLocale && localizePath('about', nonDefaultLocale)).toBe(
        nonDefaultLocale ? `/${nonDefaultLocale}/about/` : undefined,
      );
    });
  });

  describe('homeUrl', () => {
    it('returns / for default locale', () => {
      expect(homeUrl(defaultLocale)).toBe('/');
    });
    it('returns /ja for non-default locale', () => {
      if (!nonDefaultLocale) return;
      expect(homeUrl(nonDefaultLocale)).toBe(`/${nonDefaultLocale}/`);
    });
  });

  describe('listPath', () => {
    it('builds the correct list URL for each locale', () => {
      expect(listPath('bosses', defaultLocale)).toBe('/bosses/');
      expect(nonDefaultLocale && listPath('bosses', nonDefaultLocale)).toBe(
        nonDefaultLocale ? `/${nonDefaultLocale}/bosses/` : undefined,
      );
      expect(listPath('codes', defaultLocale)).toBe('/codes/');
    });
  });

  describe('detailPath', () => {
    it('builds the correct article URL for each locale', () => {
      expect(detailPath('bosses', 'emberfang', defaultLocale)).toBe('/bosses/emberfang/');
      expect(nonDefaultLocale && detailPath('bosses', 'emberfang', nonDefaultLocale)).toBe(
        nonDefaultLocale ? `/${nonDefaultLocale}/bosses/emberfang/` : undefined,
      );
    });

    it('handles nested slugs', () => {
      expect(detailPath('guides', 'early-game/beginner', defaultLocale)).toBe(
        '/guides/early-game/beginner/',
      );
      expect(
        nonDefaultLocale && detailPath('guides', 'early-game/beginner', nonDefaultLocale),
      ).toBe(nonDefaultLocale ? `/${nonDefaultLocale}/guides/early-game/beginner/` : undefined);
    });
  });
});

describe('slugifyTag (CJK / non-ASCII fallback)', () => {
  it('slugifies ASCII tags to lowercase kebab-case', () => {
    expect(slugifyTag('Boss Guide')).toBe('boss-guide');
    expect(slugifyTag('Fire_Warden')).toBe('fire-warden');
  });

  it('returns CJK tags raw instead of collapsing to empty', () => {
    // The ASCII branch strips every CJK char → '' → all such tags would
    // collide on /tags/. The raw fallback keeps them unique; Astro writes
    // params to disk verbatim, so the built directory is the raw tag and
    // browser-encoded links (/tags/%E7%84%B0…) resolve to it.
    const zh = slugifyTag('焰牙');
    expect(zh).toBe('焰牙');
    expect(zh).not.toBe('');
  });

  it('keeps two different CJK tags distinguishable', () => {
    expect(slugifyTag('焰牙')).not.toBe(slugifyTag('风暴召唤者'));
  });

  it('keeps pure-symbol tags non-empty', () => {
    // Whatever the exact characters, the slug is stable and distinct from ''
    // — the property the fallback exists to guarantee.
    expect(slugifyTag('!!!')).toBe('!!!');
    expect(slugifyTag('  ???  ')).toBe('???');
  });
});

describe('absoluteUrl', () => {
  it('prefixes siteUrl and applies the locale prefix rules', () => {
    expect(absoluteUrl('/bosses', defaultLocale)).toMatch(/^https:\/\/[^/]+\/bosses\/$/);
    if (!nonDefaultLocale) return;
    expect(absoluteUrl('/bosses', nonDefaultLocale)).toMatch(
      new RegExp(`^https:\\/\\/[^/]+\\/${nonDefaultLocale}\\/bosses\\/$`),
    );
    expect(absoluteUrl('/', nonDefaultLocale)).toMatch(
      new RegExp(`^https:\\/\\/[^/]+\\/${nonDefaultLocale}\\/$`),
    );
  });
});

describe('languageAlternates', () => {
  it('builds absolute hreflang entries for exactly the given locales', () => {
    const alts = languageAlternates((loc) => detailPath('bosses', 'x', loc), locales);
    expect(alts).toHaveLength(locales.length);
    expect(alts.find((alt) => alt.hreflang === defaultLocale)).toEqual({
      hreflang: defaultLocale,
      href: expect.stringMatching(/\/bosses\/x\/$/),
    });
    if (nonDefaultLocale) {
      expect(alts.find((alt) => alt.hreflang === nonDefaultLocale)).toEqual({
        hreflang: nonDefaultLocale,
        href: expect.stringMatching(new RegExp(`\\/${nonDefaultLocale}\\/bosses\\/x\\/$`)),
      });
    }
  });

  it('never emits x-default (BaseLayout derives it separately)', () => {
    const alts = languageAlternates((loc) => listPath('guides', loc), locales);
    expect(alts.some((a) => a.hreflang === 'x-default')).toBe(false);
  });

  it('honors a reduced locale list (single-language article)', () => {
    const alts = languageAlternates((loc) => detailPath('bosses', 'x', loc), [defaultLocale]);
    expect(alts).toHaveLength(1);
    expect(alts[0].hreflang).toBe(defaultLocale);
  });
});
