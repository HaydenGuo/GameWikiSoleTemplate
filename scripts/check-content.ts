/**
 * check-content.ts
 *
 * Content lint — the rules that live in docs/content-format.md but were only
 * enforced by discipline. Pure fs scan over src/content/wiki/**\/*.mdx.
 *
 * Rules:
 *   1. No H1 in the body (`# ...`) — H1 is rendered from frontmatter title.
 *   2. Headings must not skip levels (H2 → H4 without an H3 in between).
 *   3. Images need alt text (`![alt](src)`, empty `![](src)` fails).
 *   4. Article images must use `ArticleImage` and `src/assets/articles/`;
 *      the legacy `public/images/articles/` path is rejected.
 *   5. Every article must contain at least one local body image. The first
 *      body image is the cover; there is no frontmatter cover fallback.
 *   6. Internal MD page links must end with "/" (site is trailingSlash:'always';
 *      Cloudflare serves /path/, a bare /path costs a 308 and misaligns
 *      canonical). Asset paths and anchors are exempt.
 *   7. Non-default-locale bodies: internal links MUST carry the locale prefix
 *      (`/ja/bosses/x`) — a bare `/bosses/x` silently lands on the English
 *      page (Aniimo shipped 177 such links before noticing).
 *   8. Fewer than 3 internal links in a body → warning (orphan-ish page:
 *      no internal links = no crawl paths, no PageRank flow).
 *
 * Style: warnings don't fail the build; errors exit 1 (can gate CI).
 *
 * Usage: pnpm check-content
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { site } from '../src/config/site.ts';
import { createSourcePolicy, isAllowedArticleSource } from '../src/lib/source-policy.ts';

const ROOT = process.cwd();
const BASE = path.resolve(ROOT, 'src/content/wiki');
const ARTICLE_SOURCE_POLICY = createSourcePolicy(site.social.official, site.social.reddit);

// Parsed from routing.ts (NOT hardcoded) so forks that change the default
// locale keep this rule honest.
const DEFAULT_LOCALE =
  fs.readFileSync(path.resolve(ROOT, 'src/i18n/routing.ts'), 'utf8').match(
    /export const defaultLocale(?:: Locale)? = '([a-z-]+)'/,
  )?.[1] ?? 'en';

// Asset paths are locale-less by design (public/ is shared) — rule 5 skips them.
const ASSET_RE = /\.(png|webp|jpe?g|gif|svg|ico|json|xml|txt|css|js|woff2?|avif|mp4)$/i;
const LEGACY_ARTICLE_IMAGE_RE = /(?:public\/)?images\/articles\//i;
const ARTICLE_IMAGE_IMPORT_RE = /import\s+[A-Za-z_$][\w$]*\s+from\s+["'][^"']*\/assets\/articles\/[^"']+["']/;
const ARTICLE_IMAGE_USE_RE = /<ArticleImage\b[^>]*\bsrc\s*=\s*\{\s*[A-Za-z_$][\w$]*\s*\}/;
const FIXED_REGION_HEADING_RE = /^#{2,6}\s+(?:quick\s+answer|sources?)\b/i;
const FIXED_REGION_COMPONENT_RE = /<(?:QuickAnswer|Sources)\b/i;

const files: string[] = [];
(function walk(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith('.mdx')) files.push(p);
  }
})(BASE);

let errorCount = 0;
const error = (file: string, line: number, msg: string) => {
  console.log(`   ❌ ${path.relative(ROOT, file)}:${line + 1}  ${msg}`);
  errorCount++;
};
const warn = (file: string, line: number, msg: string) => {
  console.log(`   ⚠️  ${path.relative(ROOT, file)}:${line + 1}  ${msg}`);
};

console.log(`\n📝 Content lint — ${files.length} MDX files\n`);

// The public article-image directory was replaced by src/assets/articles so
// Astro can process article media. Keep the old directory as a hard failure,
// rather than relying on authoring documentation to prevent regression.
const legacyArticleImageDir = path.resolve(ROOT, 'public/images/articles');
if (fs.existsSync(legacyArticleImageDir)) {
  const legacyFiles = fs.readdirSync(legacyArticleImageDir, { withFileTypes: true }).filter((entry) => entry.isFile());
  for (const entry of legacyFiles) {
    error(legacyArticleImageDir, 0, `legacy article image must move to src/assets/articles/: ${entry.name}`);
  }
}

for (const file of files) {
  // Normalize CRLF → LF: on Windows with core.autocrlf the checked-out MDX
  // has \r\n line endings, and an exact `---` match would fail, making the
  // frontmatter look like body text (phantom H1s, shifted line numbers).
  const src = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  // Strip frontmatter (between the first two `---` lines).
  const lines = src.split('\n');
  const secondFm = lines.indexOf('---', 1);
  const bodyStart = secondFm === -1 ? 0 : secondFm + 1;
  const body = lines.slice(bodyStart);
  const bodyText = body.join('\n');
  let isDraft = false;
  let summaryText = '';
  if (secondFm !== -1) {
    const frontmatter = lines.slice(1, secondFm).join('\n');
    try {
      const data = parseYaml(frontmatter) as { template?: unknown; summary?: unknown; draft?: unknown; sources?: Array<{ url?: unknown }> } | null;
      if (data?.template !== undefined && data.template !== 'default-article') {
        const templateLine = lines.findIndex((line, index) => index < secondFm && /^template\s*:/.test(line));
        error(file, templateLine === -1 ? 0 : templateLine, 'unsupported article template; use template: default-article');
      }
      summaryText = typeof data?.summary === 'string' ? data.summary : '';
      isDraft = data?.draft === true;
      if (!isDraft && !summaryText.trim()) {
        error(file, bodyStart, 'published article must provide summary; Quick Answer is a fixed page region');
      }
      for (const source of data?.sources ?? []) {
        if (typeof source?.url !== 'string') continue;
        const result = isAllowedArticleSource(source.url, ARTICLE_SOURCE_POLICY);
        if (!result.allowed) {
          const sourceLine = lines.findIndex((line, index) => index < secondFm && line.includes(source.url as string));
          error(file, sourceLine === -1 ? 0 : sourceLine, `unapproved article source: ${source.url} (${result.reason})`);
        }
      }
    } catch (err) {
      error(file, 0, `could not parse frontmatter sources: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  if (
    !isDraft &&
    (!ARTICLE_IMAGE_IMPORT_RE.test(bodyText) || !ARTICLE_IMAGE_USE_RE.test(bodyText))
  ) {
    error(file, bodyStart, 'article must contain at least one local body image; add ArticleImage with src/assets/articles/ (the first body image becomes the cover)');
  }
  // Locale of this file (path shape: <locale>/<category>/<slug>.mdx) — rule 5
  // only applies to non-default locales.
  const fileLocale = path.relative(BASE, file).split(path.sep)[0];
  let internalLinkCount = 0;

  let prevLevel = 1; // H1 "level" from the frontmatter title.
  body.forEach((line, i) => {
    const ln = i + bodyStart;

    // Quick Answer and Sources are fixed page regions. Recreating them in the
    // editable body causes duplicate information and breaks the shell order.
    if (FIXED_REGION_HEADING_RE.test(line) || FIXED_REGION_COMPONENT_RE.test(line)) {
      error(file, ln, 'Quick Answer and Sources are fixed page regions; keep the editable content between them and do not recreate either region in the body');
    }

    // 1. H1 in body.
    const h1 = line.match(/^#\s+/);
    if (h1) error(file, ln, 'H1 in body — the title H1 is rendered from frontmatter');

    // 2. Heading level skips.
    const h = line.match(/^(#{2,6})\s+/);
    if (h) {
      const level = h[1].length;
      if (level - prevLevel > 1) {
        warn(file, ln, `heading jumps H${prevLevel} → H${level}`);
      }
      prevLevel = level;
    }

    // 3. Images without alt text (MD image syntax).
    const img = line.match(/!\[([^\]]*)\]\(([^)]+)\)/g) ?? [];
    for (const m of img) {
      const alt = m.match(/!\[([^\]]*)\]/)?.[1] ?? '';
      if (!alt.trim()) error(file, ln, `image without alt text: ${m.slice(0, 60)}`);
    }

    // 4. Article images must go through the processed ArticleImage component.
    // This catches both the old public URL and copied public-relative paths.
    if (LEGACY_ARTICLE_IMAGE_RE.test(line)) {
      error(file, ln, 'article images must use ArticleImage with an asset from src/assets/articles/');
    }

    // 5 + 6 + 7. Internal MD links (non-image): trailing slash, locale
    // prefix, and link counting. (?<!!) excludes image syntax ![alt](/…) —
    // assets are locale-less by design (public/ is shared).
    const mdLinks = line.match(/(?<!!)\[[^\]]*\]\([^)]+\)/g) ?? [];
    for (const m of mdLinks) {
      const href = m.match(/\]\(([^)\s]+)/)?.[1] ?? '';
      if (!href.startsWith('/') || href === '/') continue;
      internalLinkCount++;
      // Strip #anchor / ?query before shape checks.
      const pathOnly = href.split('#')[0].split('?')[0];
      // 5. Page links end with "/" (assets exempt).
      if (!ASSET_RE.test(pathOnly) && !pathOnly.endsWith('/')) {
        error(
          file,
          ln,
          `internal page link must end with "/" (trailingSlash always): ${m.slice(0, 60)}`,
        );
      }
      // 6. Non-default-locale bodies carry their own locale prefix.
      if (fileLocale !== DEFAULT_LOCALE && !ASSET_RE.test(pathOnly)) {
        const ok = href.startsWith(`/${fileLocale}/`) || href === `/${fileLocale}`;
        if (!ok) {
          error(
            file,
            ln,
            `non-default-locale body links without the "${fileLocale}/" prefix (silently lands on the ${DEFAULT_LOCALE} page): ${m.slice(0, 60)}`,
          );
        }
      }
    }

    // External body links use the same public-source allowlist as frontmatter.
    const externalLinks = line.match(/(?<!!)\[[^\]]*\]\((https?:\/\/[^)\s]+)/gi) ?? [];
    for (const m of externalLinks) {
      const href = m.match(/\]\((https?:\/\/[^)\s]+)/i)?.[1];
      if (!href) continue;
      const result = isAllowedArticleSource(href, ARTICLE_SOURCE_POLICY);
      if (!result.allowed) error(file, ln, `unapproved external body link: ${href} (${result.reason})`);
    }
  });

  // The summary is rendered as the Quick Answer. A nearly identical first
  // paragraph makes the page feel repetitive and spends the most valuable
  // above-the-fold space saying the same thing twice. Warn rather than fail:
  // short factual pages may intentionally use the same opening sentence.
  const normalizeText = (value: string) =>
    value
      .replace(/<[^>]+>/g, ' ')
      .replace(/[\s`*_>#()[\]{}:;,.!?—–-]+/g, ' ')
      .trim()
      .toLowerCase();
  const firstParagraph = body
    .join('\n')
    .split(/\n\s*\n/)
    .map((block) => block.replace(/^\s*(?:#{2,6}\s+|import\s+).*$/gim, '').trim())
    .find((block) => {
      const normalized = normalizeText(block);
      return normalized.length >= 80 && !block.startsWith('<');
    });
  const normalizedSummary = normalizeText(summaryText);
  const normalizedFirstParagraph = firstParagraph ? normalizeText(firstParagraph) : '';
  if (
    normalizedSummary.length >= 80 &&
    normalizedFirstParagraph.length >= 80 &&
    (normalizedFirstParagraph === normalizedSummary ||
      normalizedFirstParagraph.startsWith(normalizedSummary) ||
      normalizedSummary.startsWith(normalizedFirstParagraph))
  ) {
    warn(file, bodyStart, 'first body paragraph repeats the Quick Answer summary — add new detail instead of restating it');
  }

  // 7. Fewer than 3 internal links → warning (zero internal links = orphan
  // page: no crawl paths, no PageRank flow — Aniimo shipped 54/56 like that).
  if (internalLinkCount < 3) {
    warn(file, bodyStart, `only ${internalLinkCount} internal link(s) in body — aim for ≥3`);
  }
}

console.log(
  errorCount === 0
    ? `\n✅ Content lint clean.`
    : `\n❌ ${errorCount} content error${errorCount === 1 ? '' : 's'}.`,
);
process.exit(errorCount === 0 ? 0 : 1);
