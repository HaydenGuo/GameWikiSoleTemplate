import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveEffectiveRoot, saveSitesRegistry } from '../src/core/sites.js';

const base = mkdtempSync(join(tmpdir(), 'anvil-ops-effroot-'));

describe('resolveEffectiveRoot', () => {
  it('uses a configured site in the current directory', () => {
    const local = join(base, 'local-site');
    mkdirSync(local, { recursive: true });
    writeFileSync(join(local, '.env'), 'SITE_URL=https://local.example\n');
    expect(resolveEffectiveRoot({ cwd: local, registryPath: join(base, 'sites.toml') })).toBe(local);
  });

  it('falls through to the configured default site when cwd has no site config', () => {
    const empty = join(base, 'empty-dir');
    const other = join(base, 'other-site');
    mkdirSync(empty, { recursive: true });
    mkdirSync(other, { recursive: true });
    writeFileSync(join(other, '.env'), 'SITE_URL=https://other.example\n');
    const registryPath = join(base, 'sites.toml');
    saveSitesRegistry({ defaultSite: 'other', sites: [{ name: 'other', path: other }] }, registryPath);
    expect(resolveEffectiveRoot({ cwd: empty, registryPath })).toBe(resolve(other).replaceAll('\\', '/'));
  });
});
