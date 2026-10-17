# Homepage Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add consent-gated, generic GA4 homepage click tracking to the AnvilWiki template and prove it survives template initialization.

**Architecture:** Keep the existing `PUBLIC_GA_ID` environment gate and Consent loader. Expose a narrow global readiness contract from `BaseLayout.astro`, send one standardized `homepage_nav_click` event through a small helper, and use data attributes plus one delegated listener in `HomePage.astro`. Existing `QuickStart.astro` and `ExploreModules.astro` markers are reused.

**Tech Stack:** Astro 5, TypeScript, vanilla browser events, Vitest, pnpm, Cloudflare Pages environment variables.

---

### Task 1: Add the GA readiness contract and helper

**Files:**
- Modify: `src/components/layout/BaseLayout.astro` in the consent-gated GA branch
- Create: `src/lib/homepage-analytics.ts`
- Test: `tests/homepage-analytics.test.ts`

- [ ] **Step 1: Add failing helper tests**

Test that a ready target calls `gtag('event', 'homepage_nav_click', ...)` with the five standardized parameters, while a non-ready target returns `false` and makes no call.

- [ ] **Step 2: Run the focused test and confirm it fails because the helper is absent**

Run: `pnpm vitest run tests/homepage-analytics.test.ts`
Expected: FAIL with the helper import/module missing.

- [ ] **Step 3: Implement the minimal helper**

Create `HomepageClickPayload`, `HomepageAnalyticsTarget`, the constant `HOMEPAGE_CLICK_EVENT = 'homepage_nav_click'`, and `trackHomepageClick(target, payload)`. Return `false` unless `target.__awAnalyticsReady` is truthy and `target.gtag` is a function; otherwise call:

```ts
target.gtag('event', HOMEPAGE_CLICK_EVENT, {
  slot: payload.slot,
  item: payload.item,
  target_path: payload.targetPath,
  variant: payload.variant,
  locale: payload.locale,
});
```

- [ ] **Step 4: Mark the loader ready only after GA is initialized**

In the existing `if (preferences.analytics && gaId)` branch, assign `window.gtag = gtag` after the local function is declared, then call `gtag('js', new Date())` and `gtag('config', gaId)`, followed by `window.__awAnalyticsReady = true`. Do not set the readiness flag when `PUBLIC_GA_ID` is empty.

- [ ] **Step 5: Run the focused test**

Run: `pnpm vitest run tests/homepage-analytics.test.ts`
Expected: PASS.

### Task 2: Instrument generic homepage navigation

**Files:**
- Modify: `src/components/home/HomePage.astro`
- Reuse unchanged: `src/components/home/QuickStart.astro`, `src/components/home/ExploreModules.astro`
- Test: `tests/homepage-analytics.test.ts`

- [ ] **Step 1: Add source-contract assertions**

Assert that `HomePage.astro` imports `trackHomepageClick`, contains the eight supported `data-home-slot` values, uses `data-home-item` values that are either generic semantic IDs or data-driven titles, and guards the listener with a build-time `PUBLIC_GA_ID` check.

- [ ] **Step 2: Add generic markers to remaining links**

Use these exact contracts: Hero official link `hero_primary` / `official`; Hero category link `hero_secondary` / `primary_category`; Recent browse link `recent_updates_browse_all` / `browse_all`; recent article links `recent_update` / article title; popular links `popular` / label; closing official link `closing_cta` / `official`; closing Discord link `closing_cta` / `discord`.

- [ ] **Step 3: Add one conditional delegated listener**

When `PUBLIC_GA_ID` is present, import the helper and attach one click listener to each `[data-home-slot]` anchor. Derive `target_path` with `new URL(element.href, window.location.origin).pathname`, pass `document.documentElement.lang || 'en'`, and use `variant: 'home-v1'`. When the build-time ID is empty, omit this script so the default fork keeps the zero-third-party-JS contract.

- [ ] **Step 4: Run the focused tests and typecheck**

Run: `pnpm vitest run tests/homepage-analytics.test.ts && pnpm typecheck`
Expected: tests pass; typecheck reports zero errors and only any pre-existing Astro hints.

### Task 3: Verify initializer and document the feature

**Files:**
- Modify: `tests/apply-template.test.ts`
- Modify: `scripts/e2e-apply-template.mjs`
- Modify: `docs/handbook/en/enable-ads.md`
- Modify: `docs/deployment.md`

- [ ] **Step 1: Add static initializer safeguards**

Assert the generic source and `wrangler.toml` keep `PUBLIC_GA_ID` empty by default, and no test fixture or generated output contains a site-specific identity.

- [ ] **Step 2: Extend real-mode E2E output checks**

After the generated fork build, assert the homepage contains no `homepage_nav_click` when its `PUBLIC_GA_ID` is empty, while the source/helper files are present. This proves the default fork does not emit the optional listener.

- [ ] **Step 3: Document setup and verification**

Add the event name and its parameters to the existing GA4 setup section. Explain that Realtime is the first verification surface, normal reports may lag, and events only appear after Analytics consent.

- [ ] **Step 4: Run the full applicable quality gate**

Run:

```text
pnpm test
pnpm typecheck
pnpm lint
pnpm check-config
pnpm check-content
pnpm check-i18n --strict-ui
pnpm build
pnpm check-links
pnpm test:e2e
```

Expected: all commands pass; any existing Astro hints are reported separately.

### Task 4: Review the final scope

**Files:**
- Review: `git diff --stat`, `git diff --check`, and `git status --short`

- [ ] **Step 1: Confirm only template analytics/docs/tests files changed**

Do not stage or alter unrelated files in this uncommitted template checkout.

- [ ] **Step 2: Confirm no game-specific identity or credentials entered the template**

Search the runtime source and generated fixtures for site-specific names, domains, Measurement IDs, and credential-like values; expected zero matches.
