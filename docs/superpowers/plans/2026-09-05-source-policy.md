# Article Source Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent AnvilWiki article sources and body external links from citing competitor sites, while allowing the configured official game site, YouTube, Steam, and the configured game's Reddit community.

**Architecture:** Add one pure source-policy module that normalizes URLs, checks fixed platform hosts, and derives the official/Reddit allowlist from `site.social`. Reuse it from the Zod `sources` schema and the `check-content` filesystem lint so build-time frontmatter and content-gate validation share the same policy. Update authoring guidance and tests to make the rule visible and regression-proof.

**Tech Stack:** TypeScript, Astro content Zod schema, Vitest, YAML frontmatter parsing, existing `pnpm check-content` gate.

**Spec:** User-confirmed policy: sources may use the official game website, official YouTube, Steam Store/Community, and the relevant game's Reddit subreddit; competitor sites must not appear in article body or sources.

## Global Constraints

- The official website is `site.social.official`; do not hardcode a game domain.
- Reddit is accepted only when `site.social.reddit` is configured and the URL stays within that subreddit path.
- Allowed platform hosts are YouTube (`youtube.com`, `youtu.be`), Steam Store/Community (`store.steampowered.com`, `steamcommunity.com`), and Reddit (`reddit.com` variants).
- Invalid or unapproved source URLs must fail the build/content gate.
- Do not modify other GameWebs checkouts, deployed sites, credentials, or generated output.

---

### Task 1: Add the shared source-policy module

**Files:**
- Create: `src/lib/source-policy.ts`
- Test: `tests/source-policy.test.ts`

**Interfaces:**
- Produces `isAllowedArticleSource(value: string, config: SourcePolicyConfig): SourceCheckResult`.
- Produces `createSourcePolicy(officialUrl: string, redditUrl?: string): SourcePolicy`.
- A source is allowed only when its URL is HTTP(S), has an approved host, and— for official/reddit sources—matches the configured origin/path boundary.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { createSourcePolicy, isAllowedArticleSource } from '~/lib/source-policy';

const policy = createSourcePolicy(
  'https://example-game.com/',
  'https://www.reddit.com/r/ExampleGame/',
);

describe('article source policy', () => {
  it('allows the configured official site and subpaths', () => {
    expect(isAllowedArticleSource('https://example-game.com/patch-notes', policy).allowed).toBe(true);
  });

  it('allows YouTube and both Steam surfaces', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=abc',
      'https://youtu.be/abc',
      'https://store.steampowered.com/app/123',
      'https://steamcommunity.com/app/123/guides/',
    ]) expect(isAllowedArticleSource(url, policy).allowed).toBe(true);
  });

  it('allows only the configured Reddit subreddit', () => {
    expect(isAllowedArticleSource('https://www.reddit.com/r/ExampleGame/comments/abc/post', policy).allowed).toBe(true);
    expect(isAllowedArticleSource('https://www.reddit.com/r/OtherGame/comments/abc/post', policy).allowed).toBe(false);
    expect(isAllowedArticleSource('https://www.reddit.com/r/ExampleGame/comments/abc/post?url=https://competitor.example', policy).allowed).toBe(true);
  });

  it('rejects competitor sites, lookalike hosts, and non-http URLs', () => {
    for (const url of [
      'https://competitor.example/guide',
      'https://youtube.com.evil.example/watch?v=abc',
      'https://store.steampowered.com.evil.example/app/123',
      'javascript:alert(1)',
    ]) expect(isAllowedArticleSource(url, policy).allowed).toBe(false);
  });

  it('rejects Reddit when no relevant subreddit is configured', () => {
    const noReddit = createSourcePolicy('https://example-game.com');
    expect(isAllowedArticleSource('https://www.reddit.com/r/ExampleGame/', noReddit).allowed).toBe(false);
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm vitest run tests/source-policy.test.ts`
Expected: FAIL because `src/lib/source-policy.ts` does not exist.

- [ ] **Step 3: Implement the minimal policy module**

Implement URL parsing with `new URL`, lower-case host normalization, exact host or subdomain checks only where intended, configured-origin matching for the official site, and configured subreddit path-prefix matching with a segment boundary. Return a human-readable rejection reason for lint/build diagnostics.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `pnpm vitest run tests/source-policy.test.ts`
Expected: PASS.

### Task 2: Enforce the policy in schema and content lint

**Files:**
- Modify: `src/content.config.ts`
- Modify: `scripts/check-content.ts`
- Modify: `.github/actions/gates/action.yml`
- Test: `tests/source-policy.test.ts`

**Interfaces:**
- `src/content.config.ts` uses `site.social.official` and `site.social.reddit` to validate each frontmatter `sources[].url`.
- `scripts/check-content.ts` parses frontmatter sources and checks body external Markdown links with the same policy.

- [ ] **Step 1: Add schema and filesystem-lint regression tests**

Add tests that assert the schema refinement rejects a competitor source and that a temporary MDX fixture containing a competitor external link is reported as an error while allowed YouTube/Steam/Reddit links pass. Keep existing content fixtures untouched; test the pure policy and lint-facing helpers where possible.

- [ ] **Step 2: Run the focused tests and verify the new assertions fail**

Run: `pnpm vitest run tests/source-policy.test.ts`
Expected: FAIL until schema/lint integration is implemented.

- [ ] **Step 3: Add schema refinement and content-lint checks**

Import `site` and the shared policy into `src/content.config.ts`; refine `sources` with a per-item URL check. In `check-content.ts`, parse the frontmatter block with the existing `yaml` dependency, report the source URL line/file when rejected, and scan external Markdown links in the body. Keep internal-link rules unchanged. Update the composite gate label so the source policy is explicit.

- [ ] **Step 4: Verify the focused tests and current content**

Run: `pnpm vitest run tests/source-policy.test.ts && pnpm check-content`
Expected: PASS; existing demo content must contain no unapproved `sources` or body external links.

### Task 3: Update authoring contracts and run the full validation set

**Files:**
- Modify: `.agent/skills/anvil-new-article/SKILL.md`
- Modify: `.agent/skills/anvil-batch-articles/SKILL.md`
- Modify: `docs/content-format.md`
- Modify: `requirements/00事实来源.md`

**Interfaces:**
- Authoring guidance states that competitor sites remain research-only material and must never enter public article body or `sources`.
- Allowed public source list consistently includes official site, YouTube, Steam, and relevant Reddit subreddit.

- [ ] **Step 1: Update the four documentation/skill contracts**

Add the exact allowlist, Reddit subreddit restriction, and explicit prohibition on naming/linking competitor sources in public copy. Preserve the existing distinction between research references and publishable evidence.

- [ ] **Step 2: Run repository validation**

Run: `pnpm test`; `pnpm lint`; `pnpm typecheck`; `pnpm check-content`; `pnpm build`
Expected: all commands pass; build output contains no source-policy errors.

- [ ] **Step 3: Review the diff and report scope**

Confirm only the policy module, tests, content schema/lint/gate, and the four authoring documents changed. Do not stage, commit, publish, or deploy without a separate user request.
