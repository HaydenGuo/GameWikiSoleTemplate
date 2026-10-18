# Historical: Vercel Popular Reading Implementation Plan


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.


**Architecture:** Keep the browser contract unchanged: article pages POST a canonical article path to `/api/article-view`, and the homepage GETs `/api/popular`. Move the shared validation and SQL into a provider-neutral library, expose it through Vercel `api/` functions, and use a Neon Postgres adapter configured by `DATABASE_URL`.

**Tech Stack:** Astro static build, Vercel Functions, Neon serverless Postgres, TypeScript, Vitest.

---

### Task 1: Make popular-statistics logic Postgres-compatible

**Files:**
- Create: `src/lib/popular-handlers.ts`
- Modify: `tests/popular-handlers.test.ts`
- Delete: `functions/lib/popular-handlers.ts`

- [x] Write tests that verify `$1`/`$2` parameter binding, `CURRENT_DATE` daily upsert, published-path validation, and a bounded rolling-window query.
- [x] Run `pnpm vitest run tests/popular-handlers.test.ts` and verify it fails because the new library does not exist.
- [x] Implement the provider-neutral `PopularDatabase` interface plus `recordArticleView` and `getPopularArticles` in `src/lib/popular-handlers.ts`.
- [x] Re-run the test and verify it passes.


**Files:**
- Create: `api/article-view.ts`
- Create: `api/popular.ts`
- Create: `src/lib/neon-popular-db.ts`
- Modify: `package.json`
- Modify: `tests/popular-api.test.ts`
- Delete: `functions/api/article-view.ts`
- Delete: `functions/api/popular.ts`
- Delete: `functions/_generated/allowed-article-slugs.ts`

- [x] Write tests for an unavailable database returning HTTP 503 and method protection returning HTTP 405.
- [x] Run the targeted test and verify the Vercel handlers are absent.
- [x] Add `@neondatabase/serverless`, instantiate the database only when `DATABASE_URL` is present, and create Vercel handlers that share the generated published-slug allow-list.
- [x] Re-run targeted tests and verify they pass.

### Task 3: Replace deployment and operator documentation

**Files:**
- Modify: `migrations/0001_article_views_daily.sql`
- Modify: `.env.example`
- Modify: `docs/popular-reading.md`
- Modify: `README.md`

- [x] Convert SQL to Postgres syntax.
- [x] Document Neon Marketplace provisioning, a separate database per game site, `DATABASE_URL` in Vercel environment variables, and database migration execution.

### Task 4: Verify the template

**Files:**
- Test: `tests/popular-api.test.ts`
- Test: `tests/popular-handlers.test.ts`
- Test: `tests/popular-manifest.test.ts`

- [x] Run all Popular tests.
- [x] Run `pnpm check-config` and `pnpm build` (Astro static build completed; the existing Windows Pagefind binary then failed during the postbuild index stage).
- [x] Inspect the build output and confirm `/api` source files do not affect static route generation while Vercel can deploy them as Functions.
