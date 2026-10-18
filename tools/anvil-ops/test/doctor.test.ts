import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runDoctor, formatDoctor } from '../src/core/doctor.js';
import type { GscClient } from '../src/core/providers/gsc.js';

function tmpSite(dotenv: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'ops-doctor-'));
  writeFileSync(join(dir, '.env'), `SITE_URL=https://wiki.example.com\n${dotenv}`);
  return dir;
}

const ghOk = () => ({ ok: true, detail: 'gh version 2.x found' });
const gscOk: GscClient = {
  async query() { throw new Error('not used'); },
  async listAccessibleSites() { return ['https://wiki.example.com/']; },
};

describe('runDoctor', () => {
  it('passes when site config and GSC access are valid', async () => {
    const dir = tmpSite(`GSC_SERVICE_ACCOUNT_JSON=${JSON.stringify({ client_email: 'e@x', private_key: 'k' })}\n`);
    const report = await runDoctor({ cwd: dir, deps: { ghVersion: ghOk, gscClient: gscOk } });
    expect(report.checks.map((check) => check.name)).toEqual(['site-config', 'gh', 'gsc-config', 'gsc-access']);
    expect(report.checks.every((check) => check.ok)).toBe(true);
  });

  it('reports missing GSC configuration without failing the doctor', async () => {
    const report = await runDoctor({ cwd: tmpSite(''), deps: { ghVersion: ghOk } });
    expect(report.checks.find((check) => check.name === 'gsc-config')?.ok).toBe(true);
  });

  it('formats a markdown report', async () => {
    const markdown = formatDoctor(await runDoctor({ cwd: tmpSite(''), deps: { ghVersion: ghOk } }));
    expect(markdown).toContain('# anvil-ops doctor');
    expect(markdown).toContain('site-config');
  });
});
