# GameWikiSoleTemplate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-source Astro game-wiki starter by integrating GameWikiCore v2.7.2 into the GameWikiTemplate v1.1.2 source tree and removing the separate Core package/link boundary.

**Architecture:** Start with the current GameWikiTemplate `main` snapshot. Place Core runtime source in the existing local `src` directories, migrate package self-imports to the local `~` alias, reconcile overlapping scripts, and make all dev/build/validation flows operate on this repository alone.

**Tech Stack:** Astro 5, TypeScript, MDX, pnpm 11.1.1, Vitest, ESLint, Pagefind, Cloudflare Pages build tooling.

**Spec:** `docs/superpowers/specs/2026-10-17-gamewiki-sole-template-design.md`

## Global Constraints

- The resulting starter must install, develop, validate, build, and initialize without a Git dependency on GameWikiCore, a separately versioned Core package, junctions, or a source-link step.
- Existing Template/Core repositories and deployed game sites remain untouched by this work.
- Preserve the fixed `Quick Answer → body → Sources` article contract and current generic starter behavior.
- Preserve `apply-template`, its interactive/answers parity, rerun safety, and real-mode E2E behavior.
- Do not deploy, publish, change DNS/provider settings, or merge a pull request.
- Keep game identity, routes, content, images, video IDs, and deployment values in configuration/content rather than reusable runtime components.
- Preserve MIT notices and attribution from both sources.

## Review Focus

- Any runtime or generated MDX import still resolves through `@hb-game-wiki/template`; test that local paths resolve and the package namespace is absent from active source. Package tests may contain the literal string to assert its absence.
- Duplicate script behavior drifts during consolidation; test Template-only and Core-only validation cases in the merged commands.
- Default and non-default locale pages lose a route or metadata during source integration; assert both route sets are emitted by the production build.
- `apply-template` or reruns overwrite user-owned content after the E2E link step is removed; exercise answers-mode, interactive-mode, and rerun preservation cases.
- Optional ads, comments, and media render when their configuration/environment values are empty; retain the existing disabled-state coverage for affected render paths.

---

### Task 1: Seed the new repository and remove the package boundary

**Files:**
- Copy tracked files from current `GameWikiTemplate` `main` into this repository, excluding upstream `.git`; retain this repository's `docs/superpowers/**` files.
- Modify: `.gitignore`, `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `tests/template-package.test.ts`.
- Delete: `scripts/link-template-source.mjs` and `scripts/check-template-boundary.ts`.

**Interfaces:**
- Consumes: approved spec and current Template v1.1.2 snapshot.
- Produces: a working starter base with the new package identity and no separate Core dependency, namespace alias, source-link lifecycle command, or junction checker.

- [ ] **Step 1: Create the implementation branch and seed the repository**

Create branch `codex/merge-template-core` from the approved design commit. Copy the tracked Template `main` tree without its `.git` directory, preserving this repository's spec and plan. Confirm the working tree has no unrelated files before changing package metadata.

- [ ] **Step 2: Add package-boundary tests**

Rewrite `tests/template-package.test.ts` to assert `package.json.name === 'gamewiki-sole-template'`; `@hb-game-wiki/template` is absent from dependency groups and TypeScript paths; root scripts do not include `template:link` or `check-template-boundary`; the `.gitignore` permits tracking unified runtime files under `src/components`, `src/i18n`, `src/lib`, `src/pages`, `src/styles`, and `src/config/article-template.ts`; and the article file still defines fixed `quick-answer` and `sources` around editable `body`. Defer stale-reference scanning in docs/workflows to Task 4.

- [ ] **Step 3: Install test tooling and run the package test**

Run: `pnpm install --no-frozen-lockfile` and `pnpm exec vitest run tests/template-package.test.ts`.

Expected: dependency install uses the current manifest; the package test fails on old identity and Core/link boundary assertions.

- [ ] **Step 4: Implement the package boundary removal**

Set the package name to `gamewiki-sole-template`; remove `@hb-game-wiki/template`, its TypeScript path alias, and link/junction lifecycle hooks. Keep popular-slug manifest generation in `prebuild`. Remove the `.gitignore` entries that hide Core-owned `src` directories and `src/config/article-template.ts`, since those are now first-party tracked source. Delete the two obsolete link/boundary scripts. Do not modify game-site repositories.

- [ ] **Step 5: Refresh the lockfile and pass the package test**

Run: `pnpm install --no-frozen-lockfile` and `pnpm exec vitest run tests/template-package.test.ts`.

Expected: PASS; the lockfile contains no `GameWikiCore` Git source or `@hb-game-wiki/template` importer.

- [ ] **Step 6: Commit the unified package base**

Commit message: `refactor: establish unified template package`.

### Task 2: Integrate Core runtime source and local imports

**Files:**
- Add from current `GameWikiCore` `main`: `src/components/**`, `src/pages/**`, `src/lib/**`, `src/i18n/**`, and `src/styles/**`.
- Keep Template `src/config/article-template.ts`; it is byte-identical to Core's current copy.
- Modify Core runtime imports and Template source/MDX imports from `@hb-game-wiki/template/*` to local `~/components/*`, `~/lib/*`, `~/i18n/*`, or `~/config/*` paths.
- Add Core's `tests/carousel-layout.test.ts`; reconcile Core and Template copies of `tests/navigation-mode.test.ts` and `tests/source-policy.test.ts`.
- Modify `tests/article-widgets.test.ts`, `tests/homepage-analytics.test.ts`, and `tests/article-template.test.ts` to assert local imports and the existing article contract.

**Interfaces:**
- Consumes: current Astro alias `~/* -> src/*`.
- Produces: a local runtime surface; all existing Template configs/content resolve against it without any runtime package self-import.

- [ ] **Step 1: Add local-source regression assertions**

Extend the source-policy/package tests to detect `@hb-game-wiki/template` imports in runtime and example MDX, and assert the fixed `ARTICLE_TEMPLATE` regions remain unchanged. Test files may contain the literal string as a search target.

- [ ] **Step 2: Run the focused tests to capture the failing state**

Run: `pnpm exec vitest run tests/source-policy.test.ts tests/navigation-mode.test.ts tests/carousel-layout.test.ts tests/article-template.test.ts tests/article-widgets.test.ts tests/homepage-analytics.test.ts`.

Expected: FAIL while package imports remain or imported Core runtime/test files are missing.

- [ ] **Step 3: Copy Core runtime and migrate imports**

Copy Core's `src/components`, `src/pages`, `src/lib`, `src/i18n`, and `src/styles` into matching local directories. Replace package namespace imports with `~` alias imports. Preserve Template-owned `src/config`, `src/content`, `src/assets`, `src/locales`, and `public` files unless a specific collision is resolved in the test/review step.

- [ ] **Step 4: Consolidate runtime unit tests**

Retain the union of Template/Core navigation-mode and source-policy assertions in their existing test files; include the Core carousel-layout test; update widget and homepage analytics assertions to the local path aliases.

- [ ] **Step 5: Run focused tests**

Run: `pnpm exec vitest run tests/source-policy.test.ts tests/navigation-mode.test.ts tests/carousel-layout.test.ts tests/article-template.test.ts tests/article-widgets.test.ts tests/homepage-analytics.test.ts`.

Expected: PASS with no runtime or MDX package imports.

- [ ] **Step 6: Commit the runtime integration**

Commit message: `feat: integrate GameWikiCore runtime`.

### Task 3: Reconcile duplicate scripts and policy helpers

**Files:**
- Reconcile the nine overlapping paths: `scripts/check-config.ts`, `scripts/check-content.ts`, `scripts/check-i18n.ts`, `scripts/check-links.ts`, `scripts/check-sitemap.ts`, `scripts/template-baseline.ts`, `scripts/lib/apply-rewrites.ts`, `scripts/lib/popular-manifest.ts`, and `scripts/lib/prompt.ts`.
- The current Core snapshot has no script paths outside those nine overlaps; do not add a second copy of the script tree.
- Preserve Core's `tests/carousel-layout.test.ts` from Task 2 and reconcile the two overlapping test files there.
- Modify or add focused tests for merged validation and rewrite behavior under `tests/`.

**Interfaces:**
- Consumes: local runtime and Template config/content structures from Tasks 1–2.
- Produces: one implementation for each overlapping utility, preserving the union of documented Template and Core behavior.

- [ ] **Step 1: Pin unique behaviors from both source versions**

For every overlapping script, compare the two upstream files and add/extend tests for behavior present in only one version. Cover valid and invalid config/content, strict UI i18n checks, internal links, sitemap validation, baseline protection/allow-list behavior, rewrite prompts, and answers mode.

- [ ] **Step 2: Run focused script tests**

Run: `pnpm exec vitest run tests/source-policy.test.ts tests/prompt.test.ts tests/popular-manifest.test.ts tests/apply-template.test.ts`.

Expected: FAIL only on newly pinned behavior not yet implemented in the merged scripts.

- [ ] **Step 3: Merge duplicate implementations deliberately**

Keep Template starter-specific checks and incorporate Core-only generic behavior. Do not overwrite files by copying a whole tree. Preserve current command names and JSON/artifact formats unless the spec explicitly changes them.

- [ ] **Step 4: Run the merged validators**

Run: `pnpm check-config`, `pnpm check-content`, `pnpm check-i18n --strict-ui`, `pnpm check-links`, and `pnpm check-sitemap`.

Expected: current valid starter inputs pass and invalid fixtures continue to produce their tested errors.

- [ ] **Step 5: Commit the reconciled scripts**

Commit message: `refactor: reconcile unified template tooling`.

### Task 4: Make initializer, instructions, baseline, and CI self-contained

**Files:**
- Modify `scripts/e2e-apply-template.mjs` and `tests/apply-template.test.ts` to remove installed-Core link setup and retain interactive/answers/rerun coverage.
- Modify root `AGENTS.md`, `README.md`, `docs/apply-template.md`, `docs/art-typography.md`, `docs/solo-maintainer-protection.md`, and `docs/starter-boundary.md` (replace split-repository guidance with the unified source/ownership guide).
- Search/update `docs/PRD.md`, `docs/development.md`, and `docs/README.md` if they refer to the split boundary.
- Review `.github/workflows/ci.yml`, `content-pipeline.yml`, `release-ops.yml`, `setup.yml`, and `solo-maintainer.yml`; remove calls to deleted commands but preserve publishing targets and secrets.
- Regenerate `docs/template-baseline.json` after the final source tree and intentional removals are settled.

**Interfaces:**
- Consumes: local source, scripts, and package setup from Tasks 1–3.
- Produces: initializer and repository instructions that operate on this repository alone.

- [ ] **Step 1: Add initializer and documentation self-containment coverage**

Update E2E assertions to build a clean copy without a sibling Core checkout, run both answers and interactive initialization paths, and rerun the initializer while asserting user-created content remains unchanged. Extend `tests/template-package.test.ts` to scan only active README/AGENTS/docs/workflow files for split-boundary instructions; exclude `docs/superpowers/**`, which records migration provenance.

- [ ] **Step 2: Run initializer and documentation contract tests**

Run: `pnpm exec vitest run tests/apply-template.test.ts tests/template-package.test.ts` and `pnpm test:e2e`.

Expected: FAIL on obsolete Core-link setup and current split-boundary documentation.

- [ ] **Step 3: Remove E2E link setup and preserve initializer behavior**

Delete the step invoking `pnpm template:link`; copy/execute the unified project in the existing scratch flow. Keep interactive and `--answers` paths equivalent, safe on rerun, and limited to generic placeholder output.

- [ ] **Step 4: Align docs and CI**

Replace current two-repository descriptions and Core-upgrade procedures with a single-source workflow. Keep valid content, article, fork-preservation, security, and deployment guidance. Update CI invocations only where commands were removed.

- [ ] **Step 5: Regenerate and check the starter baseline**

Run: `pnpm template-baseline:create` then `pnpm template-baseline:check`. Record only intentional removals in the baseline allow-list if required by the checker.

Expected: PASS with all current local runtime/config/content paths covered by the baseline.

- [ ] **Step 6: Search active project files for stale architecture**

Run: `rg -n --glob '!docs/superpowers/**' 'GameWikiCore|@hb-game-wiki/template|template:link|check-template-boundary' README.md AGENTS.md docs scripts src tests .github package.json tsconfig.json pnpm-lock.yaml`.

Expected: no active setup, dependency, build, or workflow instruction requires a separate Core repository; historical spec/plan provenance remains outside this active-surface check.

- [ ] **Step 7: Commit initializer and documentation alignment**

Commit message: `docs: describe unified GameWikiSoleTemplate workflow`.

### Task 5: Run full acceptance verification

**Files:**
- No product edits unless a failure identifies a concrete issue; fixes belong in the task that owns the failing area.
- Inspect generated files under `dist/` and the temporary initializer project made by `scripts/e2e-apply-template.mjs`.

**Interfaces:**
- Consumes: completed unified starter from Tasks 1–4.
- Produces: pass/fail evidence for each spec acceptance criterion and a clean diff for review.

- [ ] **Step 1: Verify a frozen clean install**

Run: `pnpm install --frozen-lockfile`.

Expected: install succeeds without fetching GameWikiCore and without creating source junctions.

- [ ] **Step 2: Run the complete project checks in sequence**

Run: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm check-config`, `pnpm check-content`, `pnpm check-i18n --strict-ui`, `pnpm build`, `pnpm check-links`, and `pnpm test:e2e`.

Expected: every command passes. Record exact environment or pre-existing failures separately and do not label a blocked gate PASS.

- [ ] **Step 3: Inspect built routes and optional states**

Check `dist/` for default and secondary-locale home, article, legal, and listing routes. Confirm empty ad/comment/media settings do not render active integrations. Confirm E2E output uses generic identity/assets/navigation only.

- [ ] **Step 4: Check source integrity and final diff**

Run: `pnpm template-baseline:check`; inspect `git status --short`, `git diff --check`, `git diff main...HEAD`, and the active-surface search from Task 4. Confirm the diff contains only GameWikiSoleTemplate project files.

- [ ] **Step 5: Commit any verification fix and report evidence**

Commit message for fixes, if needed: `fix: address unified starter verification findings`. Report each command's result and remaining REVIEW/BLOCKED items separately.

## Coverage self-review

- Unified runtime, local imports, and fixed article contract: Task 2.
- Overlapping validators and rewrite behavior: Task 3.
- Package removal, no junctions, and clean install: Tasks 1 and 5.
- Initializer parity, rerun safety, and generic placeholders: Task 4.
- Docs, CI, baseline, and active stale-reference search: Task 4.
- Locale routes, optional integrations, full check set, and untouched source sites: Task 5.
- The article-template files match in the reviewed upstream baseline; the plan retains the Template file and verifies its fixed regions rather than treating it as an unresolved conflict.
