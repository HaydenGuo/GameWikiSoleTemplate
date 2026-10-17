/**
 * Navigation configuration — the single source of truth for content categories.
 *
 * 👉 APPLY TEMPLATE: pnpm apply-template enables a subset of the fixed
 * navigation vocabulary (guides, builds, items, maps, bosses, tier-list,
 * news, codes) and orders it by the selected game navigation profile.
 * Do not invent keys; profile order is defined in scripts/lib/apply-rewrites.ts.
 *
 * The `key` MUST be identical in THREE places (rule enforced across the codebase):
 *   1. Here — NAVIGATION_CONFIG[].key
 *   2. src/locales/en.json — nav.<key> (display label) + overview.<key> (list page meta)
 *   3. src/content/wiki/<locale>/<key>/ — MDX directory name
 *
 * Changing this one file automatically affects: nav menu, URL routes, sitemap,
 * content loading, sidebar, and any explicitly planned header subnavigation.
 * Add `subnavigations` here only after the content/navigation planning stage
 * has assigned those pages; the header never invents a menu.
 */

import type { PrimaryNavigationMode } from '~/lib/navigation-mode';

// Icons are referenced by string name; astro-icon resolves them from src/icons/.
// We avoid importing the icon component here so this file stays framework-agnostic
// and can be read by non-Astro tooling (scripts, tests).
export interface NavigationItem {
  /** Category slug. Must match `src/content/wiki/<locale>/<key>/` directory name. */
  key: string;
  /** URL path segment. Must be `/${key}`. */
  path: string;
  /** Icon name from src/icons/ (without extension). */
  icon: string;
  /** Whether this category has MDX content (always true for content types). */
  isContentType: boolean;
  /** Set false to keep a utility page routable while omitting it from the header nav. */
  showInPrimaryNavigation?: boolean;
  /** Sort order in nav menu (lower = earlier). Optional, defaults to array order. */
  order?: number;
  /** Select a second-level header dropdown for this category; requires subgroup data. */
  navigationMode?: PrimaryNavigationMode;
  /** Explicit second-level groups from the content/navigation planning stage. */
  subnavigations?: readonly NavigationSubgroup[];
}

export interface NavigationSubgroup {
  /** Stable key from the content/navigation planning stage. */
  subnavKey: string;
  /** Display label for this second-level group. */
  label: string;
  /** Article paths assigned to this group; shown on the linked list section, not in the header dropdown. */
  paths: readonly string[];
}

export const NAVIGATION_CONFIG: NavigationItem[] = [
  { key: 'guides', path: '/guides', icon: 'lucide:book-open', isContentType: true, order: 1 },
  { key: 'builds', path: '/builds', icon: 'lucide:hammer', isContentType: true, order: 2 },
  { key: 'items', path: '/items', icon: 'lucide:package', isContentType: true, order: 3 },
  { key: 'maps', path: '/maps', icon: 'lucide:map', isContentType: true, order: 4 },
  { key: 'bosses', path: '/bosses', icon: 'lucide:swords', isContentType: true, order: 5 },
  { key: 'tier-list', path: '/tier-list', icon: 'lucide:bar-chart-3', isContentType: true, order: 6 },
  { key: 'news', path: '/news', icon: 'lucide:newspaper', isContentType: true, order: 7 },
  { key: 'codes', path: '/codes', icon: 'lucide:gift', isContentType: true, order: 8 },
  { key: 'deals', path: '/deals', icon: 'lucide:badge-percent', isContentType: false, order: 9, showInPrimaryNavigation: false },
];

/**
 * Primary links shown in the site header. Utility/product pages can be added
 * here without pretending to be content categories or creating empty lists.
 */
export const PRIMARY_NAVIGATION = NAVIGATION_CONFIG;

/** Derived list of content type slugs (e.g. ['bosses', 'guides', 'items', 'codes']). */
export const CONTENT_TYPES: string[] = NAVIGATION_CONFIG.filter((n) => n.isContentType).map((n) => n.key);
