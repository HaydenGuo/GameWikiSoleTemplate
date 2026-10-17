/**
 * apply-rewrites.ts — pure rewrite helpers for scripts/apply-template.ts.
 *
 * Extracted (verbatim where possible) so vitest can test them without
 * importing the interactive CLI: rewriteSiteTs (site.ts object literal),
 * rewriteLocaleJson (locale JSON shapes), rewriteWranglerVars (wrangler.toml
 * [vars] reset), the demo asset inventories shared with the "Clear demo
 * content" step in .github/workflows/setup.yml, and the content-aware demo
 * locale check. No fs/path access — callers own all IO.
 */


export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}


export interface SkinInput {
  gameName: string;
  shortName: string;
  domain: string;
  tagline: string;
  description: string;
  legalNotice: string;
  themeHex: string;
  platform: string;
  developer: string;
  genre: string;
  navigationProfile?: NavigationProfile;
  releaseDate: string;
  officialUrl: string;
  locales: string[];
  categories: { key: string; icon: string }[];
  utilityNavigationItems?: UtilityNavigationItem[];
  clearContent: boolean;
  clearLanding: boolean;
  /** Homepage preset: 'codes' | 'guides' | 'keep' */
  homePreset: 'codes' | 'guides' | 'keep';
}

export interface UtilityNavigationItem {
  key: string;
  path: string;
  icon: string;
}

export type NavigationProfile =
  | 'rpg'
  | 'mmorpg'
  | 'moba'
  | 'fps'
  | 'battle-royale'
  | 'sandbox'
  | 'strategy'
  | 'simulation'
  | 'card';

export const NAVIGATION_PROFILE_ORDER: Record<NavigationProfile, string[]> = {
  rpg: ['guides', 'builds', 'items', 'maps', 'bosses', 'tier-list', 'news', 'codes'],
  mmorpg: ['guides', 'builds', 'bosses', 'items', 'maps', 'tier-list', 'news', 'codes'],
  moba: ['guides', 'builds', 'tier-list', 'maps', 'items', 'news', 'codes', 'bosses'],
  fps: ['guides', 'builds', 'maps', 'items', 'tier-list', 'news', 'codes', 'bosses'],
  'battle-royale': ['guides', 'maps', 'items', 'builds', 'tier-list', 'news', 'codes', 'bosses'],
  sandbox: ['guides', 'items', 'maps', 'builds', 'news', 'codes', 'tier-list', 'bosses'],
  strategy: ['guides', 'builds', 'items', 'maps', 'tier-list', 'news', 'codes', 'bosses'],
  simulation: ['guides', 'items', 'builds', 'maps', 'news', 'codes', 'tier-list', 'bosses'],
  card: ['guides', 'builds', 'items', 'tier-list', 'maps', 'news', 'codes', 'bosses'],
};

export function inferNavigationProfile(genre: string): NavigationProfile {
  const value = genre.toLowerCase();
  if (/mmo|massively|online role/.test(value)) return 'mmorpg';
  if (/moba|multiplayer online battle/.test(value)) return 'moba';
  if (/battle royale|battle-royale/.test(value)) return 'battle-royale';
  if (/fps|first.person shooter|tactical shooter|hero shooter/.test(value)) return 'fps';
  if (/sandbox|survival|crafting|creative/.test(value)) return 'sandbox';
  if (/strategy|4x|rts|turn-based strategy/.test(value)) return 'strategy';
  if (/simulation|simulator|city.builder|management/.test(value)) return 'simulation';
  if (/card|deckbuilder|auto.battler/.test(value)) return 'card';
  return 'rpg';
}

export function orderCategories<T extends { key: string }>(categories: T[], profile?: NavigationProfile): T[] {
  const order = NAVIGATION_PROFILE_ORDER[profile ?? 'rpg'];
  const rank = new Map(order.map((key, index) => [key, index]));
  return [...categories].sort((a, b) => (rank.get(a.key) ?? 999) - (rank.get(b.key) ?? 999));
}

/** Read flat utility links from the current navigation config so template reruns preserve them. */
export function readUtilityNavigationItems(source: string): UtilityNavigationItem[] | null {
  const block = source.match(/export const NAVIGATION_CONFIG: NavigationItem\[\] = \[([\s\S]*?)\n\];/);
  if (!block) return null;
  const objects = [...block[1].matchAll(/\{([^{}]*)\}/g)].map((match) => match[1]);
  const utilityObjects = objects.filter((object) => /\bisContentType\s*:\s*false\b/.test(object));
  const declaredUtilityCount = (block[1].match(/\bisContentType\s*:\s*false\b/g) ?? []).length;
  if (utilityObjects.length !== declaredUtilityCount) return null;
  const items: UtilityNavigationItem[] = [];
  for (const object of utilityObjects) {
    const key = object.match(/\bkey\s*:\s*['"]([^'"]+)['"]/);
    const path = object.match(/\bpath\s*:\s*['"]([^'"]+)['"]/);
    const icon = object.match(/\bicon\s*:\s*['"]([^'"]+)['"]/);
    if (!key || !path || !icon) return null;
    items.push({ key: key[1], path: path[1], icon: icon[1] });
  }
  return items;
}

/** Content categories are regenerated from Stage 3; existing utility links survive. */
export type PrimaryNavigationEntry = {
  key: string;
  path: string;
  icon: string;
  isContentType: boolean;
  order: number;
};

/** Content categories are regenerated from Stage 3; existing utility links survive. */
export function mergeNavigationItems(
  categories: Array<{ key: string; icon: string }>,
  utilityItems: UtilityNavigationItem[] = [],
  profile?: NavigationProfile,
): PrimaryNavigationEntry[] {
  const ordered = orderCategories(categories, profile).map((item, index) => ({
    key: item.key,
    path: `/${item.key}`,
    icon: item.icon,
    isContentType: true,
    order: index + 1,
  }));
  const contentKeys = new Set(ordered.map((item) => item.key));
  const utilities = utilityItems.filter((item) => !contentKeys.has(item.key));
  return [
    ...ordered,
    ...utilities.map((item, index) => ({
      ...item,
      isContentType: false,
      order: ordered.length + index + 1,
    })),
  ];
}



/**
 * Build a starter `home` namespace skeleton for a preset.
 * All copy uses the game name the user entered — placeholders to refine,
 * not demo-game leftovers. Module hrefs point at the categories they chose.
 */
function defaultSteamStats() {
  return {
    rank: 'Steam rank', peak: '24H peak players', players: 'Playing now',
    steamPrice: 'Steam price', deal: 'Best discount', viewDeal: 'View deal',
    loading: 'Loading…', configure: 'Set up Steam ID', configureHint: 'Add this game\'s Steam App ID in site configuration to show live stats and deals.',
    unavailable: 'Unavailable', unavailableHint: 'Live Steam data is temporarily unavailable. Please check back shortly.',
    noDeal: 'No offer available', off: 'off',
  };
}

export function buildHomePreset(input: SkinInput): Record<string, unknown> | null {
  if (input.homePreset === 'keep') return null;
  const cats = input.categories.map((c) => c.key);
  const selectedCats = cats.length > 0 ? cats : ['guides'];
  const cap = (c: string) => c[0].toUpperCase() + c.slice(1);
  const quickStartImages: Record<string, string> = {
    guides: '/images/home/guide-card.svg',
    builds: '/images/home/items-card.svg',
    items: '/images/home/items-card.svg',
    maps: '/images/home/reference-card.svg',
    bosses: '/images/home/boss-card.svg',
    'tier-list': '/images/home/reference-card.svg',
    news: '/images/home/reference-card.svg',
    codes: '/images/home/guide-card.svg',
    deals: '/images/home/reference-card.svg',
  };
  const quickStartDescriptions: Record<string, string> = {
    guides: 'Browse walkthroughs and practical player guides.',
    builds: 'Compare builds and plan your next upgrade.',
    items: 'Find item details and useful equipment.',
    maps: 'Explore locations, routes, and discoveries.',
    bosses: 'Prepare for encounters and learn boss strategies.',
    'tier-list': 'Compare rankings and current recommendations.',
    news: 'Read the latest updates and announcements.',
    codes: 'Check available rewards and redemption details.',
    deals: 'Browse current deals and offers.',
  };
  const quickStartCards = mergeNavigationItems(
    input.categories,
    input.utilityNavigationItems,
    input.navigationProfile,
  ).slice(0, 4).map(({ key }) => ({
    key,
    description: quickStartDescriptions[key] ?? `Browse ${cap(key)} and related player resources.`,
    image: quickStartImages[key] ?? '/images/home/reference-card.svg',
  }));
  const categoryRoute = (index: number) => selectedCats[index % selectedCats.length];
  const decisionGuide = {
    eyebrow: 'Choose your route',
    title: 'Where would you like to look?',
    description: 'Browse the categories selected for this game site and open the topic that matches your question.',
    routeLabel: 'routes',
    groups: ['Start here', 'Browse topics', 'Explore more'].map((label, groupIndex) => ({
      label,
      directions: Array.from({ length: 3 }, (_, directionIndex) => {
        const category = categoryRoute(groupIndex * 3 + directionIndex);
        return {
          title: `Browse ${cap(category)}`,
          question: `Open ${cap(category)} pages to find the topic you need.`,
          href: `/${category}`,
        };
      }),
    })),
  };

  // Field shapes MUST match what the home components render (HomePage reads
  // meta.title/meta.description, CTA fields are plain strings rendered as link
  // text, start.cards carry number/icon/href). A shape drift here crashes the
  // fork's first build — the demo JSON in src/locales/en.json is the contract.
  const common = {
    meta: {
      title:
        input.homePreset === 'codes'
          ? `${input.gameName} Wiki — Codes, Guides & Tier Lists`
          : `${input.gameName} Wiki — Guides, Bosses & Progression`,
      description: input.description,
    },
    updates: { title: 'Recent updates' },
    decisionGuide,
    popular: {
      badge: 'Popular',
      title: 'Most read',
      quickLinks: cats.slice(0, 3).map((c) => ({ label: cap(c), href: `/${c}` })),
    },
    closingCta: {
      title: `Start your ${input.gameName} journey`,
      description: `Bookmark this wiki and check back after every game update.`,
      primary: 'Browse all',
      secondary: 'Join the community',
    },
  };

  if (input.homePreset === 'codes') {
    return {
      ...common,
      hero: {
        badge: 'Fan-made wiki',
        title: `${input.gameName} Codes`,
        description: `All working ${input.gameName} codes with expiry dates, plus guides and tier lists.`,
        steamStats: defaultSteamStats(),
        ctaPrimary: 'Play now',
        ctaSecondary: 'Browse guides',
      },
      start: {
        badge: 'Quick start',
        title: 'Jump straight in',
        cards: quickStartCards,
      },
      explore: {
        title: 'Explore',
        description: 'The essentials',
        modules: [
          {
            order: 1,
            name: 'Active codes',
            description: 'Redeem before they expire',
            href: '/codes',
            image: '/images/home/guide-card.svg',
            displayType: 'badge-list',
            highlights: [
              { label: 'CODE-PLACEHOLDER', detail: 'Tap to copy on the codes page', badge: 'NEW' },
            ],
          },
        ],
      },
      faq: { title: 'FAQ', description: 'Common questions', items: [] },
    };
  }

  // 'guides' preset
  return {
    ...common,
    hero: {
      badge: input.gameName,
      title: `${input.gameName} Wiki`,
      description: `Complete ${input.gameName} guides — bosses, items, and progression.`,
      steamStats: defaultSteamStats(),
      ctaPrimary: 'Start reading',
      ctaSecondary: 'Browse all',
    },
      start: {
      badge: 'Quick start',
      title: 'New here?',
      cards: quickStartCards,
    },
    explore: {
      title: 'Explore',
      description: 'Content modules',
      modules: [
        {
          order: 1,
          name: 'Getting started',
          description: 'Step-by-step progression',
          href: '/guides',
          image: '/images/home/guide-card.svg',
          displayType: 'steps',
          highlights: [
            { label: 'Step 1', detail: 'Finish the tutorial', badge: '5 min' },
            { label: 'Step 2', detail: 'Claim starter codes', badge: '1 min' },
            { label: 'Step 3', detail: 'First boss run', badge: '15 min' },
          ],
        },
      ],
    },
    faq: { title: 'FAQ', description: 'Common questions', items: [] },
  };
}


/**
 * Rewrite the `export const site: SiteConfig = { ... };` block in site.ts.
 * Returns null when the block cannot be found — the caller aborts loudly
 * without touching the file.
 *
 * Every user-supplied string is escaped for a single-quoted TS literal
 * (backslash FIRST, then quotes — otherwise a trailing backslash escapes the
 * closing quote and the file stops parsing) and inserted via a FUNCTION
 * replacer: string-mode replace expands `$&`/`$'`/`$$` sequences from user
 * input into the replacement, and an unescaped apostrophe in a game name
 * like "Assassin's …" previously produced a site.ts that did not parse.
 */
export function rewriteSiteTs(src: string, input: SkinInput): string | null {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const newSite = `export const site: SiteConfig = {
  name: '${esc(input.gameName)} Wiki',
  shortName: '${esc(input.shortName)}',
  description: '${esc(input.description)}',
  domain: '${esc(input.domain)}',
  enableDropdownNavigation: false,
  tagline: '${esc(input.tagline)}',
  legalNotice: '${esc(input.legalNotice)}',
  // Set a real address if you run no social channels — the contact page
  // renders it as a mailto link.
  contactEmail: '',
  social: {
    official: '${esc(input.officialUrl)}',
  },
  trustedStorePages: [],
  trustedMaterialPages: [],
  game: {
    name: '${esc(input.gameName)}',
    platform: '${esc(input.platform)}',
    developer: '${esc(input.developer)}',
    genre: '${esc(input.genre)}',
    navigationProfile: '${input.navigationProfile ?? inferNavigationProfile(input.genre)}',
    releaseDate: '${esc(input.releaseDate)}',
  },
  // og:image dims of the SHIPPED hero.webp — if you replace public/images/hero.webp,
  // update these in src/config/site.ts to match (wrong dims mis-crop share cards).
  ogImageWidth: 1200,
  ogImageHeight: 630,
};`;
  const siteRe = /export const site: SiteConfig = \{[\s\S]*?\n\};/;
  if (!siteRe.test(src)) return null;
  return src.replace(siteRe, () => newSite);
}


export function rewriteLocaleJson(input: SkinInput, _locale: string, existing?: string): string {
  // Start from existing (if any) or a minimal skeleton; reset site/footer/nav/overview.
  let obj: Record<string, unknown> = {};
  if (existing) {
    try {
      obj = JSON.parse(existing);
    } catch {
      obj = {};
    }
  }
  // Always (re)write the site-level strings for this locale.
  obj.site = {
    name: `${input.gameName} Wiki`,
    shortName: input.shortName,
    description: input.description,
    tagline: input.tagline,
    legalNotice: input.legalNotice,
  };
  obj.footer = obj.footer ?? {};
  (obj.footer as Record<string, unknown>).copyrightText = `© ${new Date().getFullYear()} ${input.gameName} Wiki. All rights reserved.`;
  // nav + overview are auto-filled for the chosen categories. Deliberately
  // NOT left empty: an empty nav means the fork's first `pnpm check-config`
  // run is red (3-place rule) and SiteHeader renders raw lowercase keys —
  // both on day one, before the user has written a single label. The English
  // defaults below are placeholders users translate/edit per locale.
  const cap = (key: string) =>
    key
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  const navFixed: Record<string, string> = {
    home: 'Home',
    toggleTheme: 'Toggle theme',
    menu: 'Menu',
    close: 'Close',
    search: 'Search',
    language: 'Language',
  };
  const navCategories: Record<string, string> = {};
  const overview: Record<string, { overviewTitle: string; overviewDescription: string }> = {};
  const NAV_LABELS: Record<string, string> = {
    guides: 'Guides',
    builds: 'Builds',
    items: 'Items',
    maps: 'Maps',
    bosses: 'Bosses',
    'tier-list': 'Tier List',
    news: 'Recent News',
    codes: 'Codes',
  };
  for (const { key } of input.categories) {
    const label = NAV_LABELS[key] ?? cap(key);
    navCategories[key] = label;
    overview[key] = {
      overviewTitle: `All ${label}`,
      overviewDescription: `${label} content for ${input.gameName}. Replace this overview text in the locale JSON — it feeds the category page title and description.`,
    };
  }
  for (const { key } of input.utilityNavigationItems ?? []) {
    navCategories[key] = NAV_LABELS[key] ?? cap(key);
  }
  // Keep a previous run's labels, but ONLY for keys this run still owns — a
  // demo category the forker did not choose must not leak back into nav as a
  // stale key nothing renders and no gate checks. Overlay order is
  // fixed keys < generated placeholders < previous labels, so labels a user
  // translated on an earlier run survive re-runs instead of being reset.
  const ownable = new Set([...Object.keys(navFixed), ...Object.keys(navCategories)]);
  const prevNav = Object.fromEntries(
    Object.entries((obj.nav ?? {}) as Record<string, unknown>).filter(
      ([k, v]) => ownable.has(k) && typeof v === 'string' && v.trim() !== '',
    ),
  );
  obj.nav = { ...navFixed, ...navCategories, ...prevNav };
  const previousOverview = (obj.overview ?? {}) as Record<string, unknown>;
  const utilityOverview = Object.fromEntries(
    (input.utilityNavigationItems ?? [])
      .filter(({ key }) => Object.hasOwn(previousOverview, key))
      .map(({ key }) => [key, previousOverview[key]]),
  );
  obj.overview = { ...utilityOverview, ...overview };
  // Homepage preset skeleton (unless 'keep').
  const home = buildHomePreset(input);
  if (home) obj.home = home;
  return JSON.stringify(obj, null, 2) + '\n';
}


/**
 * Reset wrangler.toml [vars] for the forker's own site.
 *
 * Why: when wrangler.toml exists it is the SOLE source of truth for the
 * Cloudflare Pages project env (dashboard UI is ignored). The shipped file
 * carries the DEMO site's Giscus config — an unedited fork would silently
 * point its comment section at the original repo's GitHub Discussions.
 * We rewrite SITE_URL to the forker's domain and blank the Giscus values.
 */
export function rewriteWranglerVars(input: SkinInput, src: string): string | null {
  const filePath = 'wrangler.toml';
  // TOML basic strings: escape backslash first, then the double quote.
  const tomlStr = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const newVars = `[vars]
# Site (must include https:// protocol — Astro validates this as a URL)
SITE_URL = "https://${tomlStr(input.domain)}"
# Giscus comments — blank = comments disabled until you fill your own values.
# See docs/comments.md for how to get these from giscus.app.
PUBLIC_GISCUS_REPO = ""
PUBLIC_GISCUS_REPO_ID = ""
PUBLIC_GISCUS_CATEGORY = ""
PUBLIC_GISCUS_CATEGORY_ID = ""
PUBLIC_GISCUS_MAPPING = "pathname"
# Sponsor card — blank = disabled. Fill PUBLIC_SPONSOR_URL to enable.
PUBLIC_SPONSOR_URL = ""
PUBLIC_SPONSOR_IMAGE_URL = ""
# Cloudflare Web Analytics — blank = disabled.
PUBLIC_CF_BEACON_TOKEN = ""
# Optional slots (empty = disabled) — fill HERE, not the dashboard:
#PUBLIC_ADSENSE_CLIENT = ""
#PUBLIC_ADSENSE_SLOT_STICKY = ""
#PUBLIC_ADSENSE_SLOT_SIDEBAR = ""
#PUBLIC_ADSENSE_SLOT_INCONTENT = ""
#PUBLIC_GA_ID = ""
#PUBLIC_GSC_VERIFICATION = ""`;
  // Anchor [vars] at LINE START (the demo file's intro comment contains the
  // literal text "[vars]" mid-line — an unanchored match rewrote the comment
  // and left the real demo Giscus section below). Two JS regex traps here:
  // no `m` flag (with it, `$` means line-end, not file-end) and no `\Z`
  // (JS treats that as the literal character "Z" — the match silently fails
  // and the file ships unrewritten).
  // Tolerate CRLF working trees: .gitattributes forces LF at checkout, but a
  // fork user's editor may still convert the file before they run the CLI —
  // a bare `\n` after `[vars]` would silently fail on `\r\n` and leave the
  // demo Giscus values in place.
  const varsRe = /(^|\n)\[vars\]\r?\n[\s\S]*?(?=\r?\n\[|$)/;
  if (!varsRe.test(src)) {
    console.warn(`⚠️ Could not find [vars] section in ${filePath} — edit it manually.`);
    return null;
  }
  // Remove the demo-intro warning block: after the [vars] rewrite it would
  // claim "this file contains the DEMO SITE config" about values that are
  // now the forker's own — a stale, misleading comment. Anchors are ASCII:
  // the ⚠️ emoji is a multi-codepoint sequence that silently fails `⚠️+`.
  // The inserted block adopts the file's own EOL so the section is not left
  // with mixed line endings.
  const eol = /(^|\n)\[vars\]\r\n/.test(src) ? '\r\n' : '\n';
  const newVarsBlock = eol === '\r\n' ? newVars.replace(/\n/g, '\r\n') : newVars;
  const out = src.replace(varsRe, (_match, pre) => `${pre}${newVarsBlock}${eol}`);
  const demoIntroRe = /# .*FORKERS READ THIS FIRST[\s\S]*?# .*END FORKER WARNING.*\n?/;
  return demoIntroRe.test(out) ? out.replace(demoIntroRe, '') : out;
}


/**
 * Demo artwork inventory — all article art lives in src/assets/articles.
 * Delete by name only, never by wildcard or whole directory, so a re-run
 * cannot destroy a fork author's own media.
 */
export const DEMO_COVERS: string[] = [];

export const DEMO_ARTICLE_IMAGES = [
  'weapon-frostpike.png',
  'weapon-voidforge.png',
  'beginner-guide-cover.png',
  'emberfang-cover.png',
  'stormcaller-cover.png',
  'weapon-tier-list-cover.png',
  'codes-cover.png',
  // v2.6.0 demo content batch — same by-name rule: never delete a cover a
  // fork user created. Keep in sync with setup.yml's rm -f list.
  'en-bosses-frostbound-monarch.png',
  'en-guides-forging-guide.png',
  'en-items-emberforged-armor-set.png',
  'en-items-forging-materials-guide.png',
];

/** Locale JSONs the demo itself ships — auto-deletable ONLY while still demo content. */
export const DEMO_LOCALES = ['en', 'ja'];

/**
 * site.name values the demo's own locale JSONs ship (en and ja both use the
 * same English site name). Content, not filename, decides deletion: a
 * demo-named file the forker already rewrote for their own game (a previous
 * run chose that locale) holds their translation work and must fall into the
 * warn-and-keep path. Anything unclassifiable (corrupt JSON, missing
 * site.name) is kept too — never delete what cannot be read.
 */
export const DEMO_SITE_NAMES = ['Anvil Quest Wiki'];

export function isDemoLocaleContent(raw: string): boolean {
  try {
    const parsed = JSON.parse(raw) as { site?: { name?: unknown } };
    return parsed?.site?.name !== undefined && DEMO_SITE_NAMES.includes(parsed.site.name as string);
  } catch {
    return false;
  }
}
