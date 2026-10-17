# Codes and Guides Homepage Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the verified Codes and Guides temporary previews as selectable homepage presets in the AnvilWiki template.

**Architecture:** Move shared article, citation, layout, navigation, and styling improvements into the common template framework. Store the two differing site identity, homepage, navigation, and visual configurations as versioned preset data. Extend the existing `apply-template` selection flow so it applies one complete preset deterministically.

**Tech Stack:** Astro 5, TypeScript, JSON locale content, pnpm, Vitest.

**Spec:** Current Codex thread requirements: fixed game-site navigation vocabulary and order; Codes and Guides homepage presets; article lead image; Sources/citations; stable left TOC; no `/landing`; English-only output.

## Global Constraints

- Preserve `D:\HBCodeRepo\GameWebs\template - AnvilWiki` as the only durable template target.
- Treat `C:\Users\Administrator\AppData\Local\Temp\anvilwiki-home-presets-*` as read-only preset sources.
- Do not copy `node_modules`, `.astro`, `dist`, logs, or caches into the template.
- Keep the allowed navigation vocabulary and its fixed order: Guides, Builds, Items, Maps, Bosses, Tier List, News, Codes.
- Do not restore Chinese routes, locale files, or `/landing` pages.

---

### Task 1: Capture preset data and selection contract

**Files:**
- Create: `presets/codes.json`
- Create: `presets/guides.json`
- Modify: `scripts/lib/apply-rewrites.ts`
- Test: `tests/apply-template.test.ts`

- [ ] Write a failing test asserting each preset has a name, homepage configuration, and only navigation keys from the allowed vocabulary.
- [ ] Run `pnpm exec vitest run tests/apply-template.test.ts` and confirm the missing preset-data assertion fails.
- [ ] Add the two data files, sourced from the verified temporary snapshots, and make `apply-template` resolve `codes` and `guides` through those files.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Promote shared verified UI behavior

**Files:**
- Modify: `src/components/article/ArticlePage.astro`
- Create: `src/components/article/Sources.astro`
- Modify: `src/components/article/TableOfContents.astro`
- Create: `src/components/mdx/Citation.astro`
- Modify: `src/components/home/HomePage.astro`
- Modify: `src/components/layout/BaseLayout.astro`
- Modify: `src/styles/globals.css`

- [ ] Write or extend a source-level regression test for Sources/Citation and the fixed-height, scrollable TOC contract.
- [ ] Run the test and confirm it fails before the shared components are promoted.
- [ ] Copy only the shared implementation portions from both matching snapshots into the template; retain configuration-dependent copy in preset data.
- [ ] Run the focused test and inspect both preview pages.

### Task 3: Enforce the durable navigation and no-landing contract

**Files:**
- Modify: `src/config/navigation.ts`
- Modify: `scripts/apply-template.ts`
- Modify: `scripts/lib/apply-rewrites.ts`
- Modify: `tests/apply-template.test.ts`

- [ ] Write a failing test for the fixed allowed navigation vocabulary/order and rejection of arbitrary additional keys.
- [ ] Run the focused test and confirm it fails.
- [ ] Implement the fixed ordered selection contract and remove remaining `/landing` generation paths.
- [ ] Run the focused test and verify generated route sources contain no `/landing` pages.

### Task 4: Validate both concrete presets

**Files:**
- Test: `tests/apply-template.test.ts`
- Test: `scripts/e2e-apply-template.mjs`

- [ ] Run the template application test suite once for `codes` and once for `guides`.
- [ ] Build an isolated generated Codes instance and verify title, hero, and Codes-first homepage module.
- [ ] Build an isolated generated Guides instance and verify title, hero, and Guides-first homepage module.
- [ ] Run `pnpm build` in the template and verify no `/zh/` or `/landing/` output is generated.
