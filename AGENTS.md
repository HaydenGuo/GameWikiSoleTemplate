# AGENTS.md

## Project purpose

GameWikiSoleTemplate is a single-source Astro 5 game-wiki starter for static deployment to Cloudflare Pages. Runtime, configuration, content examples, validation, search, optional ads, and the `apply-template` initializer live in this repository.

The template must remain generic. A fork supplies the game identity, content, images, video IDs, categories, translations, and deployment values through configuration and content files.

## Read before changing code

- `docs/PRD.md` — architecture, data models, module boundaries, and roadmap.
- `README.md` — user-facing setup path.
- `docs/content-format.md` — article frontmatter, body, links, and media rules.
- `docs/deployment.md` — Cloudflare Pages and environment-variable rules.
- `docs/template-preservation.md` — fork-time preservation contract and baseline check.
- The nearest existing component or article of the same type.

## Change workflow

Work on a task branch, inspect the relevant source and tests, make focused changes, and run the checks for the affected behavior. Keep changes generic and configuration-driven. Do not deploy or change production settings unless separately authorized.

### Change classification and separation

Before editing, choose one primary change class and state the expected file scope:

- **Architecture** — module boundaries, shared contracts, dependency direction, routing/data flow, persistence, or build/deployment structure.
- **Behavior** — runtime, UI, script, validation, or initializer behavior.
- **Format-only** — whitespace, line endings, formatter output, or import ordering with no behavior, configuration, content, or documentation changes.
- **Config/content** — site settings, locale data, copy, assets, or example articles without changing reusable runtime behavior.
- **Docs/process** — instructions, contribution workflow, PR templates, or CI governance.

Keep each pull request focused on one primary class. Split independent work into separate branches or pull requests. In particular, keep format-only changes separate from architecture, behavior, and config/content changes; run formatters only on the explicitly scoped files. Do not reformat an entire file or directory as a side effect of a functional change.

When two classes must ship together because one cannot work or be reviewed without the other, state the dependency and reason in the PR, keep the file scope narrow, and separate the changes into logical commits where practical. Architecture changes must identify the current and target boundary, affected callers/contracts, compatibility or migration impact, and the evidence used to accept the change.

At the start of the task, record the intended paths. Before committing, inspect the changed-path list and diff, explain any scope additions, and keep unrelated pre-existing work out of the commit. Do not stage the whole working tree when unrelated or unreviewed changes are present.

### Stale-material cleanup

For cleanup details, follow the single inventory, dependency, and verification procedure in [workflow-contract.md](docs/workflow-contract.md#旧资料清理流程). Preserve owner data and historical decisions unless the user asks to remove them.

## Source organization

Keep the three layers separate:

```text
Code       src/pages, src/components, src/lib       reusable framework; no game identity
Config     src/config, src/i18n/routing.ts,          per-fork settings and visual identity
           src/styles/globals.css, public/
Content    src/content, src/locales                  articles and translated UI data
```

- Do not put game-specific strings, routes, assets, IDs, or business features into reusable components.
- Do not copy a fork's specialized feature into the template unless it is a generic, configurable capability.
- Do not add React, Vue, Svelte, or another framework runtime. Use native Astro, HTML elements, and minimal vanilla JavaScript.
- Preserve existing user changes and do not delete files outside the requested scope.
- Before fork development, create `docs/template-baseline.json` with `pnpm template-baseline:create`. Run `pnpm template-baseline:check` after each meaningful batch; undeclared deletion of a baseline file is a blocking failure.
- Treat template changes as incremental edits. Read the current file before changing it and preserve unrelated fields, modules, routes, and fallback states. Record any intentional deletion in `allowed_deletions` with the smallest matching path.

## Configuration and style rules

1. UI text belongs in `src/locales/<locale>.json`; components must not hardcode user-facing copy.
2. Navigation keys must match in `src/config/navigation.ts`, locale `nav.<key>`, and `src/content/<locale>/<key>/`. The selected `site.game.navigationProfile` changes ordering and emphasis, not the stable content keys or URL paths.
3. Locale names must match in `src/i18n/routing.ts`, `src/locales/*.json`, and `src/content/<locale>/`.
4. The default locale has no URL prefix; other locales do.
5. Internal links end with `/`; non-default locale article links include the locale prefix.
6. Articles start at H2. The frontmatter `title` supplies the page H1.
7. Single-game sites must select a navigation profile (`rpg`, `mmorpg`, `moba`, `fps`, `battle-royale`, `sandbox`, `strategy`, `simulation`, or `card`) based on the game's primary player tasks. Enable only categories with real content.
8. Theme edits use only the four brand variables: `--brand`, `--brand-light`, `--brand-h`, and `--brand-s` in `:root` and `.dark`. Do not hardcode theme hex, RGB, or RGBA values in components.
9. Use `lucide:` icons through `astro-icon`; do not use emoji as UI icons.
10. Use `SITE_URL` for the site URL. It must include `https://`.
11. Use environment variables for ads and comments. Empty values must disable rendering; never commit credentials or demo secrets.
12. When `wrangler.toml` exists, its `[vars]` section is the Cloudflare Pages environment-variable source of truth. Keep it aligned with deployment docs.
13. The homepage visual baseline includes the animated Hero backdrop, optional lazy YouTube facade, image-led Quick Start cards, and image-led Explore modules. Keep these capabilities generic and driven by locale/config data.

### Homepage YouTube demo

The template ships with a real public YouTube video ID in `src/locales/en.json` under `home.hero.videoId` so the right side of the Hero is visible in a fresh local preview. This is layout/demo content only, not an Anvil Quest trailer or official game source.

When applying the template to a real game, replace all of the following together:

- `home.hero.videoId` — the real 11-character YouTube video ID;
- `home.hero.videoCaption` — an accurate, localized description of that video;
- any game-specific `site.social.youtube` and other official links in `src/config/site.ts`.

Do not keep the demo ID, label it as an official video, or reuse it as evidence for game facts. Leave `videoId` empty or remove the optional fields when the fork has no suitable video. The homepage player remains lazy-loaded and only requests the YouTube iframe after the visitor clicks play.

## Content authoring

Before creating or editing an article:

1. Read `docs/content-format.md`, `src/content.config.ts`, `src/config/navigation.ts`, and one article of the same category.
2. Use valid frontmatter: description 40–165 characters, title no more than 80 characters, a 40–60 word direct-answer `summary`, reused tags, and `draft: true` for unverified material.
3. Never fabricate codes, stats, dates, drops, or other game facts. Ask for missing source data.
4. Every article must contain at least one real local body image rendered with `ArticleImage`; its first body image is automatically used as the cover.
5. Use `<Video>` for inline YouTube videos and register video IDs in frontmatter when required for structured data. The homepage uses `home.hero.videoId` for its optional video.
6. Use `ArticleImage` with imported assets from `src/assets/articles/` for inline article images; provide useful alt text. Keep `public/` for fixed-path site assets such as favicons and verification files.
7. Aim for at least three internal links per article and keep links valid for the article locale.
8. Treat `ImageText` and `GuideFlow` as optional presentation choices. When drafting, consider whether either would make this article clearer, but use neither when ordinary prose or a numbered list is enough. Do not force either component into every article.
9. Use `ImageText` only when a meaningful local image benefits from adjacent explanatory copy; import it from `~/components/mdx/ImageText.astro` and use `imagePosition="left"` or `"right"` as appropriate. Use `GuideFlow` from `~/components/mdx/GuideFlow.astro` for a multi-step procedure with decisions or branches; keep each flow compact (usually 3–4 nodes). Both components are documented in `docs/content-format.md`.

## Game brand mark

When initializing a new game site, create a game-specific mark using the workflow in `docs/brand-mark-workflow.md`. Ground the motif in the game's official/store materials and the target site's theme; do not carry over the GameWikiSoleTemplate mark, invent game lore, or substitute a letter tile. Inspect the result at 16×16 and 32×32 before running `pnpm gen-assets --force`. The generated header, favicon, and mobile icons must all derive from `src/assets/branding/brand-mark.png`.

## Template initializer

Changes to the initial site shape must be reflected in both places:

- the reusable component/config implementation; and
- `scripts/lib/apply-rewrites.ts` or the relevant `apply-template` rewrite path.

When changing initializer behavior:

- keep interactive and `--answers` paths consistent;
- keep reruns safe and avoid deleting user-created content;
- use generic assets and placeholder data, never a real fork's identity;
- generated projects must contain placeholder identity, generic assets, and generic navigation only;
- never copy article titles, game names, game-specific images, video IDs, routes, categories, or feature labels from another site or fork;
- fork-specific behavior must enter through configuration, content, locale, and asset files;
- update `tests/apply-template.test.ts` and the real-mode E2E contract when output shape changes.

## Verification

Run the smallest relevant checks during development, then run the full applicable set before completion:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm check-config
pnpm check-content
pnpm check-i18n --strict-ui
pnpm build
pnpm check-links
pnpm test:e2e
```

`pnpm build` is required after content, route, layout, media, or initializer changes. `pnpm check-links` runs after build. For initializer changes, `pnpm test:e2e` is the acceptance test because it exercises a committed-tree copy and a real generated build.

Report pre-existing failures separately from failures introduced by the current change. Do not claim completion from a successful local preview alone.

## Local development and dependency recovery

- Use `pnpm dev --host 127.0.0.1 --port 4323` for the Astro development server.
- Use `python -m http.server 4331` from `dist/` only for checking an already-built static site.
- A static preview does not prove that the Astro development server or full build is healthy.
- Do not run multiple `pnpm install`, `pnpm dev`, or `pnpm build` processes against this template at the same time.
- If Node reports `ERR_INVALID_PACKAGE_CONFIG`, `node_modules` or the pnpm store may be corrupted. Do not edit the Astro package manually as the primary fix.
- Stop only the template's processes, preserve the existing dependency directory as a backup, and reinstall with a clean pnpm store.
- Prefer a project-specific clean store outside the repository, for example `D:\pnpm-store-template-clean`.
- Use `pnpm install --force --store-dir <clean-store>` and include platform optional dependencies when Rollup or esbuild reports a missing Windows binary.
- Keep dependency repair backups outside committed template output, or remove them after successful verification.
- Verify recovery with `pnpm exec astro --version`, `pnpm build`, and an HTTP request to the local development URL.
- Treat `astro check`, Pagefind failures, and existing project type errors as separate verification results; do not describe them as dependency corruption unless the error confirms it.

## Deployment and external effects

- Default deployment target is Cloudflare Pages with `pnpm build` producing `dist/`.
- Do not deploy, submit indexing URLs, change production settings, publish content, or send external messages without explicit user authorization.
- Before changing license, framework runtime, deployment target, or demo-game identity, confirm with the user and update the PRD/decision record.
- Keep secrets, tokens, service-account files, and local credentials out of the repository and command output.

## Astro 5 constraints

- Use the standalone `render(entry)` function from `astro:content`; `entry.render()` is not supported.
- `getEntry()` receives an ID without `.mdx`; collection IDs may include the extension.
- `getStaticPaths()` is compiled separately; keep its required data inside the function.
- Use `Astro.params` for route parameters returned by `getStaticPaths()`.
- Keep wiki content under `src/content/wiki/` to avoid Astro legacy auto-collection.
