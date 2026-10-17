import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const ROOT = resolve(__dirname, '..');
const headerSource = readFileSync(resolve(ROOT, 'src/components/header/SiteHeader.astro'), 'utf8');
const listPageSource = readFileSync(resolve(ROOT, 'src/components/article/ListPage.astro'), 'utf8');
const siteSource = readFileSync(resolve(ROOT, 'src/config/site.ts'), 'utf8');

describe('header navigation modes', () => {
  test('keeps a configurable simple mode and dropdown mode', () => {
    const navigationSource = readFileSync(resolve(ROOT, 'src/config/navigation.ts'), 'utf8');
    expect(siteSource).toContain('enableDropdownNavigation: boolean');
    expect(navigationSource).toContain('navigationMode?: PrimaryNavigationMode');
    expect(headerSource).toContain('getDynamicNavigation(locale, nav)');
    expect(headerSource).toContain('navigationGroups.map');
    expect(headerSource).not.toContain('PRIMARY_NAVIGATION.map');
  });

  test('dropdown mode includes interaction dismissal hooks', () => {
    expect(headerSource).toContain('[data-nav-dropdown]');
    expect(headerSource).toContain("event.key !== 'Escape'");
    expect(headerSource).toContain('if (!menu.contains(target)) menu.open = false');
  });

  test('dropdown content is opt-in through explicit navigation planning fields', () => {
    const navigationSource = readFileSync(resolve(ROOT, 'src/config/navigation.ts'), 'utf8');
    expect(navigationSource).toContain('subnavigations');
    expect(navigationSource).not.toContain('dropdownPaths');
    expect(headerSource).toContain('group.hasDropdown');
    expect(headerSource).toContain('group.subnavigations');
    expect(headerSource).toContain('subnavigation.key');
    expect(headerSource).not.toContain('subnavigation.entries.map');
    expect(listPageSource).toContain('subnavigationSections');
    expect(headerSource).not.toContain('group.entries.slice(0, 8)');
  });
});

import { describe, expect, it } from 'vitest';
import { resolvePrimaryNavigationMode } from '../src/lib/navigation-mode';

describe('primary navigation mode', () => {
  it('defaults to primary-only when dropdowns are disabled', () => {
    expect(resolvePrimaryNavigationMode(undefined, false, true)).toBe('primary');
  });

  it('enables a configured second level even when the legacy site switch is off', () => {
    expect(resolvePrimaryNavigationMode('primary-with-secondary', false, true)).toBe('primary-with-secondary');
  });

  it('keeps a configured primary-only category out of dropdown mode', () => {
    expect(resolvePrimaryNavigationMode('primary', true, true)).toBe('primary');
  });

  it('preserves the legacy site-wide dropdown setting for existing sites', () => {
    expect(resolvePrimaryNavigationMode(undefined, true, true)).toBe('primary-with-secondary');
  });

  it('does not enable a second level when no subgroup content exists', () => {
    expect(resolvePrimaryNavigationMode('primary-with-secondary', false, false)).toBe('primary');
  });
});
