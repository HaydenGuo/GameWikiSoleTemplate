# Popular Reading D1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Count published-article page views in Cloudflare D1 and display the highest-read articles from the last seven days on the homepage without losing static fallbacks.

**Architecture:** Astro continues to emit the article metadata and static Popular links at build time. A prebuild script creates an allow-list of published canonical article paths for Pages Functions; the write Function validates against it before D1 UPSERT, and the read Function aggregates daily rows then filters the result through the same allow-list. Both Functions degrade to `503` when the optional D1 binding is absent.

**Tech Stack:** Astro 5, TypeScript, Cloudflare Pages Functions, Cloudflare D1, Vitest, Wrangler.

---

### Task 1: Isolate and test Popular API validation logic

**Files:**
- Create: `src/lib/popular-api.ts`
- Create: `tests/popular-api.test.ts`

- [x] Write tests for canonical slug membership, `days` clamping to 1–30, and `limit` clamping to 1–10; run Vitest and observe the missing-module failure.
- [x] Implement the pure helpers and re-run the focused test to green.

### Task 2: Generate the published canonical-slug allow-list

**Files:**
- Create: `scripts/generate-popular-slug-manifest.ts`
- Create: `functions/_generated/allowed-article-slugs.ts`
- Modify: `package.json`

- [x] Add a generator that loads the Astro wiki collection, excludes drafts and scheduled posts, and emits `Set<string>` source using `detailPath`.
- [x] Run the generator and assert known published article paths are present while category paths are absent.
- [x] Add the generator before the Astro build script so Functions and site output share the same canonical paths.

### Task 3: Implement Pages Functions and D1 schema

**Files:**
- Create: `functions/api/article-view.ts`
- Create: `functions/api/popular.ts`
- Create: `migrations/0001_article_views_daily.sql`

- [x] Implement POST-only JSON parsing, slug allow-list checking, optional `POPULAR_DB` handling, and D1 daily UPSERT returning 204.
- [x] Implement GET-only query parsing, bounded aggregation, allow-list filtering, and JSON `{ slug, views }[]` output.
- [x] Add the D1 table with `(slug, view_date)` primary key and date index.

### Task 4: Configure and verify

**Files:**
- Modify: `wrangler.toml`
- Modify: `README.md`

- [x] Add a commented `POPULAR_DB` D1 binding template so no account-specific ID is committed.
- [x] Document database creation, migration execution, binding, rate limit rule, and local Pages development command.
- [x] Run focused tests, config validation, static Astro build, generated-manifest check, and API helper verification.
