import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectMetrics, formatMetrics } from '../src/core/metrics.js';
import type { GscClient } from '../src/core/providers/gsc.js';

function tmpSite(dotenv: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'ops-metrics-'));
  writeFileSync(join(dir, '.env'), `SITE_URL=https://wiki.example.com\n${dotenv}`);
  return dir;
}

const fakeGsc: GscClient = {
  async query() {
    return { rows: [{ page: '/b', query: 'q', clicks: 10, impressions: 100, ctr: 0.1, position: 3 }], totals: { clicks: 10, impressions: 100, ctr: 0.1, position: 3 } };
  },
  async listAccessibleSites() { return ['https://wiki.example.com/']; },
};

describe('collectMetrics', () => {
  it('returns GSC metrics with configured credentials', async () => {
    const dir = tmpSite(`GSC_SERVICE_ACCOUNT_JSON=${JSON.stringify({ client_email: 'e@x', private_key: 'k' })}\n`);
    const report = await collectMetrics({ cwd: dir, days: 7, gscClientFactory: () => fakeGsc });
    expect(report.gsc?.totals.clicks).toBe(10);
    expect(report.degraded).toEqual([]);
  });

  it('reports missing credentials as an actionable error', async () => {
    const dir = tmpSite('');
    await expect(collectMetrics({ cwd: dir, days: 7 })).rejects.toMatchObject({ fix: expect.stringMatching(/doctor/) });
  });
});

describe('formatMetrics', () => {
  it('formats the configured source', () => {
    const report = { days: 28, siteUrl: 'https://wiki.example.com', degraded: [], notes: [], gsc: { rows: [], totals: { clicks: 1, impressions: 2, ctr: 0.5, position: 3 } } };
    expect(formatMetrics(report, 'md')).toContain('Google Search Console');
    expect(JSON.parse(formatMetrics(report, 'json')).gsc.totals.clicks).toBe(1);
  });
});
