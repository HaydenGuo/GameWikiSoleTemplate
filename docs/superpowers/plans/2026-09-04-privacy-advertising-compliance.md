# Privacy and Advertising Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Provide a practical EU/UK opt-in consent flow with granular analytics/advertising choices and document safe Adsterra deployment defaults.

**Architecture:** Keep the static-first Astro template and existing environment-variable gates. Replace the binary consent record with versioned JSON preferences; load each tracker category only after its category is accepted. Add a persistent preferences control and update the privacy/ad documentation with regional and adult-ad guidance.

**Tech Stack:** Astro 5, TypeScript, vanilla browser JavaScript, Vitest.

**Spec:** User request to optimize AnvilWiki for European/US advertising and cookie requirements.

## Global Constraints

- No tracker may load before the visitor grants the relevant non-essential category.
- Necessary site functionality remains available without consent.
- Adult advertising remains opt-in at the publisher configuration level and is not enabled by default.
- Preserve existing env-var gates and static-first behavior when no trackers are configured.

---

### Task 1: Granular consent runtime
**Files:** Modify `src/components/layout/BaseLayout.astro`, `src/components/layout/CookieConsent.astro`.
- [ ] Add category-aware loader and versioned preference storage.
- [ ] Add accept-all, reject-all, and settings controls with accessible labels.
- [ ] Add a persistent “Privacy settings” control to reopen preferences.
- [ ] Detect Global Privacy Control and default advertising consent to false.

### Task 2: Localized labels
**Files:** Modify `src/locales/en.json`, `src/locales/ja.json`.
- [ ] Add labels for settings, analytics, advertising, save, and privacy settings.

### Task 3: Policy and operations documentation
**Files:** Modify `docs/ads.md`, `src/components/layout/LegalContent.astro`.
- [ ] Document EU/UK opt-in, US opt-out/GPC, data-provider disclosure, retention, and adult-ad safeguards.
- [ ] Clarify that Adsterra scripts must be consent-gated and adult ads stay disabled by default.

### Task 4: Verification
**Files:** Add `tests/cookie-consent.test.ts`.
- [ ] Assert static contracts for category gating, versioned storage, GPC handling, and no adult-ad default.
- [ ] Run focused tests, typecheck, lint, and build.
