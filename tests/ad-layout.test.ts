import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');

describe('template ad layout contract', () => {
  it('ships the three reusable AdSense slot components with empty-env gates', () => {
    const componentPaths = [
      'src/components/ads/AdSenseSlot.astro',
      'src/components/ads/StickyBanner.astro',
      'src/components/ads/SidebarAd.astro',
      'src/components/ads/InContentAd.astro',
    ];

    for (const relativePath of componentPaths) {
      expect(existsSync(resolve(root, relativePath)), relativePath).toBe(true);
      expect(read(relativePath), relativePath).toContain('PUBLIC_ADSENSE_');
    }

    expect(read('src/components/ads/AdSenseSlot.astro')).toContain("position: 'sticky' | 'sidebar' | 'incontent'");
    expect(read('src/components/ads/StickyBanner.astro')).toContain('hidden border-b');
    expect(read('src/components/ads/SidebarAd.astro')).toContain('min-h-[600px]');
    expect(read('src/components/ads/InContentAd.astro')).toContain('min-h-[250px]');
  });

  it('reserves the right ad track and wires each page-level slot', () => {
    const article = read('src/components/article/ArticlePage.astro');
    const locale = read('src/components/layout/LocaleLayout.astro');
    const sidebar = read('src/components/sidebar/WikiSidebar.astro');

    expect(article).toContain('xl:grid-cols-[12rem_minmax(0,1fr)_160px]');
    expect(article).toContain('<InContentAd />');
    expect(article).toContain('<SidebarAd />');
    expect(locale).toContain('<StickyBanner />');
    expect(sidebar).toContain('<SidebarAd />');
  });

  it('keeps ad instructions in the template documentation', () => {
    const docs = read('docs/ads.md');
    expect(docs).toContain('PUBLIC_ADSENSE_CLIENT');
    expect(docs).toContain('Sticky');
    expect(docs).toContain('Sidebar');
    expect(docs).toContain('InContent');
    expect(docs).toContain('iframe');
  });
});
