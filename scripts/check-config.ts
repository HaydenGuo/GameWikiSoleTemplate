/**
 * check-config.ts
 *
 * Cross-validates the THREE-PLACE consistency rules that the build itself
 * does NOT enforce (see AGENTS.md constraints #4 and #5). Fork users most
 * often break their site by missing one of these — this script catches it
 * before `pnpm build` produces a half-working site.
 *
 * Checks:
 *   1. Nav key consistency (AGENTS.md rule #4):
 *        navigation.ts NAVIGATION_CONFIG[].key
 *      = en.json nav.<key>
 *      = src/content/wiki/en/<key>/ directory (for isContentType items)
 *   2. Locale consistency (AGENTS.md rule #5):
 *        routing.ts locales
 *      = src/locales/*.json files
 *      = src/content/wiki/<locale>/ directories
 *   3. Homepage displayType enum:
 *        every locales/<loc>.json home.explore.modules[].displayType
 *      must be one of the 6 supported values.
 *   4. Overview labels: en.json overview.<key> exists for every nav key.
 *   5. Deployment domain gate (the wrangler.toml trap, caught in real use):
 *        effective SITE_URL host (env override > wrangler.toml [vars])
 *      must equal src/config/site.ts `domain`. When wrangler.toml exists it
 *      is the SOLE source of Pages env — a leftover demo SITE_URL silently
 *      points every canonical/sitemap at the wrong site.
 *
 * Exits 1 on any error, 0 when clean. Style matches check-sitemap.ts.
 *
 * Usage: pnpm check-config   (added to package.json scripts)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.resolve(ROOT, p), 'utf8');

const DISPLAY_TYPES = ['badge-list', 'steps', 'ranked-grid', 'labeled-cards', 'timeline', 'video-grid'];

let errors = 0;
const err = (msg: string) => {
  console.error(`  ❌ ${msg}`);
  errors++;
};

// ---------------------------------------------------------------------------
// 1. Parse navigation.ts keys
// ---------------------------------------------------------------------------
const navSrc = read('src/config/navigation.ts');
const navKeys = Array.from(navSrc.matchAll(/key: '([^']+)'/g)).map((m) => m[1]);

// ---------------------------------------------------------------------------
// 2. Parse routing.ts locales
// ---------------------------------------------------------------------------
const routingSrc = read('src/i18n/routing.ts');
const localesMatch = routingSrc.match(/export const locales = \[([^\]]+)\] as const;/);
if (!localesMatch) {
  err('Could not parse `locales` array in src/i18n/routing.ts');
  process.exit(1);
}
const routingLocales = Array.from(localesMatch[1].matchAll(/'([^']+)'/g)).map((m) => m[1]);

// ---------------------------------------------------------------------------
// 3. Load en.json
// ---------------------------------------------------------------------------
let enJson: Record<string, any>;
try {
  enJson = JSON.parse(read('src/locales/en.json'));
} catch (e) {
  err(`src/locales/en.json is not valid JSON: ${(e as Error).message}`);
  process.exit(1);
}

console.log('\n🔧 AnvilWiki config consistency check\n');
console.log('━'.repeat(60));

// --- Check 1: nav key → en.json nav.<key> → content dir -------------------
console.log('\n1. Nav key consistency (navigation.ts ↔ en.json ↔ content dirs)');
for (const key of navKeys) {
  if (!enJson.nav || !(key in enJson.nav)) {
    err(`en.json is missing nav.${key} (header will show the raw key)`);
  }
  if (!enJson.overview || !(key in (enJson.overview ?? {}))) {
    err(`en.json is missing overview.${key} (list page will have no title)`);
  }
  const contentDir = path.resolve(ROOT, 'src/content/wiki/en', key);
  if (key === 'deals') continue; // Fixed utility route, not an article collection.
  if (!fs.existsSync(contentDir)) {
    // Not an error: an empty category simply renders the "no articles" state
    // on its list page. Surface as info so users know it's intentional-looking.
    console.log(`  ℹ️  src/content/wiki/en/${key}/ has no content yet (list page will show the empty state)`);
  }
}
if (errors === 0) console.log('  ✅ all nav keys consistent');

// --- Check 2: locale consistency -------------------------------------------
console.log('\n2. Locale consistency (routing.ts ↔ locales/*.json ↔ content dirs)');
let localeErrors = 0;
for (const loc of routingLocales) {
  const jsonPath = path.resolve(ROOT, 'src/locales', `${loc}.json`);
  if (!fs.existsSync(jsonPath)) {
    err(`src/locales/${loc}.json missing (declared in routing.ts)`);
    localeErrors++;
  }
  const contentDir = path.resolve(ROOT, 'src/content/wiki', loc);
  if (!fs.existsSync(contentDir)) {
    err(`content directory src/content/wiki/${loc}/ missing (declared in routing.ts)`);
    localeErrors++;
  }
}
for (const f of fs.readdirSync(path.resolve(ROOT, 'src/locales'))) {
  if (!f.endsWith('.json')) continue;
  const loc = f.replace('.json', '');
  if (!routingLocales.includes(loc)) {
    err(`src/locales/${f} exists but "${loc}" is not in routing.ts locales`);
    localeErrors++;
  }
}
if (localeErrors === 0) console.log('  ✅ all locales consistent');

// --- Check 3: displayType enum ----------------------------------------------
console.log('\n3. Homepage displayType enum (all locale JSONs)');
let displayErrors = 0;
for (const loc of routingLocales) {
  const jsonPath = path.resolve(ROOT, 'src/locales', `${loc}.json`);
  if (!fs.existsSync(jsonPath)) continue;
  let json: Record<string, any>;
  try {
    json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (e) {
    err(`src/locales/${loc}.json is not valid JSON: ${(e as Error).message}`);
    displayErrors++;
    continue;
  }
  const modules = json?.home?.explore?.modules ?? [];
  for (let i = 0; i < modules.length; i++) {
    const dt = modules[i]?.displayType;
    if (!DISPLAY_TYPES.includes(dt)) {
      err(`${loc}.json home.explore.modules[${i}].displayType = "${dt}" is invalid (expected one of: ${DISPLAY_TYPES.join(', ')})`);
      displayErrors++;
    }
  }
}
if (displayErrors === 0) console.log('  ✅ all displayTypes valid');

// --- Check 4: mandatory two-part homepage introduction ---------------------
console.log('\n4. Homepage introduction (exactly two required sections)');
let introErrors = 0;
for (const loc of routingLocales) {
  const jsonPath = path.resolve(ROOT, 'src/locales', `${loc}.json`);
  if (!fs.existsSync(jsonPath)) continue;
  let json: Record<string, any>;
  try {
    json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch {
    continue;
  }
  const items = json?.home?.hero?.descriptionItems;
  if (!Array.isArray(items) || items.length !== 2) {
    err(`${loc}.json home.hero.descriptionItems must contain exactly two sections: Game background and Core gameplay`);
    introErrors++;
    continue;
  }
  const expectedLabels = ['Game background', 'Core gameplay'];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (loc === 'en' && item?.label !== expectedLabels[i]) {
      err(`${loc}.json home.hero.descriptionItems[${i}].label must be "${expectedLabels[i]}"`);
      introErrors++;
    }
    if (typeof item?.label !== 'string' || !item.label.trim()) {
      err(`${loc}.json home.hero.descriptionItems[${i}].label must be a non-empty string`);
      introErrors++;
    }
    if (typeof item?.text !== 'string' || !item.text.trim()) {
      err(`${loc}.json home.hero.descriptionItems[${i}].text must be a non-empty string`);
      introErrors++;
    }
  }
}
if (introErrors === 0) console.log('  ✅ both introduction sections are present in all locales');

// --- Check 5: fixed homepage decision guide -------------------------------
console.log('\n5. Homepage decision guide contract (3 groups × 3 directions)');
let decisionGuideErrors = 0;
for (const loc of routingLocales) {
  const jsonPath = path.resolve(ROOT, 'src/locales', `${loc}.json`);
  if (!fs.existsSync(jsonPath)) continue;
  let json: Record<string, any>;
  try {
    json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch {
    continue;
  }
  const guide = json?.home?.decisionGuide;
  if (!guide || !Array.isArray(guide.groups) || guide.groups.length !== 3) {
    err(`${loc}.json home.decisionGuide must define exactly 3 player groups`);
    decisionGuideErrors++;
    continue;
  }
  for (let i = 0; i < guide.groups.length; i++) {
    const directions = guide.groups[i]?.directions;
    if (!Array.isArray(directions) || directions.length !== 3) {
      err(`${loc}.json home.decisionGuide.groups[${i}].directions must contain exactly 3 directions`);
      decisionGuideErrors++;
    }
  }
}
if (decisionGuideErrors === 0) console.log('  ✅ fixed decision guide present in all locales');

// --- Check 6: single-source brand mark and derived favicon files -----------
console.log('\n6. Brand mark and favicon assets');
const readPngDimensions = (filePath: string): { width: number; height: number } | null => {
  if (!fs.existsSync(filePath)) return null;
  const image = fs.readFileSync(filePath);
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (image.length < 24 || !image.subarray(0, 8).equals(pngSignature) || image.toString('ascii', 12, 16) !== 'IHDR') {
    return null;
  }
  return { width: image.readUInt32BE(16), height: image.readUInt32BE(20) };
};
const sourceMarkPath = path.resolve(ROOT, 'src/assets/branding/brand-mark.png');
const sourceMark = readPngDimensions(sourceMarkPath);
if (!sourceMark) {
  err('src/assets/branding/brand-mark.png is missing or is not a valid PNG');
} else if (sourceMark.width !== sourceMark.height || sourceMark.width < 512) {
  err(`brand-mark.png must be square and at least 512×512; received ${sourceMark.width}×${sourceMark.height}`);
} else {
  console.log(`  ✅ square source mark ${sourceMark.width}×${sourceMark.height}`);
}
for (const [file, expectedSize] of [
  ['public/brand-mark-512.png', 512],
  ['public/favicon-48x48.png', 48],
] as const) {
  const dimensions = readPngDimensions(path.resolve(ROOT, file));
  if (!dimensions || dimensions.width !== expectedSize || dimensions.height !== expectedSize) {
    err(`${file} must be a valid ${expectedSize}×${expectedSize} PNG; run pnpm gen-assets --force`);
  }
}
const icoPath = path.resolve(ROOT, 'public/favicon.ico');
const ico = fs.existsSync(icoPath) ? fs.readFileSync(icoPath) : Buffer.alloc(0);
const hasValidIcoHeader = ico.length >= 22
  && ico.readUInt16LE(0) === 0
  && ico.readUInt16LE(2) === 1
  && ico.readUInt16LE(4) >= 1;
const icoImageOffset = hasValidIcoHeader ? ico.readUInt32LE(18) : 0;
const icoImageLength = hasValidIcoHeader ? ico.readUInt32LE(14) : 0;
const hasValidEmbeddedImage = icoImageOffset >= 22
  && icoImageLength >= 24
  && icoImageOffset + icoImageLength <= ico.length
  && ico.subarray(icoImageOffset, icoImageOffset + 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
if (!hasValidIcoHeader || !hasValidEmbeddedImage) {
  err('public/favicon.ico is missing or invalid; run pnpm gen-assets --force');
} else {
  console.log('  ✅ PNG and ICO favicon outputs are present');
}

// --- Check 7: deployment domain gate (wrangler.toml ↔ site.ts) -------------
console.log('\n7. Deployment domain (wrangler.toml SITE_URL ↔ site.ts domain)');
const siteSrc = read('src/config/site.ts');
const domain = siteSrc.match(/^\s*domain:\s*'([^']+)'/m)?.[1];
let effectiveUrl = process.env.SITE_URL ?? '';
let urlSource = 'env SITE_URL';
if (!effectiveUrl && fs.existsSync(path.resolve(ROOT, 'wrangler.toml'))) {
  effectiveUrl = read('wrangler.toml').match(/^SITE_URL\s*=\s*"([^"]+)"/m)?.[1] ?? '';
  urlSource = 'wrangler.toml [vars]';
}
if (!domain) {
  err('could not parse `domain` in src/config/site.ts');
} else if (!effectiveUrl) {
  err(`no SITE_URL found (env or wrangler.toml) — canonical/sitemap would fall back to https://${domain}`);
} else {
  try {
    const host = new URL(effectiveUrl).host;
    if (host !== domain) {
      err(
        `${urlSource} SITE_URL host "${host}" ≠ site.ts domain "${domain}" — every canonical/og:url/sitemap URL would point at the wrong site. Fix wrangler.toml [vars] (or delete the file, see docs/deployment.md).`,
      );
    } else {
      console.log(`  ✅ ${urlSource} → ${effectiveUrl} matches site.ts domain`);
    }
  } catch {
    err(`${urlSource} SITE_URL "${effectiveUrl}" is not a valid URL (must include https://)`);
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n' + '━'.repeat(60));
if (errors > 0) {
  console.error(`\n❌ ${errors} config problem${errors === 1 ? '' : 's'} found. Fix the above before deploying.\n`);
  process.exit(1);
}
console.log('\n✅ Config is consistent.\n');
