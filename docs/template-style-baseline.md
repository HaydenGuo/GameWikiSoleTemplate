# Template visual baseline

The template's default visual direction is a warm, image-led wiki shell proven in production. This is a reusable presentation baseline, not a copy of any one game's content or information architecture.

## What is included by default

- Warm gold brand tokens in `src/styles/globals.css`, with all component colors still derived from the four theme variables.
- A full-bleed, gently drifting hero image using the stable `/images/hero.webp` asset. `pnpm gen-assets` can replace this asset after a fork.
- A two-column hero when a homepage video is configured.
- Image-led Quick Start and Explore cards, with responsive hover/focus states.
- Article cards that use their frontmatter cover when available.
- A five-link-capable primary navigation seam (`PRIMARY_NAVIGATION`) that can later expose utility pages without turning them into content categories.
- A server-rendered search input while Pagefind is loading, so opening search remains usable during development and slow asset loads.

## What remains per-site

Game name, domain, official links, categories, article content, cover art, video IDs, tools, achievements, and any game-specific interactive modules remain outside the generic template baseline. A fork should configure those through `src/config`, `src/locales`, `src/content/wiki`, and `public/`.

The `apply-template` CLI also writes the four generic home-card illustrations into the generated homepage preset. Therefore the post-setup site keeps the same visual composition without retaining the demo game's screenshots or showcase directory.

## Acceptance checks

After changing the baseline or the setup preset, run:

```text
pnpm exec astro build
pnpm check-links
pnpm test
```

The build and link audit prove that the default demo remains renderable. The `apply-template` E2E path should additionally prove that a newly initialized site still contains the `home.start.cards[].image` and `home.explore.modules[].image` fields and that those assets resolve.
