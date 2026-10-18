import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadSiteConfig } from '../src/core/site.js';

function tmpDir(): string { return mkdtempSync(join(tmpdir(), 'ops-site-')); }

describe('loadSiteConfig', () => {
  it('reads SITE_URL from .env and strips trailing slash', () => {
    const dir = tmpDir();
    writeFileSync(join(dir, '.env'), 'SITE_URL=https://wiki.example.com/\n');
    const config = loadSiteConfig(dir);
    expect(config.root).toBe(dir);
    expect(config.siteUrl).toBe('https://wiki.example.com');
  });

  it('walks up parent directories to discover .env', () => {
    const dir = tmpDir();
    writeFileSync(join(dir, '.env'), 'SITE_URL=https://wiki.example.com\n');
    const nested = join(dir, 'a', 'b');
    mkdirSync(nested, { recursive: true });
    expect(loadSiteConfig(nested).root).toBe(dir);
  });

  it('requires a site URL', () => {
    expect(() => loadSiteConfig(tmpDir())).toThrow(/SITE_URL/);
  });
});
