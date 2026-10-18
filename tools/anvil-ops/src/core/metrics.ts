import { loadOpsEnv } from './env.js';
import type { GscCredential } from './env.js';
import { OpsError } from './errors.js';
import { loadSiteConfig } from './site.js';
import { createGscClient } from './providers/gsc.js';
import type { GscClient, GscQueryResult } from './providers/gsc.js';
export type MetricsSource = 'gsc' | 'all';

export interface MetricsReport {
  days: number;
  siteUrl?: string;
  gsc?: GscQueryResult;
  degraded: ('gsc')[];
  notes: string[];
}

function pad(cell: string, width: number): string {
  return cell + ' '.repeat(Math.max(0, width - cell.length));
}

export async function collectMetrics(opts: {
  cwd: string;
  days: number;
  source?: MetricsSource;
  gscClientFactory?: (o: { credential: GscCredential; siteUrl: string }) => GscClient;
}): Promise<MetricsReport> {
  const site = loadSiteConfig(opts.cwd);
  const env = loadOpsEnv(site.root);
  const wanted = opts.source ?? 'all';
  const degraded: ('gsc')[] = [];

  const gscReady = wanted === 'all' || wanted === 'gsc' ? env.gscServiceAccount && site.siteUrl : false;
  if (!gscReady) {
    throw new OpsError(
      'No analytics source is configured.',
      'Set GSC_SERVICE_ACCOUNT_JSON in the local .env file and ensure SITE_URL is configured. Run `anvil-ops doctor` for a guided check.',
    );
  }

  const report: MetricsReport = { days: opts.days, siteUrl: site.siteUrl, degraded, notes: [...env.problems] };

  const failures: string[] = [];

  if (gscReady) {
    const factory = opts.gscClientFactory ?? createGscClient;
    const client = factory({ credential: env.gscServiceAccount!, siteUrl: site.siteUrl! });
    try {
      report.gsc = await client.query({ days: opts.days });
      if (report.gsc.rows.length >= 1000) {
        report.notes.push('GSC rows capped at the 1000-row API limit — long-tail queries beyond the cap are excluded.');
      }
    } catch (e) {
      failures.push(`gsc: ${e instanceof Error ? e.message : String(e)}`);
      degraded.push('gsc');
    }
  } else {
    degraded.push('gsc');
  }
  if (!report.gsc && failures.length > 0) {
    throw new OpsError(
      `All configured analytics sources failed:\n  ${failures.join('\n  ')}`,
      'Run `anvil-ops doctor` to check credentials, then retry. A partial report is never shown as complete.',
    );
  }
  if (failures.length > 0) {
    report.notes.push(`Failed sources excluded from this report: ${failures.join('; ')}`);
  }

  return report;
}

export function formatMetrics(report: MetricsReport, format: 'table' | 'json' | 'md'): string {
  if (format === 'json') return JSON.stringify(report, null, 2);

  const lines: string[] = [];
  if (format === 'md') {
    lines.push(`# Metrics — last ${report.days} days`);
    if (report.siteUrl) lines.push(`Site: ${report.siteUrl}`);
    lines.push('');
  }
  if (report.gsc) {
    const t = report.gsc.totals;
    lines.push(format === 'md' ? '## Google Search Console' : 'Google Search Console');
    lines.push(
      `clicks=${t.clicks} impressions=${t.impressions} ctr=${(t.ctr * 100).toFixed(1)}% position=${t.position.toFixed(1)}`,
    );
    lines.push('');
    lines.push([pad('page', 44), pad('query', 24), pad('clicks', 8), pad('impr', 8), pad('ctr', 7), 'pos'].join(' '));
    for (const r of report.gsc.rows.slice(0, 20)) {
      lines.push(
        [
          pad(r.page.slice(0, 43), 44),
          pad(r.query.slice(0, 23), 24),
          pad(String(r.clicks), 8),
          pad(String(r.impressions), 8),
          pad((r.ctr * 100).toFixed(1) + '%', 7),
          r.position.toFixed(1),
        ].join(' '),
      );
    }
    lines.push('');
  }
  if (report.degraded.length) {
    lines.push(`Not configured (skipped): ${report.degraded.join(', ')}. Run \`anvil-ops doctor\` to enable.`);
  }
  for (const n of report.notes) lines.push(`Note: ${n}`);
  return lines.join('\n').trim() + '\n';
}
