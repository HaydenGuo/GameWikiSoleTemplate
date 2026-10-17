export type PrimaryNavigationMode = 'primary' | 'primary-with-secondary';

/**
 * Resolve a category's navigation mode. An explicit per-category setting wins;
 * the site-wide switch remains a fallback for existing consumers.
 */
export function resolvePrimaryNavigationMode(
  configuredMode: PrimaryNavigationMode | undefined,
  legacySiteDropdownEnabled: boolean,
  hasSubnavigationGroups: boolean,
): PrimaryNavigationMode {
  if (!hasSubnavigationGroups) return 'primary';
  return configuredMode ?? (legacySiteDropdownEnabled ? 'primary-with-secondary' : 'primary');
}
