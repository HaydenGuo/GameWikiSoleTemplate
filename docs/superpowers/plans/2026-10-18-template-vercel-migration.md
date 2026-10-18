# GameWikiSoleTemplate Vercel Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Vercel the template's documented and operational hosting target while preserving its static Astro output and all existing same-origin API contracts.

**Architecture:** Keep Astro's static build on Vercel and move all Pages Functions to Vercel's root `api/` Function convention. Replace D1 with an optional Neon Postgres adapter, preserve `{slug, views}` and article-view HTTP behavior, and use standard response caching headers for game-deal API responses. Remove Cloudflare-only runtime and deployment references from active product docs/config; retain historical plans as history.

**Tech Stack:** Astro 5 static output, Vercel Node.js Functions, TypeScript, `@neondatabase/serverless`, Vitest, pnpm.

**Spec:** User-authorized request in the active task: migrate the template itself to Vercel, convert Functions/D1 and deployment configuration, push to GitHub, and merge to `main`.

## Global Constraints

- Keep the static site and existing browser-facing `/api/*` contracts.
- Preserve the disabled-by-default behavior and static fallbacks when Neon is not configured.
- Never add account-specific Vercel, Neon, domain, or credential values to the template.
- Keep deployment instructions on the user's confirmed GitHub → Vercel path.
- Update package version, announcement, and changelog together; use a major version for the default-hosting migration.
- Preserve the existing dirty worktree; only modify the isolated migration worktree.

## Review Focus

- Vercel API function method routing returns the same status/JSON contracts, including 400/405/503 cases.
- Neon SQL uses parameterized queries, UTC/current-date aggregation, and fails closed without a database URL.
- Game-deal requests no longer depend on Cloudflare Cache API and retain bounded CDN caching.
- No active template docs/config claim Cloudflare is the deployment host or use D1/Wrangler setup.
- Static build, generated route manifest, baseline, initializer E2E, and GitHub checks remain valid.

---

### Task 1: Move runtime APIs and persistence

**Files:**
- Create: `api/game-deals.ts`, `api/article-view.ts`, `api/popular.ts`, `src/lib/popular-handlers.ts`, `src/lib/neon-popular-db.ts`
- Modify: `tests/popular-api.test.ts`, `tests/popular-handlers.test.ts`, `tests/popular-manifest.test.ts`, `package.json`, `migrations/0001_article_views_daily.sql`
- Delete: `functions/**`

- [ ] Keep route names and method/status contracts; use Node Web Request/Response handlers for Vercel.
- [ ] Use Neon parameterized SQL and `DATABASE_URL`; retain 503 plus static fallbacks when database access is disabled.
- [ ] Replace Cloudflare Cache API with `Cache-Control` headers on the game-deals response.
- [ ] Run focused API tests, then the existing relevant test/check commands.

### Task 2: Align platform config and user guidance

**Files:**
- Modify: `astro.config.ts`, `.env.example`, `README.md`, `AGENTS.md`, `docs/deployment.md`, `docs/development.md`, `docs/popular-reading.md`, `docs/apply-template.md`, `docs/comments.md`, `docs/content-pipeline.md`, `docs/PRD.md`, `src/components/layout/BaseLayout.astro`, `src/components/layout/LegalContent.astro`, `src/config/landing.ts`, `src/lib/url.ts`, `scripts/lib/apply-rewrites.ts`, `docs/template-baseline.json`
- Delete: `wrangler.toml`

- [ ] Document GitHub-connected Vercel deployment, project settings, environment variables, domain binding, and Neon setup.
- [ ] Remove Cloudflare Analytics/hosting integration and update privacy language to match Vercel hosting/analytics configuration.
- [ ] Declare intentional removals in template baseline and refresh the recorded file inventory after changes.
- [ ] Update the release announcement/version/changelog for the platform migration.
- [ ] Run link/config/privacy-copy checks and the initializer E2E relevant to default environment generation.

### Task 3: Verify and release

- [ ] Run focused tests, full test suite, Astro check, lint, config checks, production build, link check, initializer E2E, and template baseline check; report any pre-existing failures separately.
- [ ] Inspect the final changed-path list and complete diff; commit only migration files.
- [ ] Push the branch, wait for GitHub checks, inspect the Vercel preview deployment, and merge the approved PR to `main` as requested.
- [ ] Verify merged source SHA, Vercel production deployment state, and release metadata. Do not change domain/DNS settings without the exact Vercel project and authorized record values.
