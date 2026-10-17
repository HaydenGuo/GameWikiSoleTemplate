# GameWikiSoleTemplate source and ownership

GameWikiSoleTemplate keeps reusable runtime, starter configuration, example content, and operational tooling in one repository. Development does not require a separate Core package, Git dependency, source link, or junction.

## Project layers

| Area | Location | Purpose |
|---|---|---|
| Runtime | `src/components/`, `src/pages/`, `src/lib/`, `src/i18n/`, `src/styles/` | Generic reusable UI, routes, helpers, locale routing, and styles |
| Configuration | `src/config/`, `src/locales/`, `astro.config.ts`, `wrangler.toml` | Starter defaults and per-site settings |
| Content | `src/content/`, `src/assets/`, `public/` | Example articles and site assets |
| Operations | `scripts/`, `.github/`, `docs/` | Initialization, validation, CI, and user guidance |

Runtime components stay game-neutral. Site-specific identity, facts, routes, images, video IDs, and deployment settings belong in configuration and content.

## Local development

```powershell
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

All source paths are ordinary tracked files in this repository. Use the `~/` alias for local imports. `pnpm template-baseline:check` protects starter-owned files from accidental deletion; intentional baseline changes should be reviewed and recorded with the corresponding allow-list entry.

## Initializing a site

Run `pnpm apply-template` for interactive setup or `pnpm apply-template --answers answers.json` for scripted setup. The initializer changes configuration and selected demo content, supports safe reruns, and does not install or link a separate runtime package. See [apply-template.md](apply-template.md) for file ownership and preservation rules.

## Updating shared behavior

Make generic runtime changes directly in the relevant local source, add or update tests, and run the affected validation gates. There is one version-controlled source tree; no Core tag or package upgrade step is needed.
