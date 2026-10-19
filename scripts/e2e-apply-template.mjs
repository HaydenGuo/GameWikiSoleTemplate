#!/usr/bin/env node
/**
 * e2e-apply-template.mjs — real-mode E2E for the apply-template CLI.
 *
 * Run `pnpm test:e2e` (CI job `e2e-template` runs exactly this):
 *   1. Export the committed template (git archive HEAD) into a scratch dir.
 *   2. pnpm install there.
 *   3. Run `pnpm apply-template --answers` (REAL mode — writes files; the
 *      answers file walks the same ask/askBool path as interactive input).
 *   4. Assert the CLI's output shape (landing gone, locale JSON matches the
 *      shapes the home components actually render).
 *   5. pnpm build the result — a fork's first build must succeed.
 *
 * Why this exists: apply-template has zero vitest coverage and only breaks
 * in real (non-dry-run) mode, which the demo repo never exercises — three
 * real-mode bugs shipped through all eight gates unnoticed (PR #10 ENOENT
 * crash; home-template schema drift crashing the fork's first build; a
 * false-positive success message). Gates cannot catch this class; only
 * driving the CLI against a throwaway copy can.
 *
 * Env:
 *   PRESET=codes|guides  homepage preset to drive (default: codes)
 *   KEEP=1               keep the scratch dir for debugging
 *
 * Note: `git archive HEAD` exports the COMMITTED tree — commit your changes
 * before running this locally if you want them covered.
 */
import { execFileSync, execSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const preset = process.env.PRESET === 'guides' ? 'guides' : 'codes';
const keep = process.env.KEEP === '1';
const scratch = mkdtempSync(join(tmpdir(), 'gamewiki-sole-template-e2e-'));
const win = process.platform === 'win32';

let failed = false;
const fail = (msg) => {
  console.error(`❌ ${msg}`);
  failed = true;
};
const step = (msg) => console.log(`\n▶ ${msg}`);

process.on('exit', () => {
  if (keep) console.log(`\nℹ️  KEEP=1 — scratch kept at ${scratch}`);
  else rmSync(scratch, { recursive: true, force: true });
});

// 1. Export the template. In a source checkout without a commit (common for
// local template development), copy the working tree while excluding runtime
// artifacts. CI and committed checkouts continue to use git archive so the
// E2E remains a true committed-tree test there.
const hasHead = spawnSync('git', ['rev-parse', '--verify', 'HEAD'], {
  cwd: root,
  stdio: 'ignore',
  shell: win,
}).status === 0;
step(`${hasHead ? 'Export committed template (git archive HEAD)' : 'Copy working-tree template (no git HEAD)'} → ${scratch}`);
if (hasHead) {
  if (win) {
    const archivePath = join(scratch, 'template-e2e.zip');
    const zip = execSync('git archive --format=zip HEAD', { cwd: root, maxBuffer: 512 * 1024 * 1024 });
    writeFileSync(archivePath, zip);
    execFileSync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', 'Expand-Archive -LiteralPath $env:E2E_ARCHIVE -DestinationPath $env:E2E_DEST -Force'],
      { cwd: scratch, stdio: 'inherit', env: { ...process.env, E2E_ARCHIVE: archivePath, E2E_DEST: scratch } },
    );
    rmSync(archivePath, { force: true });
  } else {
    const tar = execSync('git archive HEAD', { cwd: root, maxBuffer: 512 * 1024 * 1024 });
    execSync('tar -xf -', { input: tar, cwd: scratch });
  }
} else {
  cpSync(root, scratch, {
    recursive: true,
    filter: (source) => {
      const rel = relative(root, source);
      if (!rel) return true;
      const first = rel.split(sep)[0];
      return !['.git', 'node_modules', 'dist', '.astro'].includes(first) && !first.startsWith('node_modules.stale-');
    },
  });
}

// 2. Install (pnpm store is shared → warm cache makes this fast).
step('pnpm install in scratch copy');
execSync('pnpm install --prefer-offline', { cwd: scratch, stdio: 'inherit', shell: win });

// 3. Drive the CLI via --answers (non-interactive, same ask/askBool path):
//    Setup prompts include a target Steam App ID and optional exact store title.
//    categories / clear-content / preset / proceed.
step(`apply-template real mode (preset=${preset})`);
const answers = [
  'Test Game', // Full game name
  '', // Short name (default)
  'testgame.vercel.app', // Domain
  '', // Tagline
  '', // Description
  '', // Legal notice
  '', // Official URL
  '#3b82f6', // Theme color
  '', // Platform
  '', // Developer
  '', // Genre
  '', // Release date
  '123456', // Steam App ID
  'Test Game', // Steam store title
  'en,zh', // Locales
  'bosses,guides,codes', // Categories
  'y', // Clear demo content? YES
  preset === 'guides' ? '2' : '1', // Homepage preset
  '', // Remove landing? (default yes)
  'y', // Proceed? YES
];
writeFileSync(join(scratch, 'e2e-answers.json'), JSON.stringify(answers, null, 2));
const cli = spawnSync(
  'pnpm',
  ['apply-template', '--answers', 'e2e-answers.json'],
  {
    cwd: scratch,
    encoding: 'utf8',
    shell: win,
    timeout: 5 * 60 * 1000,
  },
);
if (cli.stdout) console.log(cli.stdout);
if (cli.status !== 0) {
  if (cli.stderr) console.error(cli.stderr);
  fail(`apply-template exited ${cli.status}${cli.error ? ` (${cli.error.message})` : ''}`);
  process.exit(1);
}
if (!/Base config complete/.test(cli.stdout)) {
  fail('CLI exited 0 but never reached its completion marker');
  process.exit(1);
}
if (/left over/.test(cli.stdout)) {
  fail('answers file has MORE entries than the CLI has prompts — prompt sequence drifted');
  process.exit(1);
}

// 4. Assert the output shape — the exact fields the home components render.
step('Assert output shape');
const generatedSiteConfig = readFileSync(join(scratch, 'src/config/site.ts'), 'utf8');
const generatedHomeSource = readFileSync(join(scratch, 'src/components/home/HomePage.astro'), 'utf8');
const generatedDealsSource = readFileSync(join(scratch, 'src/components/deals/DealsPage.astro'), 'utf8');
for (const p of ['src/config/landing.ts', 'src/components/landing', 'src/pages/landing', 'src/pages/zh/landing']) {
  if (existsSync(join(scratch, p))) fail(`landing path still present after removal: ${p}`);
}
const en = JSON.parse(readFileSync(join(scratch, 'src/locales/en.json'), 'utf8'));
const checks = [
  ['setup stores the selected Steam App ID in site config', /steamAppId:\s*123456/.test(generatedSiteConfig)],
  ['setup stores the selected Steam store title in site config', /steamGameTitle:\\s*'Test Game'/.test(generatedSiteConfig)],
  ['homepage keeps live stats on the same-origin API without forcing no-cache', generatedHomeSource.includes('/api/game-deals?appid=') && !generatedHomeSource.includes("cache: 'no-cache'")],
  ['Deals keeps refreshes on the canonical cached API URL', generatedDealsSource.includes('/api/game-deals?appid=') && !generatedDealsSource.includes('refresh=1') && !generatedDealsSource.includes("cache: 'no-cache'")],
  ['initializer retains the Vercel handler and shared-cache lock', existsSync(join(scratch, 'api/game-deals.ts')) && readFileSync(join(scratch, 'api/game-deals.ts'), 'utf8').includes('REFRESH_LOCK_TTL')],
  ['home.meta.title is a string', typeof en.home?.meta?.title === 'string'],
  ['home.meta.description is a string', typeof en.home?.meta?.description === 'string'],
  ['hero.ctaPrimary is a string (components render it as link text)', typeof en.home?.hero?.ctaPrimary === 'string'],
  ['hero.ctaSecondary is a string', typeof en.home?.hero?.ctaSecondary === 'string'],
  ['closingCta.primary is a string', typeof en.home?.closingCta?.primary === 'string'],
  ['start.cards are keyed metadata for the first four primary content navigation entries', JSON.stringify(en.home?.start?.cards?.map((card) => card.key)) === JSON.stringify(['guides', 'bosses', 'codes'])],
  ['nav labels auto-filled for chosen categories (3-place rule)', ['bosses', 'guides', 'codes'].every((k) => typeof en.nav?.[k] === 'string')],
  ['existing Deals utility label survives template initialization', en.nav?.deals === 'Deals'],
  ['zh locale retains the Deals utility label too', (() => {
    const zh = JSON.parse(readFileSync(join(scratch, 'src/locales/zh.json'), 'utf8'));
    return typeof zh.nav?.deals === 'string';
  })()],
  ['Deals remains a non-content primary navigation item', /key:\s*'deals'[^}]*isContentType:\s*false/.test(readFileSync(join(scratch, 'src/config/navigation.ts'), 'utf8'))],
  ['overview entries auto-filled for chosen categories', ['bosses', 'guides', 'codes'].every((k) => typeof en.overview?.[k]?.overviewTitle === 'string')],
  ['zh locale nav labels auto-filled too (check-config checks every locale)', (() => {
    const zh = JSON.parse(readFileSync(join(scratch, 'src/locales/zh.json'), 'utf8'));
    return ['bosses', 'guides', 'codes'].every((k) => typeof zh.nav?.[k] === 'string');
  })()],
  ['site.description makes no community/update promise it cannot keep', !/by the community|updated daily|tested daily/i.test(en.site?.description ?? '')],
  ['.env.example has the selected site URL', readFileSync(join(scratch, '.env.example'), 'utf8').includes('SITE_URL=https://testgame.vercel.app')],
  ['.env.example leaves optional Popular integration disabled', readFileSync(join(scratch, '.env.example'), 'utf8').includes('PUBLIC_POPULAR_ENABLED=false')],
  ['default environment file contains no demo Giscus configuration', !readFileSync(join(scratch, '.env.example'), 'utf8').includes('PNGTRID')],
  ['environment example leaves GA disabled', readFileSync(join(scratch, '.env.example'), 'utf8').includes('PUBLIC_GA_ID=')],
  ['generic homepage analytics helper ships with the fork', existsSync(join(scratch, 'src/lib/homepage-analytics.ts'))],
];
for (const [name, ok] of checks) {
  console.log(`  ${ok ? '✅' : '❌'} ${name}`);
  if (!ok) fail(name);
}
if (failed) process.exit(1);

// 4.5 Re-run safety (2026-09-01 audit P1: apply-template used to delete ANY
// unchosen locale — a re-run destroyed locales the user had added). Run 1
// must have removed the demo's unchosen ja.json; a user-created ko.json must
// survive run 2 with a loud warning. removeLandingPage/clearDemoContent/
// environment example rewrite is idempotent, so run 2 must exit 0 and complete.
if (existsSync(join(scratch, 'src/locales/ja.json'))) {
  fail('demo ja.json still present — unchosen demo locale was not removed on run 1');
}
writeFileSync(join(scratch, 'src/locales/ko.json'), JSON.stringify({ nav: { home: '홈' } }, null, 2), 'utf8');
// A demo-NAMED locale whose content was already rewritten for the forker's own
// game (a previous run chose ja) must also survive: auto-delete is content-aware
// (site.name still demo?) — filename alone must not decide (24h-audit P2 follow-up).
writeFileSync(
  join(scratch, 'src/locales/ja.json'),
  JSON.stringify({ site: { name: 'My Game Wiki' }, nav: { home: 'ホーム' } }, null, 2),
  'utf8',
);
step('apply-template re-run (idempotent, keeps user locales)');
const rerun = spawnSync(
  'pnpm',
  ['apply-template', '--answers', 'e2e-answers.json'],
  {
    cwd: scratch,
    encoding: 'utf8',
    shell: win,
    timeout: 5 * 60 * 1000,
  },
);
if (rerun.status !== 0) {
  if (rerun.stderr) console.error(rerun.stderr);
  fail(`apply-template RE-RUN exited ${rerun.status}${rerun.error ? ` (${rerun.error.message})` : ''}`);
  process.exit(1);
}
if (!/Base config complete/.test(rerun.stdout || '')) {
  fail('re-run exited 0 but never reached its completion marker');
  process.exit(1);
}
if (/left over/.test(rerun.stdout || '')) {
  fail('re-run reports leftover answers — prompt sequence drifted');
}
// ⚠️ CLI warnings go to stderr (console.warn), completion markers to stdout.
if (!/not in your chosen locales/.test((rerun.stdout || '') + (rerun.stderr || ''))) {
  fail('re-run did not warn about the user-created locale');
}
if (!existsSync(join(scratch, 'src/locales/ko.json'))) {
  fail('re-run DELETED src/locales/ko.json — user locale destroyed (audit P1 regression)');
}
if (!existsSync(join(scratch, 'src/locales/ja.json'))) {
  fail('re-run DELETED the rebranded ja.json — content-aware check regressed to filename-only');
}
if (!/My Game Wiki/.test(readFileSync(join(scratch, 'src/locales/ja.json'), 'utf8'))) {
  fail('re-run overwrote the rebranded ja.json site.name with demo/placeholder content');
}
// Heed the warning like a user would, so the gates below see a clean state.
rmSync(join(scratch, 'src/locales/ko.json'));
rmSync(join(scratch, 'src/locales/ja.json'));

// Write a small consumer article to exercise audit markers in generated HTML.
step('Write audit-marker fixture article');
const auditFixture = `---
title: 'Audit marker fixture'
description: 'A focused fixture article for checking generated page, question, and answer markers.'
category: 'guides'
date: 2026-10-18
summary: 'This fixture confirms that external acceptance metadata is present in generated article HTML.'
auditPageId: 'STAGE4-PAGE-01'
---

import AuditRegion from '~/components/mdx/AuditRegion.astro';

![Guide card](/images/home/guide-card.svg)

<AuditRegion kind="question" id="STAGE4-Q-01">

## Which route reaches the courtyard?

Take the northern route from the broken bridge to reach the upper courtyard.

</AuditRegion>

<AuditRegion kind="answer-obligation" id="STAGE4-AO-01">

The northern route starts at the broken bridge and reaches the upper courtyard.

</AuditRegion>
`;
const auditFixturePath = join(scratch, 'src/content/wiki/en/guides/template-audit-markers.mdx');
writeFileSync(auditFixturePath, auditFixture, 'utf8');

// The Vercel Function and its same-origin callers must survive initialization.
step('Assert same-origin Vercel game-deals API contract');
const gameDealsApiPath = join(scratch, 'api/game-deals.ts');
if (!existsSync(gameDealsApiPath)) fail('Generated fork is missing the root Vercel Function api/game-deals.ts');
else if (!readFileSync(gameDealsApiPath, 'utf8').includes('export async function GET(')) {
  fail('Generated api/game-deals.ts does not export the Vercel GET handler');
}
const generatedHomeSource = readFileSync(join(scratch, 'src/components/home/HomePage.astro'), 'utf8');
if (!generatedHomeSource.includes('fetch(`/api/game-deals?appid=')) {
  fail('Generated homepage does not call the same-origin /api/game-deals route');
}
const generatedDealsSource = readFileSync(join(scratch, 'src/components/deals/DealsPage.astro'), 'utf8');
if (!generatedDealsSource.includes('`/api/game-deals?appid=')) {
  fail('Generated Deals page does not call the same-origin /api/game-deals route');
}

// 5. The fork's first build must succeed.
step("pnpm build (the fork's first build must succeed)");
execSync('pnpm build', { cwd: scratch, stdio: 'inherit', shell: win });

const auditHtml = readFileSync(join(scratch, 'dist/guides/template-audit-markers/index.html'), 'utf8');
for (const [label, marker] of [
  ['page ID', 'data-page-id="STAGE4-PAGE-01"'],
  ['question ID', 'data-question-id="STAGE4-Q-01"'],
  ['answer-obligation ID', 'data-answer-obligation-id="STAGE4-AO-01"'],
]) {
  if (!auditHtml.includes(marker)) fail(`Generated article is missing ${label}: ${marker}`);
}
if (!/data-question-id="STAGE4-Q-01"[\s\S]*?northern route/i.test(auditHtml)) {
  fail('Question marker does not enclose visible answer text');
}
if (!/data-answer-obligation-id="STAGE4-AO-01"[\s\S]*?broken bridge/i.test(auditHtml)) {
  fail('Answer-obligation marker does not enclose visible answer text');
}

// 5.5 The fork's first check-config run must be green — a fresh fork with a
// red consistency gate is a day-one trap (empty nav broke this in v2.6.0).
step("pnpm check-config (the fork's first CI run must be green)");
execSync('pnpm check-config', { cwd: scratch, stdio: 'inherit', shell: win });

step('Assert built pages');
for (const p of ['dist/index.html', 'dist/zh/index.html']) {
  const html = readFileSync(join(scratch, p), 'utf8');
  const expectedDealsHref = p.startsWith('dist/zh/') ? '/zh/deals/' : '/deals/';
  if (!html.includes(`href=\"${expectedDealsHref}\"`)) fail(`${p}: Deals is missing from the rendered primary navigation`);
  if (!html.includes('<title>Test Game Wiki')) fail(`${p}: homepage <title> missing`);
  if (html.includes('object Object')) fail(`${p}: an object was rendered as [object Object]`);
  if (html.includes('homepage_nav_click')) fail(`${p}: optional GA click listener emitted while PUBLIC_GA_ID is empty`);
}
if (failed) process.exit(1);

console.log('\n✅ E2E passed — apply-template real mode produces a buildable site');
