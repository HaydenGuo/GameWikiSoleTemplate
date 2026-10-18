import { spawnSync } from 'node:child_process';
import { loadOpsEnv } from './env.js';
import { loadSiteConfig } from './site.js';
import { createGscClient } from './providers/gsc.js';
import type { GscClient } from './providers/gsc.js';
import { OpsError } from './errors.js';

export interface DoctorCheck {
  name: string;
  ok: boolean;
  detail: string;
  fix?: string;
}

export interface DoctorReport {
  checks: DoctorCheck[];
}

export interface DoctorDeps {
  ghVersion?: () => { ok: boolean; detail: string; fix?: string };
  gscClient?: GscClient;
}

function defaultGhVersion(): { ok: boolean; detail: string; fix?: string } {
  const res = spawnSync('gh', ['--version'], { encoding: 'utf8' });
  if (res.status === 0) return { ok: true, detail: (res.stdout ?? '').split('\n')[0] };
  return {
    ok: false,
    detail: 'gh CLI not found on PATH',
    fix: 'Install GitHub CLI: https://cli.github.com/ (needed for `anvil-ops submit` in P3)',
  };
}

export async function runDoctor(opts: { cwd: string; deps?: DoctorDeps }): Promise<DoctorReport> {
  const checks: DoctorCheck[] = [];
  const deps = opts.deps ?? {};

  // 1. site config
  let siteUrl: string | undefined;
  // .env lives at the DISCOVERED repo root (site.root), not the cwd — running
  // doctor from a subdirectory must not falsely report "not configured"
  // (metrics/insights already resolve against site.root).
  let siteRoot: string | undefined;
  try {
    const site = loadSiteConfig(opts.cwd);
    siteRoot = site.root;
    siteUrl = site.siteUrl;
    if (!site.siteUrl) {
      checks.push({
        name: 'site-config',
        ok: false,
        detail: `config found (${site.source}) but SITE_URL is not set`,
        fix:
          'Add SITE_URL=https://your-domain to the .env file.',
      });
    } else {
      checks.push({
        name: 'site-config',
        ok: true,
        detail: `repo root ${site.root}; SITE_URL=${site.siteUrl} (from ${site.source})`,
      });
    }
  } catch (e) {
    const err = e instanceof OpsError ? e : new OpsError(String(e), '');
    checks.push({ name: 'site-config', ok: false, detail: err.message, fix: err.fix || 'Run anvil-ops inside your GameWikiSoleTemplate fork.' });
  }

  // 2. gh
  const gh = deps.ghVersion ?? defaultGhVersion;
  checks.push({ name: 'gh', ...gh() });

  // 3. env / gsc
  const env = loadOpsEnv(siteRoot ?? opts.cwd);
  if (env.gscServiceAccount && siteUrl) {
    checks.push({ name: 'gsc-config', ok: true, detail: `service account ${env.gscServiceAccount.clientEmail}` });
    const client = deps.gscClient ?? createGscClient({ credential: env.gscServiceAccount, siteUrl });
    try {
      const sites = await client.listAccessibleSites();
      const wanted = siteUrl.endsWith('/') ? siteUrl : siteUrl + '/';
      if (sites.some((s) => s.replace(/\/$/, '') === wanted.replace(/\/$/, ''))) {
        checks.push({ name: 'gsc-access', ok: true, detail: `property ${wanted} accessible` });
      } else {
        checks.push({
          name: 'gsc-access',
          ok: false,
          detail: `property ${wanted} not in accessible list (${sites.length} sites)`,
          fix: 'Search Console > Settings > Users and permissions > Add user, add the service account email as Restricted.',
        });
      }
    } catch (e) {
      checks.push({
        name: 'gsc-access',
        ok: false,
        detail: e instanceof Error ? e.message || e.name : String(e) || 'unknown error',
        fix: 'Check the service account key and property sharing; re-run with a fresh key from Google Cloud IAM.',
      });
    }
  } else {
    checks.push({
      name: 'gsc-config',
      ok: true,
      detail: 'GSC not configured — metrics are unavailable until credentials are added (not an error)',
    });
  }
  for (const p of env.problems) {
    checks.push({ name: 'gsc-config', ok: false, detail: p, fix: 'Fix the value in .env, then re-run `anvil-ops doctor`.' });
  }

  return { checks };
}

export function formatDoctor(report: DoctorReport): string {
  const lines = ['# anvil-ops doctor'];
  for (const c of report.checks) {
    lines.push(`- ${c.ok ? '[ok]' : '[FAIL]'} ${c.name}: ${c.detail}`);
    if (!c.ok && c.fix) lines.push(`  fix: ${c.fix}`);
  }
  const failed = report.checks.filter((c) => !c.ok).length;
  lines.push('', failed === 0 ? 'All checks passed.' : `${failed} check(s) failed.`);
  return lines.join('\n') + '\n';
}
