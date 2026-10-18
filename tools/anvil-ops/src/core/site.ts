import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parse } from 'dotenv';
import { OpsError } from './errors.js';

export interface SiteConfig {
  root: string;
  siteUrl?: string;
  source: '.env';
}

function fromDotenv(dir: string): SiteConfig | null {
  try {
    const vars = parse(readFileSync(join(dir, '.env'), 'utf8'));
    const siteUrl = vars['SITE_URL']?.trim().replace(/\/+$/, '');
    return siteUrl ? { root: dir, siteUrl, source: '.env' } : null;
  } catch {
    return null;
  }
}

export function loadSiteConfig(startDir: string): SiteConfig {
  let dir = resolve(startDir);
  for (let i = 0; i < 10; i++) {
    const config = fromDotenv(dir);
    if (config) return config;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new OpsError(
    `No site config found: no .env with SITE_URL (searched up from ${startDir}).`,
    'Add SITE_URL=https://your-domain to the repository root .env file. See docs/deployment.md.',
  );
}
