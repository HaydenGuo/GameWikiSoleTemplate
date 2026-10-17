import { OpsError } from '../core/errors.js';

export interface SiteFlags {
  site?: string;
  all?: boolean;
}

/**
 * Merge the global (--site/--all before the subcommand) and per-command flags.
 * Command-level wins; `all` defaults to false. Pure — unit-tested without
 * spinning up commander.
 */
export function mergeSiteFlags(global: SiteFlags, cmd: SiteFlags): SiteFlags & { all: boolean } {
  return { site: cmd.site ?? global.site, all: cmd.all ?? global.all ?? false };
}

/** --site <name> and --all are mutually exclusive (both positions validated). */
export function assertNotBothSiteAndAll(flags: SiteFlags): void {
  if (flags.site && flags.all) {
    throw new OpsError(
      '--site and --all are mutually exclusive.',
      'Use either --site <name> for one registered site, or --all for every registered site.',
    );
  }
}

/**
 * Registry site names: non-empty, no whitespace/control chars, must start
 * alphanumeric. Keeps `sites list` tables and `--site <name>` ergonomics sane.
 */
export function validateSiteName(name: string): string {
  const n = name.trim();
  if (!n) {
    throw new OpsError('Site name must not be empty.', 'Use a short slug, e.g. `anvil-ops sites add main-wiki /path/to/repo`.');
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(n)) {
    throw new OpsError(
      `Site name "${name}" contains unsupported characters.`,
      'Use letters, digits, dots, dashes and underscores, starting alphanumeric (e.g. main-wiki, site2).',
    );
  }
  return n;
}
