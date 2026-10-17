import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const consent = readFileSync(resolve(root, 'src/components/layout/CookieConsent.astro'), 'utf8');
const layout = readFileSync(resolve(root, 'src/components/layout/BaseLayout.astro'), 'utf8');
const policy = readFileSync(resolve(root, 'src/components/layout/LegalContent.astro'), 'utf8');

describe('privacy consent contract', () => {
  it('stores versioned granular choices and gates both categories', () => {
    expect(consent).toContain("aw-cookie-consent-v2");
    expect(consent).toContain('analytics: boolean; advertising: boolean');
    expect(layout).toContain('preferences.analytics');
    expect(layout).toContain('preferences.advertising');
    expect(layout).toContain('requestNonPersonalizedAds');
    expect(layout).toContain('PUBLIC_ADSENSE_NON_PERSONALIZED');
  });

  it('honors Global Privacy Control for advertising', () => {
    expect(consent).toContain('navigator.globalPrivacyControl');
    expect(policy).toContain('Global Privacy Control');
  });

  it('only exposes settings inside the first-visit banner', () => {
    expect(consent).toContain("if (saved?.version === 2) { window.__awLoadTrackers?.(saved); return; }");
    expect(consent).not.toContain('privacy-settings-launcher');
  });

  it('documents adult advertising as an explicit, disabled-by-default decision', () => {
    expect(policy).toContain('We do not enable adult advertising by default');
  });
});
