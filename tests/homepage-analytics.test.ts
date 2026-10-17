import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { HOMEPAGE_CLICK_EVENT, trackHomepageClick } from '~/lib/homepage-analytics';

const root = resolve(import.meta.dirname, '..');
const homeSource = readFileSync(resolve(root, 'src/components/home/HomePage.astro'), 'utf8');
const layoutSource = readFileSync(resolve(root, 'src/components/layout/BaseLayout.astro'), 'utf8');

describe('homepage analytics', () => {
  it('sends a standardized navigation event after analytics consent', () => {
    const calls: unknown[][] = [];
    const analytics = {
      __awAnalyticsReady: true,
      gtag: (...args: unknown[]) => calls.push(args),
    };

    const sent = trackHomepageClick(analytics, {
      slot: 'quick_start',
      item: 'primary_category',
      targetPath: '/guides/',
      variant: 'home-v1',
      locale: 'en',
    });

    expect(sent).toBe(true);
    expect(calls).toEqual([
      [
        'event',
        HOMEPAGE_CLICK_EVENT,
        {
          slot: 'quick_start',
          item: 'primary_category',
          target_path: '/guides/',
          variant: 'home-v1',
          locale: 'en',
        },
      ],
    ]);
  });

  it('does not send a navigation event before analytics consent', () => {
    const calls: unknown[][] = [];
    const analytics = {
      __awAnalyticsReady: false,
      gtag: (...args: unknown[]) => calls.push(args),
    };

    const sent = trackHomepageClick(analytics, {
      slot: 'hero_primary',
      item: 'official',
      targetPath: 'https://example.com/',
      variant: 'home-v1',
      locale: 'en',
    });

    expect(sent).toBe(false);
    expect(calls).toEqual([]);
  });

  it('keeps the homepage event contract generic and optional', () => {
    for (const slot of [
      'hero_primary',
      'hero_secondary',
      'recent_updates_browse_all',
      'recent_update',
      'popular',
      'closing_cta',
    ]) {
      expect(homeSource).toContain(`data-home-slot="${slot}"`);
    }

    expect(homeSource).toContain("import { trackHomepageClick } from '@hb-game-wiki/template/lib/homepage-analytics'");
    expect(homeSource).toContain("{gaId && (");
    expect(homeSource).toContain("variant: 'home-v1'");
    expect(layoutSource).toContain('window.gtag = gtag');
    expect(layoutSource).toContain('window.__awAnalyticsReady = true');
    expect(homeSource).not.toMatch(/G-[A-Z0-9]{10}/);
    expect(layoutSource).not.toMatch(/G-[A-Z0-9]{10}/);
  });
});
