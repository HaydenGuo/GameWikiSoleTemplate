/**
 * Site configuration — the single source of truth for game-specific metadata.
 *
 * 👉 APPLY TEMPLATE: Change every field here when building a new game wiki.
 * This is part of the CONFIG LAYER — framework code reads from here, never the reverse.
 */

export interface SiteConfig {
  /** Full site name, used in <title> suffix and Organization JSON-LD. e.g. "Anvil Quest Wiki" */
  name: string;
  /** Short name for PWA manifest, mobile logo, and the long-title <title> suffix (>50 chars). e.g. "AQ Wiki" */
  shortName: string;
  /** Legacy compatibility only; new sites should leave it unset. */
  headerIcon?: string;
  /** Site description for Organization JSON-LD and og:site_name. */
  description: string;
  /** Domain without protocol or trailing slash. e.g. "anvilquestwiki.wiki" */
  domain: string;
  /** Legacy fallback for categories without their own navigationMode setting. */
  enableDropdownNavigation: boolean;
  /** Hero tagline shown under the site title. */
  tagline: string;
  /** Copyright / legal disclaimer line shown in footer. */
  legalNotice: string;
  /**
   * Optional public contact email — rendered as a mailto link on the contact
   * page when set. AdSense reviewers look for a reachable contact channel;
   * if you run no social channels, set this.
   */
  contactEmail?: string;
  social: {
    /** Official game website URL (the game itself, not the wiki). */
    official: string;
    discord?: string;
    youtube?: string;
    twitter?: string;
    reddit?: string;
  };
  /** Exact trusted source URLs allowed by the article-source checker. */
  trustedStorePages?: string[];
  /** Exact trusted reference/material URLs allowed by the article-source checker. */
  trustedMaterialPages?: string[];
  /**
   * Canonical URLs about the GAME (Steam page, official site, Wikipedia entry…).
   * Emitted as Organization JSON-LD `sameAs` — helps Google / AI engines link
   * this wiki to the game's knowledge-graph entity.
   */
  sameAs?: string[];
  game: {
    /** Full game name. */
    name: string;
    /** Optional Steam AppID for the reusable Deals page. Leave unset until configured for a specific game. */
    steamAppId?: number;
    /** Optional Steam store title used by Steam data and retailer offer lookups. */
    steamGameTitle?: string;
    /** Platform: "Roblox" | "Steam" | "Epic Games" | "Mobile" | ... */
    platform: string;
    /** Developer / studio name. */
    developer: string;
    /** Genre description. */
    genre: string;
    /** Information-architecture profile used to order the selected categories. */
    navigationProfile?: NavigationProfile;
    /** ISO release date (optional). */
    releaseDate?: string;
  };
  /**
   * Dimensions of the default OG/Twitter share image (public/images/hero.webp).
   * Emitted as og:image:width / og:image:height so social crawlers can render
   * the share card without downloading the image first.
   */
  ogImageWidth: number;
  ogImageHeight: number;
  /** Default author name for articles without an explicit `author` in frontmatter (E-E-A-T signal). */
  defaultAuthor?: string;
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

export const site: SiteConfig = {
  name: 'Anvil Quest Preview Guides Wiki',
  shortName: 'AQG Wiki',
  description: 'Preview of the AnvilWiki guides homepage preset.',
  domain: 'localhost:4322',
  enableDropdownNavigation: false,
  tagline: 'Guides-first preview',
  legalNotice: 'Fan-made preview site.',
  // Set a real address if you run no social channels — the contact page
  // renders it as a mailto link.
  contactEmail: 'lonelyelec@gmail.com',
  social: {
    official: 'https://example.com',
  },
  trustedStorePages: [],
  trustedMaterialPages: [],
  game: {
    // Temporary live-data test target; replace or remove together with steamAppId for a real fork.
    steamAppId: 1867240,
    steamGameTitle: 'WARDOGS',
    name: 'Anvil Quest Preview Guides',
    platform: 'Roblox',
    developer: 'Forge Studios',
    genre: 'Fantasy RPG',
    navigationProfile: 'rpg',
    releaseDate: '',
  },
  // og:image dims of the SHIPPED hero.webp — if you replace public/images/hero.webp,
  // update these in src/config/site.ts to match (wrong dims mis-crop share cards).
  ogImageWidth: 1200,
  ogImageHeight: 630,
};

/** Absolute site URL (no trailing slash). Falls back to the Astro `site` config. */
export const siteUrl: string = (process.env.SITE_URL || `https://${site.domain}`).replace(
  /\/$/,
  '',
);
