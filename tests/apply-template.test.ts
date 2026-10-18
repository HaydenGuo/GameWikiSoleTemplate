/**
 * apply-template rewrite tests — the pure layer extracted to
 * scripts/lib/apply-rewrites.ts (the interactive CLI itself stays covered by
 * pnpm test:e2e, which drives it for real).
 *
 * Covers the fork-safety bug classes the 2026-09-01 audit turned up:
 *   - Vercel environment example keeps the chosen domain and optional services disabled
 *   - locale rewrites must not leak unchosen demo categories into nav, and
 *     must not reset labels a user already translated on a re-run (P3/P1)
 *   - the demo asset inventories must stay in sync with setup.yml's
 *     "Clear demo content" rm list (they have drifted before: the v2.6.0
 *     covers initially landed in neither list).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import {
  DEMO_ARTICLE_IMAGES,
  DEMO_COVERS,
  buildHomePreset,
  inferNavigationProfile,
  mergeNavigationItems,
  readUtilityNavigationItems,
  orderCategories,
  isDemoLocaleContent,
  rewriteLocaleJson,
  rewriteSiteTs,
  rewriteEnvExample,
  type SkinInput,
} from '../scripts/lib/apply-rewrites';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const HOME_PAGE_SOURCE = readFileSync(join(repoRoot, 'src/components/home/HomePage.astro'), 'utf8');
const LIST_PAGE_SOURCE = readFileSync(join(repoRoot, 'src/components/article/ListPage.astro'), 'utf8');
const ARTICLE_PAGE_SOURCE = readFileSync(join(repoRoot, 'src/components/article/ArticlePage.astro'), 'utf8');
const SITE_HEADER_SOURCE = readFileSync(join(repoRoot, 'src/components/header/SiteHeader.astro'), 'utf8');
const BASE_LAYOUT_SOURCE = readFileSync(join(repoRoot, 'src/components/layout/BaseLayout.astro'), 'utf8');
const GLOBALS_SOURCE = readFileSync(join(repoRoot, 'src/styles/globals.css'), 'utf8');

function makeInput(overrides: Partial<SkinInput> = {}): SkinInput {
  return {
    gameName: 'Test Game',
    shortName: 'TG',
    domain: 'testgame.vercel.app',
    tagline: 'Forge your knowledge',
    description: 'Complete Test Game wiki with guides, codes, and tier lists. Every page carries a verified date.',
    legalNotice: 'Fan-made, not affiliated with the developer.',
    themeHex: '#3b82f6',
    platform: 'Roblox',
    developer: 'Test Studios',
    genre: 'RPG',
    releaseDate: '',
    officialUrl: 'https://example.com/game',
    locales: ['en'],
    categories: [
      { key: 'bosses', icon: 'lucide:swords' },
      { key: 'guides', icon: 'lucide:book-open' },
      { key: 'codes', icon: 'lucide:gift' },
    ],
    clearContent: true,
    clearLanding: true,
    homePreset: 'codes',
    ...overrides,
  };
}

describe('single-game navigation profiles', () => {
  test.each([
    ['Fantasy RPG', 'rpg'],
    ['MMORPG', 'mmorpg'],
    ['MOBA', 'moba'],
    ['Tactical FPS', 'fps'],
    ['Battle Royale', 'battle-royale'],
    ['Survival Sandbox', 'sandbox'],
    ['4X Strategy', 'strategy'],
    ['City Builder Simulation', 'simulation'],
    ['Deckbuilder Card Game', 'card'],
  ])('infers %s as %s', (genre, expected) => {
    expect(inferNavigationProfile(genre)).toBe(expected);
  });

  test('preserves configured non-content utility links while replacing Stage 3 categories', () => {
    const source = `export const NAVIGATION_CONFIG: NavigationItem[] = [\n  { key: 'guides', path: '/guides', icon: 'book', isContentType: true, order: 1 },\n  { key: 'deals', path: '/deals', icon: 'tag', isContentType: false, order: 9 },\n];`;
    const utilities = readUtilityNavigationItems(source);
    expect(utilities).toEqual([{ key: 'deals', path: '/deals', icon: 'tag' }]);
    expect(mergeNavigationItems([{ key: 'guides', icon: 'book' }], utilities!)).toEqual([
      { key: 'guides', icon: 'book', path: '/guides', isContentType: true, order: 1 },
      { key: 'deals', path: '/deals', icon: 'tag', isContentType: false, order: 2 },
    ]);
  });

  test('fails closed if an existing utility navigation item cannot be parsed', () => {
    expect(readUtilityNavigationItems(`export const NAVIGATION_CONFIG: NavigationItem[] = [\n  { key: 'deals', isContentType: false },\n];`)).toBeNull();
  });

  test('orders only the selected categories and preserves unknown keys at the end', () => {
    const categories = [
      { key: 'codes', icon: 'gift' },
      { key: 'maps', icon: 'map' },
      { key: 'guides', icon: 'book' },
      { key: 'custom', icon: 'sparkles' },
    ];

    expect(orderCategories(categories, 'fps').map(({ key }) => key)).toEqual([
      'guides',
      'maps',
      'codes',
      'custom',
    ]);
    expect(categories.map(({ key }) => key)).toEqual(['codes', 'maps', 'guides', 'custom']);
  });
});

describe('rewriteEnvExample', () => {
  test('sets the selected site URL and keeps optional integrations disabled', () => {
    const example = rewriteEnvExample(makeInput());
    expect(example).toContain('SITE_URL=https://testgame.vercel.app');
    expect(example).toContain('PUBLIC_POPULAR_ENABLED=false');
    expect(example).toContain('DATABASE_URL=');
    expect(example).toContain('PUBLIC_GISCUS_REPO=');
  });
});
describe('rewriteLocaleJson (P3: no unchosen-category leak, re-run labels kept)', () => {
  test('retains labels and overview data for configured utility navigation', () => {
    const input = makeInput({ utilityNavigationItems: [{ key: 'deals', path: '/deals', icon: 'tag' }] });
    const existing = JSON.stringify({ nav: { home: 'Home', deals: 'Deals' }, overview: { deals: { overviewTitle: 'Game deals' } } });
    const result = JSON.parse(rewriteLocaleJson(input, 'en', existing));
    expect(result.nav.deals).toBe('Deals');
    expect(result.overview.deals).toEqual({ overviewTitle: 'Game deals' });
  });

  const demoLike = JSON.stringify({
    nav: {
      home: 'Home',
      bosses: 'Bosses',
      guides: 'Guides',
      items: 'Items',
      codes: 'Codes',
      search: 'Search',
    },
    overview: {
      bosses: { overviewTitle: 'Anvil Quest Bosses', overviewDescription: 'demo boss text' },
      items: { overviewTitle: 'Items', overviewDescription: 'demo item text' },
    },
  });

  test('a demo category the forker did not choose is dropped from nav (was leaked before)', () => {
    const out = JSON.parse(rewriteLocaleJson(makeInput(), 'en', demoLike));
    expect(out.nav.items).toBeUndefined();
    expect(out.nav.bosses).toBe('Bosses');
    expect(out.nav.guides).toBe('Guides');
    expect(out.nav.codes).toBe('Codes');
    // Fixed UI keys survive from the previous file too.
    expect(out.nav.home).toBe('Home');
    expect(out.nav.search).toBe('Search');
  });

  test('labels a user translated on a previous run survive the re-run', () => {
    const translated = JSON.stringify({
      nav: { home: 'ホーム', bosses: 'ボス', items: 'アイテム' },
    });
    const out = JSON.parse(
      rewriteLocaleJson(makeInput({ categories: [{ key: 'bosses', icon: 'x' }] }), 'ja', translated),
    );
    expect(out.nav.bosses).toBe('ボス'); // kept, not reset to the placeholder
    expect(out.nav.home).toBe('ホーム');
    expect(out.nav.items).toBeUndefined(); // unchosen → gone
  });

  test('empty-string previous labels fall back to the defaults', () => {
    const broken = JSON.stringify({ nav: { bosses: '' } });
    const out = JSON.parse(rewriteLocaleJson(makeInput(), 'en', broken));
    expect(out.nav.bosses).toBe('Bosses');
  });

  test('overview is regenerated for chosen keys only — demo overview text never leaks', () => {
    const out = JSON.parse(rewriteLocaleJson(makeInput(), 'en', demoLike));
    expect(Object.keys(out.overview).sort()).toEqual(['bosses', 'codes', 'guides']);
    expect(out.overview.items).toBeUndefined();
    expect(out.overview.bosses.overviewTitle).toBe('All Bosses');
    expect(out.overview.bosses.overviewDescription).toContain('Test Game');
    expect(out.overview.bosses.overviewDescription).not.toContain('Anvil Quest');
  });

  test('fresh locale file (no existing): nav = fixed keys + chosen categories', () => {
    const out = JSON.parse(rewriteLocaleJson(makeInput(), 'zh'));
    expect(out.nav.home).toBe('Home');
    expect(out.nav.bosses).toBe('Bosses');
    expect(out.nav.toggleTheme).toBe('Toggle theme');
    expect(out.site.name).toBe('Test Game Wiki');
  });
});

describe('demo asset inventories stay in sync with setup.yml (drift has shipped before)', () => {
  test('every demo file is listed in the "Clear demo content" rm list — and nothing else', () => {
    const yml = readFileSync(join(repoRoot, '.github/workflows/setup.yml'), 'utf8');
    const listed = new Set(yml.match(/[\w-]+\.png/g) || []);
    const demo = new Set([...DEMO_COVERS, ...DEMO_ARTICLE_IMAGES]);
    for (const name of demo) {
      expect(listed.has(name), `${name} missing from setup.yml rm list`).toBe(true);
    }
    expect([...listed].sort()).toEqual([...demo].sort());
    // The wholesale rm -rf of demo image dirs must never come back — the
    // directories hold fork users' own images (docs/content-format.md sends
    // them to src/assets/articles/).
    expect(yml).not.toMatch(/rm -rf src\/assets\/articles/);
  });

  test('the two media inventories do not overlap', () => {
    const all = [...DEMO_COVERS, ...DEMO_ARTICLE_IMAGES];
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('homepage visual baseline survives apply-template presets', () => {
  test('Quick Start uses at most four Stage 3 primary content categories and excludes utility routes', () => {
    const input = makeInput({
      categories: [
        { key: 'bosses', icon: 'swords' },
        { key: 'guides', icon: 'book-open' },
        { key: 'codes', icon: 'gift' },
        { key: 'items', icon: 'package' },
        { key: 'maps', icon: 'map' },
      ],
      utilityNavigationItems: [{ key: 'deals', path: '/deals', icon: 'tag' }],
    });
    const home = buildHomePreset(input) as any;
    expect(home.start.cards.map((card: any) => card.key)).toEqual(['guides', 'items', 'maps', 'bosses']);
    expect(home.start.cards).toHaveLength(4);
    expect(HOME_PAGE_SOURCE.match(/\.filter\(\(item\) => item\.isContentType && item\.showInPrimaryNavigation !== false\)/g)).toHaveLength(2);
    expect(HOME_PAGE_SOURCE).toMatch(/\.slice\(0, 4\)/);
  });

  test('generated home presets retain image-led card composition', () => {
    for (const preset of ['codes', 'guides'] as const) {
      const home = buildHomePreset(makeInput({ homePreset: preset })) as any;
      expect(home.hero.steamStats).toEqual(expect.objectContaining({
        rank: expect.any(String), peak: expect.any(String), players: expect.any(String),
        steamPrice: expect.any(String), deal: expect.any(String), viewDeal: expect.any(String),
        configure: expect.any(String), unavailable: expect.any(String),
      }));
      expect(home.start.cards.length).toBeGreaterThanOrEqual(3);
      expect(home.start.cards.every((card: any) => typeof card.key === 'string' && typeof card.image === 'string')).toBe(true);
      expect(home.explore.modules.every((module: any) => typeof module.image === 'string')).toBe(true);
      expect(home.start.cards.every((card: any) => card.image.startsWith('/images/home/'))).toBe(true);
    }
  });

  test('every generated preset has a generic decision guide using only selected categories', () => {
    for (const preset of ['codes', 'guides'] as const) {
      const home = buildHomePreset(makeInput({ homePreset: preset })) as any;
      expect(home.decisionGuide.groups).toHaveLength(3);
      for (const group of home.decisionGuide.groups) {
        expect(group.directions).toHaveLength(3);
        for (const direction of group.directions) {
          expect(['/bosses', '/guides', '/codes']).toContain(direction.href);
          expect(direction.title + direction.question).not.toMatch(/Emberfang|Emberforged|Frostbound|Anvil Quest/i);
        }
      }
    }
  });
});

describe('rewriteSiteTs (quote/backslash-safe, $-expansion-proof site.ts rewriting)', () => {
  const SITE_TS = [
    "import type { SiteConfig } from '~/lib/site';",
    '',
    'export const site: SiteConfig = {',
    "  name: 'Anvil Quest Wiki',",
    "  shortName: 'AQ Wiki',",
    "  description: 'demo description',",
    "  domain: 'your-game-wiki.example',",
    "  tagline: 'demo tagline',",
    "  legalNotice: 'demo notice',",
    "  contactEmail: '',",
    '  social: {',
    "    official: 'https://example.com',",
    '  },',
    '  game: {',
    "    name: 'Anvil Quest',",
    "    platform: 'PC',",
    "    developer: 'Forge Studios',",
    "    genre: 'RPG',",
    "    releaseDate: '2026-01-01',",
    '  },',
    '  ogImageWidth: 1200,',
    '  ogImageHeight: 630,',
    '};',
    '',
    'export const other = 1;',
  ].join('\n');

  test("an apostrophe in the game name cannot break the string literal", () => {
    const out = rewriteSiteTs(SITE_TS, makeInput({ gameName: "Assassin's Creed Shadows" }));
    expect(out).toContain("name: 'Assassin\\'s Creed Shadows Wiki'");
  });

  test('initialized sites explicitly start with empty trusted-source allowlists', () => {
    const out = rewriteSiteTs(SITE_TS, makeInput());
    expect(out).toContain('trustedStorePages: [],');
    expect(out).toContain('trustedMaterialPages: [],');
  });

  test('every free-text field is escaped, not just the historical three', () => {
    const out = rewriteSiteTs(
      SITE_TS,
      makeInput({
        shortName: "O'B",
        domain: "x'y.dev",
        platform: "Robl'o",
        developer: "Dev's",
        genre: "RPG'X",
        releaseDate: "2026'",
        officialUrl: "https://ex.com/'q",
      }),
    );
    expect(out).toContain("shortName: 'O\\'B'");
    expect(out).toContain("domain: 'x\\'y.dev'");
    expect(out).toContain("official: 'https://ex.com/\\'q'");
    expect(out).toContain("platform: 'Robl\\'o'");
    expect(out).toContain("developer: 'Dev\\'s'");
    expect(out).toContain("genre: 'RPG\\'X'");
    expect(out).toContain("releaseDate: '2026\\''");
  });

  test("$& / $' from user input reach the file literally (function replacer)", () => {
    const out = rewriteSiteTs(SITE_TS, makeInput({ gameName: 'A$&B', tagline: "t$'x" }));
    expect(out).toContain("'A$&B Wiki'");
    expect(out).toContain("'t$\\'x'");
  });

  test('a trailing backslash cannot eat the closing quote (backslash doubled first)', () => {
    const out = rewriteSiteTs(SITE_TS, makeInput({ legalNotice: 'ends with backslash \\' }));
    expect(out).toContain("'ends with backslash \\\\'");
  });

  test('no site block → null (caller aborts, file untouched)', () => {
    expect(rewriteSiteTs('nothing here', makeInput())).toBeNull();
  });
});

describe('demo locale deletion is content-aware (rebranded locales must survive re-runs)', () => {
  test('the shipped demo locale files still carry the site.name marker (marker drift guard)', () => {
    const localeFiles = readdirSync(join(repoRoot, 'src/locales')).filter((file) => file.endsWith('.json'));
    const demoFiles = localeFiles.filter((file) =>
      isDemoLocaleContent(readFileSync(join(repoRoot, 'src/locales', file), 'utf8')),
    );
    for (const file of demoFiles) {
      const locale = file.slice(0, -'.json'.length);
      const raw = readFileSync(join(repoRoot, 'src/locales', `${locale}.json`), 'utf8');
      expect(isDemoLocaleContent(raw)).toBe(true);
    }
  });

  test('a rewritten demo-named locale is no longer demo content', () => {
    const demoEn = readFileSync(join(repoRoot, 'src/locales/en.json'), 'utf8');
    const rebranded = rewriteLocaleJson(makeInput(), 'ja', demoEn);
    expect(isDemoLocaleContent(rebranded)).toBe(false);
  });

  test('the marker is site.name, not any stray "Anvil Quest" mention', () => {
    expect(
      isDemoLocaleContent('{"note": "mentions Anvil Quest", "site": {"name": "My Game Wiki"}}'),
    ).toBe(false);
    expect(isDemoLocaleContent('{"site": {"name": "Anvil Quest Wiki"}}')).toBe(true);
  });

  test('corrupt JSON or missing site.name is never classified as demo (never delete unreadable)', () => {
    expect(isDemoLocaleContent('{ not json')).toBe(false);
    expect(isDemoLocaleContent('{"nav": {"home": "Home"}}')).toBe(false);
  });
});

describe('homepage article-card visual baseline', () => {
  test('Most read renders image cards and keeps API label updates scoped', () => {
    expect(HOME_PAGE_SOURCE).toContain("trendingLinks.slice(0, 2).map");
    expect(HOME_PAGE_SOURCE).toContain('data-popular-label');
    expect(HOME_PAGE_SOURCE).toMatch(/\/images\/home\/[^'\"]+\.(?:svg|png|jpe?g|webp)/);
    expect(HOME_PAGE_SOURCE).toContain("label.lastChild.textContent = metadata.title");
  });

  test('category lists render a generic fallback cover without game-specific paths', () => {
    expect(LIST_PAGE_SOURCE).toContain('fallbackImageByCategory');
    expect(LIST_PAGE_SOURCE).toContain('group-hover:scale-[1.02]');
    expect(LIST_PAGE_SOURCE).not.toMatch(/bombanana|BOMBANANA/);
  });

  test('article pages use the first body image as the only cover source', () => {
    expect(ARTICLE_PAGE_SOURCE).toContain('const bodyFirstImage = extractFirstBodyImage(entry.body ?? \'\');');
    expect(ARTICLE_PAGE_SOURCE).toContain('const coverSource = bodyFirstImage ? resolveArticleImage(bodyFirstImage) : undefined;');
    expect(ARTICLE_PAGE_SOURCE).toContain('Article must contain a first body image');
    expect(ARTICLE_PAGE_SOURCE).not.toContain('entry.data.image');
  });

  test('article details keep the quick answer and avoid repeating the metadata description', () => {
    expect(ARTICLE_PAGE_SOURCE).toContain('data-summary-text');
    expect(ARTICLE_PAGE_SOURCE).not.toContain(
      '<p class="mt-3 text-muted-foreground">{entry.data.description}</p>',
    );
  });

  test('header uses the generated mark and browser declares Google-supported raster icons', () => {
    expect(SITE_HEADER_SOURCE).toContain("const headerIcon = '/brand-mark-512.png';");
    expect(SITE_HEADER_SOURCE).toContain('data-game-icon');
    expect(SITE_HEADER_SOURCE).toContain('2xl:-left-12');
    expect(BASE_LAYOUT_SOURCE).toContain('href="/favicon-48x48.png" type="image/png" sizes="48x48"');
    expect(BASE_LAYOUT_SOURCE).toMatch(/href="\/favicon\.ico" sizes="(?:32x32|any)"/);
  });

  test('responsive and animation micro-styles remain part of the template baseline', () => {
    expect(GLOBALS_SOURCE).toContain('transform-origin: center;');
    expect(GLOBALS_SOURCE).toContain('max-width: 100%;');
  });
});
