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
