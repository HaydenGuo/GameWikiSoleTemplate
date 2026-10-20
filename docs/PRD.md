# GameWikiSoleTemplate Product Requirements

## Product

GameWikiSoleTemplate is an open-source Astro template for building multilingual game wikis and player guides. It provides content collections, navigation, search, SEO metadata, legal pages, optional comments and advertising, and a repeatable initializer for adapting the template to a game.

## Current architecture

- Astro emits static pages for fast delivery and resilient reading.
- GitHub is the source repository and Vercel is the supported hosting and deployment platform.
- Optional same-origin serverless APIs live in the repository root `api/` directory.
- Optional Popular / Most Read statistics use Neon Postgres and remain disabled by default.
- Local page work uses `pnpm dev`; API integration work uses `pnpm dev:vercel`.
- Deployment and environment setup are maintained in [deployment.md](deployment.md), [development.md](development.md), and [popular-reading.md](popular-reading.md).

## Product requirements

1. A fork must remain usable as a static site when optional integrations are unconfigured.
2. Setup must replace template identity and sample content without deleting author-owned files.
3. Navigation must derive from the site's selected content structure and support four or fewer primary categories in Quick Start.
4. Every supported locale must have valid navigation, metadata, and core UI strings.
5. User-facing content must distinguish verified facts from uncertain or changing game details.
6. Server-side credentials must stay out of browser bundles and tracked example values.
7. Deployment guidance must describe the GitHub-to-Vercel workflow and current environment variables.
8. Template changes must update the version, announcement, changelog, baseline, and release records together.
9. Game-deals callers use the same-origin `/api/game-deals` route and the site's configured Steam App ID; the handler canonicalizes cache keys, uses Vercel CDN caching, and supports an optional shared Redis cache with an atomic refresh lock.

## Acceptance checks

- Lint, typecheck, configuration, content, production build, internal-link, and template-baseline checks pass.
- The initializer produces a working fork with no template-only identity or unsupported hosting configuration.
- Optional API failures preserve static content and provide a truthful unavailable state.
- The initializer captures the target game's optional Steam App ID and exact store title, and removes the demo game's ID from generated forks when left blank.
- The initializer's generated fork retains `api/game-deals.ts`; homepage and Deals callers target one canonical `/api/game-deals?appid=…` URL without request-level cache bypass, and the handler contract plus shared refresh lock are covered by automated tests.
- The deployed project is connected to the intended GitHub repository and its Vercel preview succeeds before merge.
