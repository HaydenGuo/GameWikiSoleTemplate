/**
 * Dynamic sidebar navigation — scans actual MDX files to build nav groups.
 * Header dropdown entries are resolved only from the explicit navigation plan.
 *
 * No hardcoded lists:
 * if you add an MDX file, it appears in the sidebar automatically.
 */

import { NAVIGATION_CONFIG } from '~/config/navigation';
import { site } from '~/config/site';
import { resolvePrimaryNavigationMode, type PrimaryNavigationMode } from './navigation-mode';
import { getEntriesByCategory, parseEntryId } from '~/i18n/content';
import type { Locale } from '~/i18n/routing';
import type { WikiEntry } from '~/i18n/content';

export interface NavEntry {
  title: string;
  slug: string;
  path: string;
}

export interface NavSubgroup {
  key: string;
  label: string;
  entries: NavEntry[];
}

export interface NavGroup {
  key: string;
  label: string;
  path: string;
  icon: string;
  count: number;
  /** Whether this category belongs in the site header's primary navigation. */
  showInPrimaryNavigation: boolean;
  /** All actual articles in this category, used by the sidebar. */
  entries: NavEntry[];
  /** Explicit second-level groups assigned to the header dropdown. */
  subnavigations: NavSubgroup[];
  /** Whether this category uses one-level navigation or a second-level dropdown. */
  navigationMode: PrimaryNavigationMode;
  /** True only when the planning config defines dropdown content. */
  hasDropdown: boolean;
}

/**
 * Build the sidebar navigation for a locale.
 * Groups come from NAVIGATION_CONFIG; sidebar entries come from actual MDX files.
 * Header dropdown entries come from `subnavigations`, so a
 * content file cannot silently change the planned menu order. For a
 * subnavigation, the header renders only its label; its article paths are
 * used by the linked category list page.
 * Groups with zero entries in this locale are still shown (empty, so users
 * see the structure and know what content is coming).
 */
export async function getDynamicNavigation(
  locale: Locale,
  labels: Record<string, string>, // nav.<key> from locale JSON
): Promise<NavGroup[]> {
  const groups: NavGroup[] = [];

  for (const item of NAVIGATION_CONFIG) {
    const entries = await getEntriesByCategory(item.key, locale);
    const allEntries = entries.map((e) => {
      const parsed = parseEntryId(e.id);
      const slug = parsed?.slug ?? '';
      return {
        title: e.data.title,
        slug,
        path: `${item.path}/${slug}`,
      };
    });
    const entriesByPath = new Map(allEntries.map((entry) => [entry.path, entry]));
    const resolvePaths = (paths: readonly string[]): NavEntry[] =>
      paths.flatMap((path) => {
        const entry = entriesByPath.get(path.replace(/\/$/, ''));
        return entry ? [entry] : [];
      });
    const subnavigations = (item.subnavigations ?? []).map((subnavigation) => ({
      key: subnavigation.subnavKey,
      label: subnavigation.label,
      entries: resolvePaths(subnavigation.paths),
    }));
    const navigationMode = resolvePrimaryNavigationMode(
      item.navigationMode,
      site.enableDropdownNavigation,
      subnavigations.length > 0,
    );
    groups.push({
      key: item.key,
      label: labels[item.key] ?? capitalize(item.key),
      path: item.path,
      icon: item.icon,
      count: entries.length,
      showInPrimaryNavigation: item.showInPrimaryNavigation !== false,
      entries: allEntries,
      subnavigations,
      navigationMode,
      hasDropdown: navigationMode === 'primary-with-secondary',
    });
  }

  return groups;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export type { WikiEntry };
