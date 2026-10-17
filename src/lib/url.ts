/**
 * URL construction utilities.
 *
 * Centralizes all locale-prefix logic so components never hand-build URLs.
 * English (default locale) has no prefix; other locales are prefixed.
 */

import { defaultLocale, type Locale } from '~/i18n/routing';
import { siteUrl } from '~/config/site';

/** Build a path with the locale prefix applied (or none for default locale). */
export function localizePath(path: string, locale: Locale): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // trailingSlash:'always' — every page URL ends with "/" (Cloudflare Pages
  // serves directory builds that way; canonical/sitemap/internal links must
  // match or every page 308s once for Google). Callers pass slash-free paths;
  // callers that already end with "/" are normalized, not double-slashed.
  const slashed = cleanPath === '/' ? '/' : `${cleanPath.replace(/\/+$/, '')}/`;
  if (locale === defaultLocale) return slashed;
  if (cleanPath === '/') return `/${locale}/`;
  return `/${locale}${slashed}`;
}

/** Build an absolute URL (with domain) for a path + locale. */
export function absoluteUrl(path: string, locale: Locale): string {
  return `${siteUrl}${localizePath(path, locale)}`;
}

/** Home URL for a locale. */
export function homeUrl(locale: Locale): string {
  return localizePath('/', locale);
}

/** List page URL for a category + locale. e.g. localizeListPath('bosses', 'en') -> '/bosses' */
export function listPath(category: string, locale: Locale): string {
  return localizePath(`/${category}`, locale);
}

/** Article detail URL. e.g. detailPath('bosses', 'emberfang', 'en') -> '/bosses/emberfang' */
export function detailPath(category: string, slug: string, locale: Locale): string {
  return localizePath(`/${category}/${slug}`, locale);
}

/** Recent-updates page URL for a locale. */
export function recentPath(locale: Locale): string {
  return localizePath('/recent', locale);
}

/**
 * Generate hreflang alternates for an article/category page.
 * Returns a list suitable for injection as <link rel="alternate"> tags.
 * x-default is NOT included here — BaseLayout derives it from the alternates.
 */
export function languageAlternates(
  buildPath: (locale: Locale) => string,
  locales: readonly Locale[],
): Array<{ hreflang: string; href: string }> {
  return locales.map((loc) => ({
    hreflang: loc,
    href: `${siteUrl}${buildPath(loc)}`,
  }));
}
